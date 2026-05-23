import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { BaseApiService } from '../api/base-api.service';
import { ISecurityRepositoryPort } from '@domain/ports/ISecurityRepositoryPort';
import { 
  SecurityModule, 
  SecurityPermission, 
  SecurityRole, 
  CreateModuleDTO, 
  CreatePermissionDTO,
  UpdateRolePermissionsDTO
} from '@domain/entities/security.entity';

@Injectable({
  providedIn: 'root'
})
export class SecurityApiAdapter extends BaseApiService implements ISecurityRepositoryPort {
  private readonly MODULES_URL = '/auth/modules';
  private readonly PERMISSIONS_URL = '/auth/permissions';
  private readonly ROLES_URL = '/auth/roles';

  // Módulos
  getModules(): Observable<SecurityModule[]> {
    return this.get<any>(this.MODULES_URL).pipe(
      map(res => this.extractArray(res)),
      catchError(() => of([]))
    );
  }

  getModuleById(id: number): Observable<SecurityModule> {
    return this.get<any>(`${this.MODULES_URL}/${id}`).pipe(
      map(res => res.data || res)
    );
  }

  getModulePermissions(id: number): Observable<SecurityPermission[]> {
    return this.get<any>(`${this.MODULES_URL}/${id}/permissions`).pipe(
      map(res => this.extractArray(res)),
      catchError(() => of([]))
    );
  }

  createModule(data: CreateModuleDTO): Observable<SecurityModule> {
    return this.post<any>(this.MODULES_URL, data).pipe(
      map(res => res.data || res)
    );
  }

  updateModule(id: number, data: Partial<CreateModuleDTO>): Observable<SecurityModule> {
    return this.patch<any>(`${this.MODULES_URL}/${id}`, data).pipe(
      map(res => res.data || res)
    );
  }

  deleteModule(id: number): Observable<void> {
    return this.delete<void>(`${this.MODULES_URL}/${id}`);
  }

  // Permisos
  getPermissions(): Observable<SecurityPermission[]> {
    return this.get<any>(this.PERMISSIONS_URL).pipe(
      map(res => this.extractArray(res)),
      catchError(() => of([]))
    );
  }

  getPermissionById(id: number): Observable<SecurityPermission> {
    return this.get<any>(`${this.PERMISSIONS_URL}/${id}`).pipe(
      map(res => res.data || res)
    );
  }

  createPermission(data: CreatePermissionDTO): Observable<SecurityPermission> {
    return this.post<any>(this.PERMISSIONS_URL, data).pipe(
      map(res => res.data || res)
    );
  }

  updatePermission(id: number, data: Partial<CreatePermissionDTO>): Observable<SecurityPermission> {
    return this.patch<any>(`${this.PERMISSIONS_URL}/${id}`, data).pipe(
      map(res => res.data || res)
    );
  }

  deletePermission(id: number): Observable<void> {
    return this.delete<void>(`${this.PERMISSIONS_URL}/${id}`);
  }

  // Roles
  getRoles(): Observable<SecurityRole[]> {
    return this.get<any>(this.ROLES_URL).pipe(
      map(res => this.extractArray(res)),
      catchError(() => of([]))
    );
  }

  getRoleById(id: number): Observable<SecurityRole> {
    return this.get<any>(`${this.ROLES_URL}/${id}`).pipe(
      map(res => res.data || res)
    );
  }

  getRolePermissions(id: number): Observable<SecurityPermission[]> {
    return this.get<any>(`${this.ROLES_URL}/${id}/permissions`).pipe(
      map(res => this.extractArray(res)),
      catchError(() => of([]))
    );
  }

  addRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void> {
    return this.post<void>(`${this.ROLES_URL}/${id}/permissions`, data);
  }

  updateRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void> {
    return this.put<void>(`${this.ROLES_URL}/${id}/permissions`, data);
  }

  removeRolePermissions(id: number, data: UpdateRolePermissionsDTO): Observable<void> {
    return this.delete<void>(`${this.ROLES_URL}/${id}/permissions`);
  }

  /**
   * Extrae de forma segura un array de la respuesta, manejando envolturas y nulos.
   */
  private extractArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    // Si es un objeto pero no tiene data array, devolvemos vacio para no romper el [Symbol.iterator]
    return [];
  }
}
