import { Observable } from 'rxjs';
import {
  SecurityModule,
  SecurityPermission,
  SecurityRole,
  CreateModuleDTO,
  CreatePermissionDTO,
  UpdateRolePermissionsDTO,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleComplianceStatus,
  RolePresetsMap,
} from '../entities/security.entity';

export abstract class ISecurityRepositoryPort {
  // Módulos
  abstract getModules(): Observable<SecurityModule[]>;
  abstract getModuleById(id: number): Observable<SecurityModule>;
  abstract getModulePermissions(id: number): Observable<SecurityPermission[]>;
  abstract createModule(data: CreateModuleDTO): Observable<SecurityModule>;
  abstract updateModule(id: number, data: Partial<CreateModuleDTO>): Observable<SecurityModule>;
  abstract deleteModule(id: number): Observable<void>;

  // Permisos
  abstract getPermissions(): Observable<SecurityPermission[]>;
  abstract getPermissionById(id: number): Observable<SecurityPermission>;
  abstract createPermission(data: CreatePermissionDTO): Observable<SecurityPermission>;
  abstract updatePermission(
    id: number,
    data: Partial<CreatePermissionDTO>,
  ): Observable<SecurityPermission>;
  abstract deletePermission(id: number): Observable<void>;

  // Roles
  abstract getRoles(): Observable<SecurityRole[]>;
  abstract getRoleById(id: number): Observable<SecurityRole>;
  abstract createRole(data: CreateRoleDTO): Observable<SecurityRole>;
  abstract updateRole(id: number, data: UpdateRoleDTO): Observable<SecurityRole>;
  abstract deleteRole(id: number): Observable<void>;
  abstract getRolePermissions(id: number): Observable<SecurityPermission[]>;
  abstract addRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void>;
  abstract updateRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void>;
  abstract removeRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void>;

  // Plantillas Normativas & Cumplimiento (CEISH Presets & Compliance)
  abstract getRolePresets(): Observable<RolePresetsMap>;
  abstract getRoleCompliance(roleId: number): Observable<RoleComplianceStatus>;
  abstract resetRoleToPreset(roleId: number): Observable<SecurityRole>;
}
