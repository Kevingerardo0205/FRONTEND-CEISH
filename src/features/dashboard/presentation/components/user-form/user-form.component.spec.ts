import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { GetSecurityCatalogUseCase } from '../../../../security/application/security.use-cases';
import { UserRegistrationFormComponent } from './user-form.component';

describe('UserRegistrationFormComponent (Multi-Role & Configuración Granular)', () => {
  let component: UserRegistrationFormComponent;
  let fixture: ComponentFixture<UserRegistrationFormComponent>;
  let mockCatalogUseCase: jasmine.SpyObj<GetSecurityCatalogUseCase>;

  const mockUserToEdit: UserAdmin = {
    id: '5',
    cedula: '0601234567',
    nombre: 'Dra. Ana Ramos',
    email: 'ana.ramos@espoch.edu.ec',
    rol: 'EVALUADOR',
    roles: ['EVALUADOR', 'SECRETARIA'],
    userRoles: [
      { code: 'EVALUADOR', name: 'Evaluador', isExpired: false },
      { 
        code: 'SECRETARIA', 
        name: 'Secretaría', 
        validUntil: '2026-09-30T00:00:00.000Z', 
        reason: 'Subrogación por maternidad', 
        isExpired: false 
      }
    ],
    perfil: 'Docente Evaluador',
    activo: true
  };

  beforeEach(async () => {
    mockCatalogUseCase = jasmine.createSpyObj('GetSecurityCatalogUseCase', ['execute']);
    mockCatalogUseCase.execute.and.returnValue(of({
      modules: [],
      allPermissions: [],
      roles: [
        { id: 1, code: 'ADMIN_TI', name: 'Administrador TI', isActive: true },
        { id: 2, code: 'SECRETARIA', name: 'Secretaría', isActive: true },
        { id: 3, code: 'EVALUADOR', name: 'Evaluador', isActive: true },
        { id: 4, code: 'INVESTIGADOR', name: 'Investigador', isActive: true }
      ]
    }));

    await TestBed.configureTestingModule({
      imports: [UserRegistrationFormComponent, NoopAnimationsModule],
      providers: [
        { provide: GetSecurityCatalogUseCase, useValue: mockCatalogUseCase }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserRegistrationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe inicializarse con el formulario reactivo y cargar roles dinámicos', () => {
    expect(component).toBeTruthy();
    expect(component.availableRoles().length).toBe(4);
    expect(component.userForm.valid).toBeFalse();
  });

  it('debe validar que la cédula contenga exactamente 10 dígitos numéricos', () => {
    const cedulaCtrl = component.userForm.get('cedula');
    
    cedulaCtrl?.setValue('123');
    expect(cedulaCtrl?.valid).toBeFalse();

    cedulaCtrl?.setValue('060123456A');
    expect(cedulaCtrl?.valid).toBeFalse();

    cedulaCtrl?.setValue('0601234567');
    expect(cedulaCtrl?.valid).toBeTrue();
  });

  it('debe precargar datos del usuario y configurar la matriz granular de suplencias cuando se pasa userToEdit', () => {
    fixture.componentRef.setInput('userToEdit', mockUserToEdit);
    fixture.detectChanges();

    expect(component.userForm.get('nombre')?.value).toBe('Dra. Ana Ramos');
    expect(component.userForm.get('email')?.value).toBe('ana.ramos@espoch.edu.ec');
    expect(component.userForm.get('roles')?.value).toEqual(['EVALUADOR', 'SECRETARIA']);
    expect(component.userForm.valid).toBeTrue();

    const configs = component.rolesConfig();
    expect(configs.length).toBe(2);

    const evaluadorConfig = configs.find(c => c.code === 'EVALUADOR');
    expect(evaluadorConfig?.isTemporal).toBeFalse();

    const secretariaConfig = configs.find(c => c.code === 'SECRETARIA');
    expect(secretariaConfig?.isTemporal).toBeTrue();
    expect(secretariaConfig?.validUntil).toBe('2026-09-30');
    expect(secretariaConfig?.reason).toBe('Subrogación por maternidad');
  });

  it('debe permitir configurar de forma granular múltiples suplencias con fechas y motivos independientes', () => {
    spyOn(component.save, 'emit');

    component.userForm.patchValue({
      cedula: '0609876543',
      nombre: 'Ing. Mateo Castro',
      email: 'mateo.castro@espoch.edu.ec',
      roles: ['PRESIDENTE', 'SECRETARIA', 'EVALUADOR'],
      perfil: 'Docente y Miembro de Comité',
      activo: true
    });

    // Configurar SECRETARIA como suplencia
    component.toggleRoleTemporal('SECRETARIA', true);
    component.updateRoleValidUntil('SECRETARIA', '2026-09-15');
    component.updateRoleReason('SECRETARIA', 'Subrogación vacaciones');

    // Configurar EVALUADOR como suplencia
    component.toggleRoleTemporal('EVALUADOR', true);
    component.updateRoleValidUntil('EVALUADOR', '2026-12-31');
    component.updateRoleReason('EVALUADOR', 'Comisión ética 2026');

    component.submit();

    expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      cedula: '0609876543',
      nombre: 'Ing. Mateo Castro',
      email: 'mateo.castro@espoch.edu.ec',
      roles: ['PRESIDENTE', 'SECRETARIA', 'EVALUADOR'],
      rol: 'PRESIDENTE',
      userRoles: [
        {
          code: 'PRESIDENTE',
          name: jasmine.any(String),
          validUntil: null,
          reason: null,
          isExpired: false
        },
        {
          code: 'SECRETARIA',
          name: jasmine.any(String),
          validUntil: '2026-09-15',
          reason: 'Subrogación vacaciones',
          isExpired: false
        },
        {
          code: 'EVALUADOR',
          name: jasmine.any(String),
          validUntil: '2026-12-31',
          reason: 'Comisión ética 2026',
          isExpired: false
        }
      ],
      perfil: 'Docente y Miembro de Comité',
      activo: true
    }));
  });

  it('debe aplicar la regla de exclusividad SoD desmarcando roles incompatibles cuando se selecciona INVESTIGADOR', () => {
    // Caso 1: Tenía roles de comité y se selecciona INVESTIGADOR
    component.userForm.get('roles')?.setValue(['SECRETARIA', 'EVALUADOR']);
    expect(component.rolesConfig().map(c => c.code)).toEqual(['SECRETARIA', 'EVALUADOR']);
    expect(component.isInvestigadorSelected()).toBeFalse();

    // Selecciona INVESTIGADOR -> Se deben remover los de comité
    component.userForm.get('roles')?.setValue(['SECRETARIA', 'EVALUADOR', 'INVESTIGADOR']);
    expect(component.userForm.get('roles')?.value).toEqual(['INVESTIGADOR']);
    expect(component.isInvestigadorSelected()).toBeTrue();

    // Caso 2: Tenía INVESTIGADOR y selecciona un rol de comité -> Se remueve INVESTIGADOR
    component.userForm.get('roles')?.setValue(['INVESTIGADOR', 'SECRETARIA']);
    expect(component.userForm.get('roles')?.value).toEqual(['SECRETARIA']);
    expect(component.isInvestigadorSelected()).toBeFalse();
  });

  it('debe aplicar presets de fecha rápida correctamente mediante applyDatePreset', () => {
    component.userForm.patchValue({
      roles: ['SECRETARIA']
    });

    component.applyDatePreset('SECRETARIA', '15d');
    const config15d = component.rolesConfig().find(c => c.code === 'SECRETARIA');
    expect(config15d?.validUntil).toBeTruthy();

    component.applyDatePreset('SECRETARIA', 'end_year');
    const configEndYear = component.rolesConfig().find(c => c.code === 'SECRETARIA');
    expect(configEndYear?.validUntil).toContain('-12-31');
  });

  it('debe calcular el texto de días restantes con getDaysRemainingText', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split('T')[0];

    const text = component.getDaysRemainingText(dateStr);
    expect(text).toContain('Vigente durante');

    expect(component.getDaysRemainingText('')).toBe('');
    expect(component.getDaysRemainingText('2020-01-01')).toBe('Expirado');
  });

  it('debe resetear el formulario y vaciar la matriz al hacer clic en descartar cambios', () => {
    spyOn(component.cancel, 'emit');
    component.onCancel();

    expect(component.rolesConfig()).toEqual([]);
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});
