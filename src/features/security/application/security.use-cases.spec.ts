import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ISecurityRepositoryPort } from '@domain/ports/ISecurityRepositoryPort';
import { 
  SecurityModule, 
  SecurityPermission, 
  SecurityRole, 
  CreateRoleDTO, 
  UpdateRoleDTO,
  CreateModuleDTO,
  CreatePermissionDTO,
  RoleComplianceStatus,
  RolePresetsMap
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
  ManageSecurityModuleUseCase,
  ManageSecurityPermissionUseCase
} from './security.use-cases';

describe('Security Use Cases', () => {
  let mockRepository: jasmine.SpyObj<ISecurityRepositoryPort>;

  const mockModules: SecurityModule[] = [
    { id: 1, code: 'RECEPCION', name: 'Recepción', icon: 'folder', order: 1, isActive: true }
  ];

  const mockPermissions: SecurityPermission[] = [
    { id: 10, code: 'RECEPCION_NUEVO', name: 'Recepción Nueva', moduleId: 1 }
  ];

  const mockRoles: SecurityRole[] = [
    { id: 2, code: 'SECRETARIA', name: 'Secretaría', description: 'Rol de secretaría', isActive: true, permissions: mockPermissions }
  ];

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj<ISecurityRepositoryPort>('ISecurityRepositoryPort', [
      'getModules',
      'getPermissions',
      'getRoles',
      'getRolePermissions',
      'updateRolePermissions',
      'createRole',
      'updateRole',
      'deleteRole',
      'getRolePresets',
      'getRoleCompliance',
      'resetRoleToPreset',
      'createModule',
      'updateModule',
      'deleteModule',
      'createPermission',
      'updatePermission',
      'deletePermission'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ISecurityRepositoryPort, useValue: mockRepository },
        GetSecurityCatalogUseCase,
        GetRolePermissionsUseCase,
        UpdateRolePermissionsUseCase,
        CreateRoleUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
        GetRolePresetsUseCase,
        GetRoleComplianceUseCase,
        ResetRolePresetUseCase,
        ManageSecurityModuleUseCase,
        ManageSecurityPermissionUseCase
      ]
    });
  });

  describe('GetSecurityCatalogUseCase', () => {
    it('debe obtener el catálogo completo en paralelo (módulos, permisos y roles)', (done) => {
      mockRepository.getModules.and.returnValue(of(mockModules));
      mockRepository.getPermissions.and.returnValue(of(mockPermissions));
      mockRepository.getRoles.and.returnValue(of(mockRoles));

      const useCase = TestBed.inject(GetSecurityCatalogUseCase);
      useCase.execute().subscribe((catalog) => {
        expect(catalog.modules).toEqual(mockModules);
        expect(catalog.allPermissions).toEqual(mockPermissions);
        expect(catalog.roles).toEqual(mockRoles);
        expect(mockRepository.getModules).toHaveBeenCalled();
        expect(mockRepository.getPermissions).toHaveBeenCalled();
        expect(mockRepository.getRoles).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('GetRolePermissionsUseCase', () => {
    it('debe obtener los permisos específicos del rol', (done) => {
      mockRepository.getRolePermissions.and.returnValue(of(mockPermissions));

      const useCase = TestBed.inject(GetRolePermissionsUseCase);
      useCase.execute(2).subscribe((perms) => {
        expect(perms).toEqual(mockPermissions);
        expect(mockRepository.getRolePermissions).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe('UpdateRolePermissionsUseCase', () => {
    it('debe llamar al repositorio para actualizar permisos con el DTO adecuado', (done) => {
      mockRepository.updateRolePermissions.and.returnValue(of(undefined));

      const useCase = TestBed.inject(UpdateRolePermissionsUseCase);
      useCase.execute(2, [10, 11]).subscribe(() => {
        expect(mockRepository.updateRolePermissions).toHaveBeenCalledWith(2, { permissionIds: [10, 11] });
        done();
      });
    });
  });

  describe('CreateRoleUseCase', () => {
    it('debe crear un nuevo rol y retornar la entidad persistida', (done) => {
      const newRoleDTO: CreateRoleDTO = {
        code: 'EVALUADOR_EXTERNO',
        name: 'Evaluador Externo',
        description: 'Par evaluador invitado'
      };
      const createdRole: SecurityRole = { id: 5, ...newRoleDTO, isActive: true };
      mockRepository.createRole.and.returnValue(of(createdRole));

      const useCase = TestBed.inject(CreateRoleUseCase);
      useCase.execute(newRoleDTO).subscribe((res) => {
        expect(res).toEqual(createdRole);
        expect(mockRepository.createRole).toHaveBeenCalledWith(newRoleDTO);
        done();
      });
    });
  });

  describe('UpdateRoleUseCase', () => {
    it('debe actualizar campos del rol', (done) => {
      const updateDTO: UpdateRoleDTO = { name: 'Secretaría General' };
      const updatedRole: SecurityRole = { id: 2, code: 'SECRETARIA', name: 'Secretaría General', isActive: true };
      mockRepository.updateRole.and.returnValue(of(updatedRole));

      const useCase = TestBed.inject(UpdateRoleUseCase);
      useCase.execute(2, updateDTO).subscribe((res) => {
        expect(res).toEqual(updatedRole);
        expect(mockRepository.updateRole).toHaveBeenCalledWith(2, updateDTO);
        done();
      });
    });
  });

  describe('DeleteRoleUseCase', () => {
    it('debe invocar la eliminación lógica del rol', (done) => {
      mockRepository.deleteRole.and.returnValue(of(undefined));

      const useCase = TestBed.inject(DeleteRoleUseCase);
      useCase.execute(2).subscribe(() => {
        expect(mockRepository.deleteRole).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe('GetRolePresetsUseCase', () => {
    it('debe consultar el mapa de plantillas oficiales', (done) => {
      const mockPresets: RolePresetsMap = {
        SECRETARIA: ['RECEPCION_NUEVO', 'RECEPCION_VALIDAR']
      };
      mockRepository.getRolePresets.and.returnValue(of(mockPresets));

      const useCase = TestBed.inject(GetRolePresetsUseCase);
      useCase.execute().subscribe((presets) => {
        expect(presets).toEqual(mockPresets);
        expect(mockRepository.getRolePresets).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('GetRoleComplianceUseCase', () => {
    it('debe consultar el estado de cumplimiento del rol', (done) => {
      const mockCompliance: RoleComplianceStatus = {
        roleId: 2,
        roleCode: 'SECRETARIA',
        status: 'STANDARD',
        isCompliant: true,
        missingPermissions: [],
        extraPermissions: [],
        currentPermissionCount: 20,
        expectedPermissionCount: 20
      };
      mockRepository.getRoleCompliance.and.returnValue(of(mockCompliance));

      const useCase = TestBed.inject(GetRoleComplianceUseCase);
      useCase.execute(2).subscribe((comp) => {
        expect(comp).toEqual(mockCompliance);
        expect(mockRepository.getRoleCompliance).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe('ResetRolePresetUseCase', () => {
    it('debe llamar al repositorio para restablecer el rol a su plantilla oficial', (done) => {
      const restoredRole: SecurityRole = {
        id: 2,
        code: 'SECRETARIA',
        name: 'Secretaría',
        isActive: true,
        permissions: mockPermissions
      };
      mockRepository.resetRoleToPreset.and.returnValue(of(restoredRole));

      const useCase = TestBed.inject(ResetRolePresetUseCase);
      useCase.execute(2).subscribe((role) => {
        expect(role).toEqual(restoredRole);
        expect(mockRepository.resetRoleToPreset).toHaveBeenCalledWith(2);
        done();
      });
    });
  });

  describe('ManageSecurityModuleUseCase', () => {
    it('debe gestionar la creación, edición y borrado de módulos', (done) => {
      const moduleDTO: CreateModuleDTO = { code: 'NUEVO_MOD', name: 'Nuevo', icon: 'star', order: 5, isActive: true };
      const createdMod: SecurityModule = { id: 9, ...moduleDTO, isActive: true };
      mockRepository.createModule.and.returnValue(of(createdMod));
      mockRepository.updateModule.and.returnValue(of(createdMod));
      mockRepository.deleteModule.and.returnValue(of(undefined));

      const useCase = TestBed.inject(ManageSecurityModuleUseCase);
      useCase.create(moduleDTO).subscribe((m) => {
        expect(m).toEqual(createdMod);
        useCase.update(9, { name: 'Modificado' }).subscribe((um) => {
          expect(um).toEqual(createdMod);
          useCase.delete(9).subscribe(() => {
            expect(mockRepository.deleteModule).toHaveBeenCalledWith(9);
            done();
          });
        });
      });
    });
  });

  describe('ManageSecurityPermissionUseCase', () => {
    it('debe gestionar la creación, edición y borrado de permisos', (done) => {
      const permDTO: CreatePermissionDTO = { code: 'PERM_NUEVO', name: 'Nuevo Permiso', moduleId: 1 };
      const createdPerm: SecurityPermission = { id: 99, ...permDTO };
      mockRepository.createPermission.and.returnValue(of(createdPerm));
      mockRepository.updatePermission.and.returnValue(of(createdPerm));
      mockRepository.deletePermission.and.returnValue(of(undefined));

      const useCase = TestBed.inject(ManageSecurityPermissionUseCase);
      useCase.create(permDTO).subscribe((p) => {
        expect(p).toEqual(createdPerm);
        useCase.update(99, { name: 'Permiso Editado' }).subscribe((up) => {
          expect(up).toEqual(createdPerm);
          useCase.delete(99).subscribe(() => {
            expect(mockRepository.deletePermission).toHaveBeenCalledWith(99);
            done();
          });
        });
      });
    });
  });
});
