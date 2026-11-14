import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  SecurityModule,
  SecurityPermission,
  SecurityRole,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleComplianceStatus,
  RolePresetsMap,
} from '@domain/entities/security.entity';
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
  SecurityCatalog,
} from './security.use-cases';
import { RolePermissionsState } from './role-permissions.state';

describe('RolePermissionsState', () => {
  let state: RolePermissionsState;
  let mockGetCatalog: jasmine.SpyObj<GetSecurityCatalogUseCase>;
  let mockGetRolePermissions: jasmine.SpyObj<GetRolePermissionsUseCase>;
  let mockUpdateRolePermissions: jasmine.SpyObj<UpdateRolePermissionsUseCase>;
  let mockCreateRole: jasmine.SpyObj<CreateRoleUseCase>;
  let mockUpdateRole: jasmine.SpyObj<UpdateRoleUseCase>;
  let mockDeleteRole: jasmine.SpyObj<DeleteRoleUseCase>;
  let mockGetRolePresets: jasmine.SpyObj<GetRolePresetsUseCase>;
  let mockGetRoleCompliance: jasmine.SpyObj<GetRoleComplianceUseCase>;
  let mockResetRolePreset: jasmine.SpyObj<ResetRolePresetUseCase>;

  const mockModules: SecurityModule[] = [
    { id: 1, code: 'RECEPCION', name: 'Recepción', icon: 'folder', order: 1, isActive: true },
    { id: 2, code: 'EVALUACION', name: 'Evaluaciones', icon: 'gavel', order: 2, isActive: true },
  ];

  const mockPermissions: SecurityPermission[] = [
    { id: 10, code: 'RECEPCION_NUEVO', name: 'Recepción Nueva', moduleId: 1 },
    { id: 11, code: 'RECEPCION_VALIDAR', name: 'Validar Documentos', moduleId: 1 },
    { id: 20, code: 'EVALUACION_RIESGO', name: 'Nivel de Riesgo', moduleId: 2 },
  ];

  const mockRoles: SecurityRole[] = [
    { id: 1, code: 'ADMIN', name: 'Administrador', isActive: true, permissions: [] },
    { id: 2, code: 'SECRETARIA', name: 'Secretaría', isActive: true, permissions: [] },
  ];

  const mockCatalog: SecurityCatalog = {
    modules: mockModules,
    allPermissions: mockPermissions,
    roles: mockRoles,
  };

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

  beforeEach(() => {
    mockGetCatalog = jasmine.createSpyObj<GetSecurityCatalogUseCase>('GetSecurityCatalogUseCase', [
      'execute',
    ]);
    mockGetRolePermissions = jasmine.createSpyObj<GetRolePermissionsUseCase>(
      'GetRolePermissionsUseCase',
      ['execute'],
    );
    mockUpdateRolePermissions = jasmine.createSpyObj<UpdateRolePermissionsUseCase>(
      'UpdateRolePermissionsUseCase',
      ['execute'],
    );
    mockCreateRole = jasmine.createSpyObj<CreateRoleUseCase>('CreateRoleUseCase', ['execute']);
    mockUpdateRole = jasmine.createSpyObj<UpdateRoleUseCase>('UpdateRoleUseCase', ['execute']);
    mockDeleteRole = jasmine.createSpyObj<DeleteRoleUseCase>('DeleteRoleUseCase', ['execute']);
    mockGetRolePresets = jasmine.createSpyObj<GetRolePresetsUseCase>('GetRolePresetsUseCase', [
      'execute',
    ]);
    mockGetRoleCompliance = jasmine.createSpyObj<GetRoleComplianceUseCase>(
      'GetRoleComplianceUseCase',
      ['execute'],
    );
    mockResetRolePreset = jasmine.createSpyObj<ResetRolePresetUseCase>('ResetRolePresetUseCase', [
      'execute',
    ]);

    mockGetRoleCompliance.execute.and.returnValue(of(mockCompliance));

    TestBed.configureTestingModule({
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
    });

    state = TestBed.inject(RolePermissionsState);
  });

  it('debe inicializarse con señales limpias', () => {
    expect(state.roles()).toEqual([]);
    expect(state.modules()).toEqual([]);
    expect(state.permissions()).toEqual([]);
    expect(state.selectedRoleId()).toBeNull();
    expect(state.isDirty()).toBeFalse();
    expect(state.activePermsCount()).toBe(0);
  });

  describe('loadCatalog', () => {
    it('debe cargar y sincronizar los catálogos en las señales', (done) => {
      mockGetCatalog.execute.and.returnValue(of(mockCatalog));

      state.loadCatalog().subscribe((res) => {
        expect(res).toEqual(mockCatalog);
        expect(state.roles().length).toBe(2);
        expect(state.modules().length).toBe(2);
        expect(state.permissions().length).toBe(3);
        expect(state.loadingCatalog()).toBeFalse();
        done();
      });
    });
  });

  describe('selectRole', () => {
    it('debe seleccionar un rol y cargar sus permisos y compliance', (done) => {
      state.roles.set(mockRoles);
      const rolePerms = [mockPermissions[0]]; // Permiso 10
      mockGetRolePermissions.execute.and.returnValue(of(rolePerms));

      state.selectRole(2).subscribe((perms) => {
        expect(perms).toEqual(rolePerms);
        expect(state.selectedRoleId()).toBe(2);
        expect(state.selectedRole()?.name).toBe('Secretaría');
        expect(state.initialPermissionsSet().has(10)).toBeTrue();
        expect(state.currentPermissionsSet().has(10)).toBeTrue();
        expect(state.isDirty()).toBeFalse();
        expect(state.activePermsCount()).toBe(1);
        expect(mockGetRoleCompliance.execute).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe('togglePermission e isDirty', () => {
    beforeEach(() => {
      state.initialPermissionsSet.set(new Set([10]));
      state.currentPermissionsSet.set(new Set([10]));
    });

    it('debe marcar cambios como sucios (isDirty = true) al agregar un permiso', () => {
      state.togglePermission(11, true);
      expect(state.currentPermissionsSet().has(11)).toBeTrue();
      expect(state.isDirty()).toBeTrue();
      expect(state.diffSummary().added).toEqual([11]);
      expect(state.diffSummary().removed).toEqual([]);
      expect(state.diffSummary().total).toBe(1);
    });

    it('debe marcar cambios como sucios al remover un permiso previo', () => {
      state.togglePermission(10, false);
      expect(state.currentPermissionsSet().has(10)).toBeFalse();
      expect(state.isDirty()).toBeTrue();
      expect(state.diffSummary().removed).toEqual([10]);
    });

    it('debe restablecer los cambios con resetChanges()', () => {
      state.togglePermission(20, true);
      expect(state.isDirty()).toBeTrue();

      state.resetChanges();
      expect(state.isDirty()).toBeFalse();
      expect(state.currentPermissionsSet().has(20)).toBeFalse();
      expect(state.currentPermissionsSet().has(10)).toBeTrue();
    });
  });

  describe('Compliance y Presets', () => {
    it('debe cargar presets oficiales en la señal presets', (done) => {
      const presetsMap: RolePresetsMap = {
        SECRETARIA: ['RECEPCION_NUEVO', 'RECEPCION_VALIDAR'],
      };
      mockGetRolePresets.execute.and.returnValue(of(presetsMap));

      state.loadPresets().subscribe((res) => {
        expect(res).toEqual(presetsMap);
        expect(state.presets()['SECRETARIA'].length).toBe(2);
        done();
      });
    });

    it('debe restablecer el rol actual a su plantilla oficial con resetCurrentRoleToPreset()', (done) => {
      state.roles.set(mockRoles);
      state.selectedRoleId.set(2);
      const restoredRole: SecurityRole = {
        id: 2,
        code: 'SECRETARIA',
        name: 'Secretaría',
        isActive: true,
        permissions: [mockPermissions[0], mockPermissions[1]],
      };
      mockResetRolePreset.execute.and.returnValue(of(restoredRole));

      state.resetCurrentRoleToPreset().subscribe((res) => {
        expect(res).toEqual(restoredRole);
        expect(state.initialPermissionsSet().has(10)).toBeTrue();
        expect(state.initialPermissionsSet().has(11)).toBeTrue();
        expect(state.selectedRoleCompliance()?.status).toBe('STANDARD');
        expect(state.isDirty()).toBeFalse();
        done();
      });
    });
  });

  describe('getModuleCheckState y toggleModulePermissions', () => {
    const mod1Perms = [mockPermissions[0], mockPermissions[1]]; // [10, 11]

    it('debe retornar unchecked si ningún permiso del módulo está seleccionado', () => {
      state.currentPermissionsSet.set(new Set());
      expect(state.getModuleCheckState(mod1Perms)).toBe('unchecked');
    });

    it('debe retornar indeterminate si solo algunos permisos están seleccionados', () => {
      state.currentPermissionsSet.set(new Set([10]));
      expect(state.getModuleCheckState(mod1Perms)).toBe('indeterminate');
    });

    it('debe retornar checked si todos los permisos del módulo están seleccionados', () => {
      state.currentPermissionsSet.set(new Set([10, 11]));
      expect(state.getModuleCheckState(mod1Perms)).toBe('checked');
    });

    it('debe marcar todos los permisos de un módulo en un solo llamado', () => {
      state.currentPermissionsSet.set(new Set());
      state.toggleModulePermissions(mod1Perms, true);
      expect(state.currentPermissionsSet().has(10)).toBeTrue();
      expect(state.currentPermissionsSet().has(11)).toBeTrue();
    });
  });

  describe('savePermissions', () => {
    it('debe invocar el caso de uso y actualizar el snapshot inicial', (done) => {
      state.roles.set(mockRoles);
      state.permissions.set(mockPermissions);
      state.selectedRoleId.set(2);
      state.initialPermissionsSet.set(new Set([10]));
      state.currentPermissionsSet.set(new Set([10, 11]));

      mockUpdateRolePermissions.execute.and.returnValue(of(undefined));

      state.savePermissions().subscribe(() => {
        expect(mockUpdateRolePermissions.execute).toHaveBeenCalledWith(2, [10, 11]);
        expect(state.isDirty()).toBeFalse();
        expect(state.initialPermissionsSet().has(11)).toBeTrue();
        done();
      });
    });
  });

  describe('createRole, updateRole y deleteRole', () => {
    it('debe crear un rol y agregarlo a la señal roles', (done) => {
      const newDTO: CreateRoleDTO = { code: 'NUEVO', name: 'Nuevo Rol', description: 'Desc' };
      const created: SecurityRole = { id: 10, ...newDTO, isActive: true };
      mockCreateRole.execute.and.returnValue(of(created));

      state.createRole(newDTO).subscribe((res) => {
        expect(res).toEqual(created);
        expect(state.roles().some((r) => r.id === 10)).toBeTrue();
        done();
      });
    });

    it('debe actualizar un rol existente en la señal roles', (done) => {
      state.roles.set([{ id: 5, code: 'VIEJO', name: 'Viejo', isActive: true }]);
      const updateDTO: UpdateRoleDTO = { name: 'Actualizado' };
      const updated: SecurityRole = { id: 5, code: 'VIEJO', name: 'Actualizado', isActive: true };
      mockUpdateRole.execute.and.returnValue(of(updated));

      state.updateRole(5, updateDTO).subscribe((res) => {
        expect(res).toEqual(updated);
        expect(state.roles().find((r) => r.id === 5)?.name).toBe('Actualizado');
        done();
      });
    });

    it('debe eliminar el rol de la lista y limpiar selección si era el activo', (done) => {
      state.roles.set([{ id: 5, code: 'ROL5', name: 'Rol 5', isActive: true }]);
      state.selectedRoleId.set(5);
      mockDeleteRole.execute.and.returnValue(of(undefined));

      state.deleteRole(5).subscribe(() => {
        expect(state.roles().length).toBe(0);
        expect(state.selectedRoleId()).toBeNull();
        done();
      });
    });
  });

  describe('Búsqueda reactiva (searchQuery)', () => {
    beforeEach(() => {
      state.modules.set(mockModules);
      state.permissions.set(mockPermissions);
    });

    it('debe filtrar módulos y permisos reactivamente según el texto de búsqueda', () => {
      state.setSearchQuery('Riesgo');
      const groups = state.permissionsByModule();
      expect(groups.length).toBe(1);
      expect(groups[0].moduleCode).toBe('EVALUACION');
      expect(groups[0].permissions[0].code).toBe('EVALUACION_RIESGO');
    });
  });
});
