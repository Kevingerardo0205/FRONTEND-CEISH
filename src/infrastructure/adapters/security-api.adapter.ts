import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../api/base-api.service';
import { ISecurityRepositoryPort } from '@domain/ports/ISecurityRepositoryPort';
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
} from '@domain/entities/security.entity';

@Injectable({
  providedIn: 'root',
})
export class SecurityApiAdapter extends BaseApiService implements ISecurityRepositoryPort {
  private readonly MODULES_URL = '/auth/modules';
  private readonly PERMISSIONS_URL = '/auth/permissions';
  private readonly ROLES_URL = '/auth/roles';

  getModules(): Observable<SecurityModule[]> {
    return this.get<unknown>(this.MODULES_URL).pipe(
      map((res) => this.extractArray(res) as SecurityModule[]),
    );
  }

  getModuleById(id: number): Observable<SecurityModule> {
    return this.get<unknown>(`${this.MODULES_URL}/${id}`).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityModule };
        return body.data ?? (res as SecurityModule);
      }),
    );
  }

  getModulePermissions(id: number): Observable<SecurityPermission[]> {
    return this.get<unknown>(`${this.MODULES_URL}/${id}/permissions`).pipe(
      map((res) => this.extractArray(res) as SecurityPermission[]),
    );
  }

  createModule(data: CreateModuleDTO): Observable<SecurityModule> {
    return this.post<unknown>(this.MODULES_URL, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityModule };
        return body.data ?? (res as SecurityModule);
      }),
    );
  }

  updateModule(id: number, data: Partial<CreateModuleDTO>): Observable<SecurityModule> {
    return this.patch<unknown>(`${this.MODULES_URL}/${id}`, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityModule };
        return body.data ?? (res as SecurityModule);
      }),
    );
  }

  deleteModule(id: number): Observable<void> {
    return this.delete<void>(`${this.MODULES_URL}/${id}`);
  }

  getPermissions(): Observable<SecurityPermission[]> {
    return this.get<unknown>(this.PERMISSIONS_URL).pipe(
      map((res) => this.extractArray(res) as SecurityPermission[]),
    );
  }

  getPermissionById(id: number): Observable<SecurityPermission> {
    return this.get<unknown>(`${this.PERMISSIONS_URL}/${id}`).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityPermission };
        return body.data ?? (res as SecurityPermission);
      }),
    );
  }

  createPermission(data: CreatePermissionDTO): Observable<SecurityPermission> {
    return this.post<unknown>(this.PERMISSIONS_URL, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityPermission };
        return body.data ?? (res as SecurityPermission);
      }),
    );
  }

  updatePermission(id: number, data: Partial<CreatePermissionDTO>): Observable<SecurityPermission> {
    return this.patch<unknown>(`${this.PERMISSIONS_URL}/${id}`, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityPermission };
        return body.data ?? (res as SecurityPermission);
      }),
    );
  }

  deletePermission(id: number): Observable<void> {
    return this.delete<void>(`${this.PERMISSIONS_URL}/${id}`);
  }

  getRoles(): Observable<SecurityRole[]> {
    return this.get<unknown>(this.ROLES_URL).pipe(
      map((res) => this.extractArray(res) as SecurityRole[]),
    );
  }

  getRoleById(id: number): Observable<SecurityRole> {
    return this.get<unknown>(`${this.ROLES_URL}/${id}`).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityRole };
        return body.data ?? (res as SecurityRole);
      }),
    );
  }

  createRole(data: CreateRoleDTO): Observable<SecurityRole> {
    return this.post<unknown>(this.ROLES_URL, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityRole };
        return body.data ?? (res as SecurityRole);
      }),
    );
  }

  updateRole(id: number, data: UpdateRoleDTO): Observable<SecurityRole> {
    return this.patch<unknown>(`${this.ROLES_URL}/${id}`, data).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityRole };
        return body.data ?? (res as SecurityRole);
      }),
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.delete<void>(`${this.ROLES_URL}/${id}`);
  }

  getRolePermissions(id: number): Observable<SecurityPermission[]> {
    return this.get<unknown>(`${this.ROLES_URL}/${id}/permissions`).pipe(
      map((res) => this.extractArray(res) as SecurityPermission[]),
    );
  }

  addRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void> {
    return this.post<void>(`${this.ROLES_URL}/${id}/permissions`, data);
  }

  updateRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void> {
    return this.put<void>(`${this.ROLES_URL}/${id}/permissions`, data);
  }

  removeRolePermissions(id: number, _data: UpdateRolePermissionsDTO): Observable<void> {
    return this.delete<void>(`${this.ROLES_URL}/${id}/permissions`);
  }

  getRolePresets(): Observable<RolePresetsMap> {
    return this.get<unknown>(`${this.ROLES_URL}/presets`).pipe(
      map((res: unknown) => {
        const body = res as { data?: RolePresetsMap };
        return body.data ?? (res as RolePresetsMap);
      }),
    );
  }

  getRoleCompliance(roleId: number): Observable<RoleComplianceStatus> {
    return this.get<unknown>(`${this.ROLES_URL}/${roleId}/compliance`).pipe(
      map((res: unknown) => {
        const body = res as { data?: RoleComplianceStatus };
        return body.data ?? (res as RoleComplianceStatus);
      }),
    );
  }

  resetRoleToPreset(roleId: number): Observable<SecurityRole> {
    return this.post<unknown>(`${this.ROLES_URL}/${roleId}/reset-preset`, {}).pipe(
      map((res: unknown) => {
        const body = res as { data?: SecurityRole };
        return body.data ?? (res as SecurityRole);
      }),
    );
  }

  private extractArray(res: unknown): unknown[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object' && 'data' in res) {
      const data = (res as { data: unknown }).data;
      if (Array.isArray(data)) return data;
    }
    return [];
  }
}
