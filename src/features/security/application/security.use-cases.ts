import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ISecurityRepositoryPort } from '@domain/ports/ISecurityRepositoryPort';
import {
  SecurityModule,
  SecurityPermission,
  SecurityRole,
  CreateModuleDTO,
  CreatePermissionDTO,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleComplianceStatus,
  RolePresetsMap,
} from '@domain/entities/security.entity';

export interface SecurityCatalog {
  modules: SecurityModule[];
  allPermissions: SecurityPermission[];
  roles: SecurityRole[];
}

@Injectable({
  providedIn: 'root',
})
export class GetSecurityCatalogUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(): Observable<SecurityCatalog> {
    return forkJoin({
      modules: this.repository.getModules(),
      allPermissions: this.repository.getPermissions(),
      roles: this.repository.getRoles(),
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class GetRolePermissionsUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number): Observable<SecurityPermission[]> {
    return this.repository.getRolePermissions(roleId);
  }
}

@Injectable({
  providedIn: 'root',
})
export class UpdateRolePermissionsUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number, permissionIds: number[]): Observable<void> {
    return this.repository.updateRolePermissions(roleId, { permissionIds });
  }
}

@Injectable({
  providedIn: 'root',
})
export class CreateRoleUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(data: CreateRoleDTO): Observable<SecurityRole> {
    return this.repository.createRole(data);
  }
}

@Injectable({
  providedIn: 'root',
})
export class UpdateRoleUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(id: number, data: UpdateRoleDTO): Observable<SecurityRole> {
    return this.repository.updateRole(id, data);
  }
}

@Injectable({
  providedIn: 'root',
})
export class DeleteRoleUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(id: number): Observable<void> {
    return this.repository.deleteRole(id);
  }
}

@Injectable({
  providedIn: 'root',
})
export class GetRolePresetsUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(): Observable<RolePresetsMap> {
    return this.repository.getRolePresets();
  }
}

@Injectable({
  providedIn: 'root',
})
export class GetRoleComplianceUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number): Observable<RoleComplianceStatus> {
    return this.repository.getRoleCompliance(roleId);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ResetRolePresetUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number): Observable<SecurityRole> {
    return this.repository.resetRoleToPreset(roleId);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ManageSecurityModuleUseCase {
  private repository = inject(ISecurityRepositoryPort);

  create(data: CreateModuleDTO): Observable<SecurityModule> {
    return this.repository.createModule(data);
  }
  update(id: number, data: Partial<CreateModuleDTO>): Observable<SecurityModule> {
    return this.repository.updateModule(id, data);
  }
  delete(id: number): Observable<void> {
    return this.repository.deleteModule(id);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ManageSecurityPermissionUseCase {
  private repository = inject(ISecurityRepositoryPort);

  create(data: CreatePermissionDTO): Observable<SecurityPermission> {
    return this.repository.createPermission(data);
  }
  update(id: number, data: Partial<CreatePermissionDTO>): Observable<SecurityPermission> {
    return this.repository.updatePermission(id, data);
  }
  delete(id: number): Observable<void> {
    return this.repository.deletePermission(id);
  }
}
