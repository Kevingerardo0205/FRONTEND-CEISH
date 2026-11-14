import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { UserTableComponent } from './user-table.component';

describe('UserTableComponent (Multi-Role & Suplencias)', () => {
  let component: UserTableComponent;
  let fixture: ComponentFixture<UserTableComponent>;

  const mockUsers: UserAdmin[] = [
    {
      id: '1',
      cedula: '0601234567',
      nombre: 'Dra. María López',
      email: 'maria.lopez@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR', 'SECRETARIA'],
      userRoles: [
        { code: 'INVESTIGADOR', name: 'Investigador', isExpired: false },
        {
          code: 'SECRETARIA',
          name: 'Secretaria Suplente',
          validFrom: '2026-09-01T00:00:00.000Z',
          validUntil: '2026-09-30T23:59:59.000Z',
          reason: 'Subrogación por vacaciones',
          isExpired: false,
        },
      ],
      perfil: 'Docente Investigador',
      activo: true,
    },
    {
      id: '2',
      cedula: '0607654321',
      nombre: 'Dr. Juan Pérez',
      email: 'juan.perez@espoch.edu.ec',
      rol: 'EVALUADOR',
      roles: ['EVALUADOR'],
      userRoles: [
        {
          code: 'EVALUADOR',
          name: 'Evaluador Par',
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-05-01T00:00:00.000Z',
          reason: 'Comisión temporal',
          isExpired: true,
        },
      ],
      perfil: 'Evaluador de Ética',
      activo: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTableComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UserTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('users', mockUsers);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar la tabla con las columnas configuradas', () => {
    expect(component).toBeTruthy();
    expect(component.displayedColumns).toEqual([
      'cedula',
      'nombre',
      'email',
      'rol',
      'estado',
      'acciones',
    ]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('tr[mat-row]').length).toBe(2);
  });

  it('debe renderizar badges de suplencias activas con icono ⏳ y fechas', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const temporalBadges = compiled.querySelectorAll('.badge.temporal');
    expect(temporalBadges.length).toBe(1);
    expect(temporalBadges[0].textContent).toContain('⏳');
    expect(temporalBadges[0].textContent).toContain('Secretaria Suplente');
  });

  it('debe renderizar badges de suplencias expiradas con icono ⌛ y clase expired', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const expiredBadges = compiled.querySelectorAll('.badge.expired');
    expect(expiredBadges.length).toBe(1);
    expect(expiredBadges[0].textContent).toContain('⌛');
    expect(expiredBadges[0].textContent).toContain('Expirado');
  });

  it('debe generar tooltips informativos con motivos de suplencia', () => {
    const permanentTooltip = component.getRoleTooltip({
      code: 'INVESTIGADOR',
      name: 'Investigador',
    });
    expect(permanentTooltip).toContain('Rol permanente: Investigador');

    const activeTooltip = component.getRoleTooltip({
      code: 'SECRETARIA',
      name: 'Secretaria Suplente',
      validUntil: '2026-09-30T00:00:00.000Z',
      reason: 'Subrogación',
      isExpired: false,
    });
    expect(activeTooltip).toContain('⏳ Suplencia temporal vigente hasta');
    expect(activeTooltip).toContain('Motivo: Subrogación');

    const expiredTooltip = component.getRoleTooltip({
      code: 'EVALUADOR',
      name: 'Evaluador',
      validUntil: '2026-05-01T00:00:00.000Z',
      reason: 'Comisión terminada',
      isExpired: true,
    });
    expect(expiredTooltip).toContain('⌛ Suplencia finalizada');
  });

  it('debe emitir el evento edit al hacer clic en el botón de edición', () => {
    spyOn(component.edit, 'emit');
    const compiled = fixture.nativeElement as HTMLElement;
    const editBtn = compiled.querySelector('.action-btn.edit') as HTMLButtonElement;
    editBtn.click();

    expect(component.edit.emit).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('debe emitir el evento delete al hacer clic en el botón de revocación', () => {
    spyOn(component.delete, 'emit');
    const compiled = fixture.nativeElement as HTMLElement;
    const deleteBtn = compiled.querySelector('.action-btn.delete') as HTMLButtonElement;
    deleteBtn.click();

    expect(component.delete.emit).toHaveBeenCalledWith(mockUsers[0]);
  });
});
