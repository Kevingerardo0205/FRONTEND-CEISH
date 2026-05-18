import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({ providedIn: 'root' })
export class UserAdminApiAdapter implements IUserAdminRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getAll(): Observable<UserAdmin[]> {
    return this.apiClient.get<any>(ENDPOINTS.USERS.BASE).pipe(
      map(res => {
        const users = res.data || res;
        return Array.isArray(users) ? users.map((u: any) => this.mapToDomain(u)) : [];
      })
    );
  }

  create(user: UserAdmin): Observable<UserAdmin> {
    const payload = {
      fullName: user.nombre,
      email: user.email,
      nationalId: user.cedula || '',
      roles: user.roles || [user.rol]
    };
    return this.apiClient.post<any>(ENDPOINTS.USERS.BASE, payload).pipe(
      map(res => this.mapToDomain(res.data || res))
    );
  }

  update(id: string, user: Partial<UserAdmin>): Observable<UserAdmin> {
    const payload: any = {};
    if (user.nombre) payload.fullName = user.nombre;
    if (user.email) payload.email = user.email;
    if (user.activo !== undefined) payload.isActive = user.activo;

    return this.apiClient.patch<any>(ENDPOINTS.USERS.BY_ID(id), payload).pipe(
      map(res => this.mapToDomain(res.data || res))
    );
  }

  delete(id: string): Observable<void> {
    return this.apiClient.patch<void>(ENDPOINTS.USERS.BY_ID(id), { isActive: false });
  }

  getRoles(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.USERS.ROLES).pipe(
      map(res => res.data || res)
    );
  }

  updateRoles(id: string, roles: string[]): Observable<void> {
    return this.apiClient.patch<void>(`${ENDPOINTS.USERS.BY_ID(id)}/roles`, { roles });
  }

  private mapToDomain(u: any): UserAdmin {
    const roleName = u.roles && u.roles.length > 0 
      ? (typeof u.roles[0] === 'string' ? u.roles[0] : (u.roles[0].code || u.roles[0].nombre)) 
      : 'INVESTIGADOR';
    
    return {
      id: u.id || u.Usuario_id,
      nombre: u.fullName || u.nombre || 'Sin nombre',
      email: u.email || u.institutionalEmail || '',
      rol: roleName.toUpperCase(),
      roles: u.roles ? u.roles.map((r: any) => typeof r === 'string' ? r : r.code) : [],
      perfil: u.investigatorProfile ? 'Investigador' : 'Personal Administrativo',
      activo: u.isActive ?? u.activo ?? true,
      cedula: u.nationalId || u.cedula
    };
  }
}
