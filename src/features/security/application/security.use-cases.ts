import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ISecurityRepositoryPort } from '@domain/ports/ISecurityRepositoryPort';
import { SecurityModule, SecurityPermission, SecurityRole } from '@domain/entities/security.entity';

export interface SecurityCatalog {
  modules: SecurityModule[];
  allPermissions: SecurityPermission[];
  roles: SecurityRole[];
}

@Injectable({
  providedIn: 'root'
})
export class GetSecurityCatalogUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(): Observable<SecurityCatalog> {
    return forkJoin({
      modules: this.repository.getModules(),
      allPermissions: this.repository.getPermissions(),
      roles: this.repository.getRoles()
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class GetRolePermissionsUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number): Observable<SecurityPermission[]> {
    return this.repository.getRolePermissions(roleId);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UpdateRolePermissionsUseCase {
  private repository = inject(ISecurityRepositoryPort);

  execute(roleId: number, permissionIds: number[]): Observable<void> {
    return this.repository.updateRolePermissions(roleId, { permissionIds });
  }
}

@Injectable({
  providedIn: 'root'
})
export class ManageSecurityModuleUseCase {
  private repository = inject(ISecurityRepositoryPort);

  create(data: any): Observable<SecurityModule> { return this.repository.createModule(data); }
  update(id: number, data: any): Observable<SecurityModule> { return this.repository.updateModule(id, data); }
  delete(id: number): Observable<void> { return this.repository.deleteModule(id); }
}

@Injectable({
  providedIn: 'root'
})
export class ManageSecurityPermissionUseCase {
  private repository = inject(ISecurityRepositoryPort);

  create(data: any): Observable<SecurityPermission> { return this.repository.createPermission(data); }
  update(id: number, data: any): Observable<SecurityPermission> { return this.repository.updatePermission(id, data); }
  delete(id: number): Observable<void> { return this.repository.deletePermission(id); }
}
