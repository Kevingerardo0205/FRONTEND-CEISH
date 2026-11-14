import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import {
  SecurityModule,
  SecurityPermission,
  SecurityRole,
  RoleComplianceStatus,
} from '@domain/entities/security.entity';
import { RolePermissionsState } from '../../../application/role-permissions.state';
import {
  GetSecurityCatalogUseCase,
  GetRolePermissionsUseCase,
  UpdateRolePermissionsUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetRolePresetsUseCase,
  GetRoleComplianceUseCase,
  ResetRolePresetUseCase,
} from '../../../application/security.use-cases';
import { RoleMatrixComponent } from './role-matrix.component';

describe('RoleMatrixComponent', () => {
  let component: RoleMatrixComponent;
  let fixture: ComponentFixture<RoleMatrixComponent>;
  let state: RolePermissionsState;

  const mockModules: SecurityModule[] = [
    { id: 1, code: 'RECEPCION', name: 'Recepción', icon: 'folder', order: 1, isActive: true },
  ];

  const mockPermissions: SecurityPermission[] = [
    { id: 10, code: 'RECEPCION_NUEVO', name: 'Recepción Nueva', moduleId: 1 },
    { id: 11, code: 'RECEPCION_VALIDAR', name: 'Validar Documentos', moduleId: 1 },
  ];

  const mockRoles: SecurityRole[] = [
    {
      id: 2,
      code: 'SECRETARIA',
      name: 'Secretaría',
      isActive: true,
      permissions: [mockPermissions[0]],
    },
  ];

  const mockCompliance: RoleComplianceStatus = {
    roleId: 2,
    roleCode: 'SECRETARIA',
    status: 'STANDARD',
    isCompliant: true,
    missingPermissions: [],
    extraPermissions: [],
    currentPermissionCount: 1,
    expectedPermissionCount: 1,
  };

  beforeEach(async () => {
    const mockGetCatalog = jasmine.createSpyObj('GetSecurityCatalogUseCase', ['execute']);
    const mockGetRolePermissions = jasmine.createSpyObj('GetRolePermissionsUseCase', ['execute']);
    const mockUpdateRolePermissions = jasmine.createSpyObj('UpdateRolePermissionsUseCase', [
      'execute',
    ]);
    const mockCreateRole = jasmine.createSpyObj('CreateRoleUseCase', ['execute']);
    const mockUpdateRole = jasmine.createSpyObj('UpdateRoleUseCase', ['execute']);
    const mockDeleteRole = jasmine.createSpyObj('DeleteRoleUseCase', ['execute']);
    const mockGetRolePresets = jasmine.createSpyObj('GetRolePresetsUseCase', ['execute']);
    const mockGetRoleCompliance = jasmine.createSpyObj('GetRoleComplianceUseCase', ['execute']);
    const mockResetRolePreset = jasmine.createSpyObj('ResetRolePresetUseCase', ['execute']);

    mockGetCatalog.execute.and.returnValue(
      of({
        modules: mockModules,
        allPermissions: mockPermissions,
        roles: mockRoles,
      }),
    );
    mockGetRoleCompliance.execute.and.returnValue(of(mockCompliance));

    await TestBed.configureTestingModule({
      imports: [RoleMatrixComponent, NoopAnimationsModule],
      providers: [
        RolePermissionsState,
        { provide: GetSecurityCatalogUseCase, useValue: mockGetCatalog },
        { provide: GetRolePermissionsUseCase, useValue: mockGetRolePermissions },
        { provide: UpdateRolePermissionsUseCase, useValue: mockUpdateRolePermissions },
        { provide: CreateRoleUseCase, useValue: mockCreateRole },
        { provide: UpdateRoleUseCase, useValue: mockUpdateRole },
        { provide: DeleteRoleUseCase, useValue: mockDeleteRole },
        { provide: GetRolePresetsUseCase, useValue: mockGetRolePresets },
        { provide: GetRoleComplianceUseCase, useValue: mockGetRoleCompliance },
        { provide: ResetRolePresetUseCase, useValue: mockResetRolePreset },
      ],
    }).compileComponents();

    state = TestBed.inject(RolePermissionsState);
    state.roles.set(mockRoles);
    state.modules.set(mockModules);
    state.permissions.set(mockPermissions);
    state.selectedRoleId.set(2);
    state.currentPermissionsSet.set(new Set([10]));

    const map = new Map<number, RoleComplianceStatus>();
    map.set(2, mockCompliance);
    state.complianceMap.set(map);

    fixture = TestBed.createComponent(RoleMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con el estado inyectado', () => {
    expect(component).toBeTruthy();
    expect(component.state.selectedRoleId()).toBe(2);
  });

  it('debe calcular correctamente el estado tri-state del módulo', () => {
    // 1 de 2 permisos seleccionados => indeterminate
    expect(component.isModuleIndeterminate(mockPermissions)).toBeTrue();
    expect(component.isModuleChecked(mockPermissions)).toBeFalse();

    // Seleccionar el segundo permiso => checked
    state.currentPermissionsSet.set(new Set([10, 11]));
    expect(component.isModuleChecked(mockPermissions)).toBeTrue();
    expect(component.isModuleIndeterminate(mockPermissions)).toBeFalse();

    // Ninguno seleccionado => unchecked
    state.currentPermissionsSet.set(new Set());
    expect(component.isModuleChecked(mockPermissions)).toBeFalse();
    expect(component.isModuleIndeterminate(mockPermissions)).toBeFalse();
  });

  it('debe emitir eventos de rol y restablecimiento al interactuar con la vista', () => {
    spyOn(component.roleSelect, 'emit');
    spyOn(component.createRole, 'emit');
    spyOn(component.editRole, 'emit');
    spyOn(component.deleteRole, 'emit');
    spyOn(component.savePermissions, 'emit');
    spyOn(component.resetPreset, 'emit');

    component.onRoleClick(2);
    expect(component.roleSelect.emit).toHaveBeenCalledWith(2);

    component.onCreateRoleClick();
    expect(component.createRole.emit).toHaveBeenCalled();

    component.onEditRoleClick(mockRoles[0]);
    expect(component.editRole.emit).toHaveBeenCalledWith(mockRoles[0]);

    component.onDeleteRoleClick(mockRoles[0]);
    expect(component.deleteRole.emit).toHaveBeenCalledWith(mockRoles[0]);

    component.onSaveClick();
    expect(component.savePermissions.emit).toHaveBeenCalled();

    component.onResetPresetClick();
    expect(component.resetPreset.emit).toHaveBeenCalled();
  });

  it('debe generar tooltips descriptivos para compliance STANDARD y CUSTOM', () => {
    const tooltipStandard = component.getComplianceTooltip(mockCompliance);
    expect(tooltipStandard).toContain('plantilla normativa reglamentada');

    const customComp: RoleComplianceStatus = {
      roleId: 2,
      roleCode: 'SECRETARIA',
      status: 'CUSTOM',
      isCompliant: false,
      missingPermissions: ['RECEPCION_VALIDAR'],
      extraPermissions: ['ADMIN_ALL'],
      currentPermissionCount: 1,
      expectedPermissionCount: 2,
    };

    const tooltipCustom = component.getComplianceTooltip(customComp);
    expect(tooltipCustom).toContain('Faltantes: RECEPCION_VALIDAR');
    expect(tooltipCustom).toContain('Extras: ADMIN_ALL');
  });

  it('debe alternar el estado del permiso al hacer clic en la fila', () => {
    state.currentPermissionsSet.set(new Set([10]));
    component.onPermRowClick(11);
    expect(state.currentPermissionsSet().has(11)).toBeTrue();

    component.onPermRowClick(10);
    expect(state.currentPermissionsSet().has(10)).toBeFalse();
  });
});
