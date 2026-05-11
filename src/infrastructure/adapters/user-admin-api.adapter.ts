import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserAdminApiAdapter implements IUserAdminRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;

  getAll(): Observable<UserAdmin[]> {
    return this.http.get<any[]>(`${this.API}/users`).pipe(
      map(users => users.map(u => this.mapToDomain(u)))
    );
  }

  create(user: UserAdmin): Observable<UserAdmin> {
    const payload = {
      fullName: user.nombre,
      email: user.email,
      nationalId: (user as any).cedula || '',
      roles: [user.rol]
    };
    return this.http.post<any>(`${this.API}/users`, payload).pipe(
      map(u => this.mapToDomain(u))
    );
  }

  update(id: string, user: Partial<UserAdmin>): Observable<UserAdmin> {
    const payload: any = {};
    if (user.nombre) payload.fullName = user.nombre;
    if (user.email) payload.email = user.email;
    if ((user as any).activo !== undefined) payload.isActive = (user as any).activo;

    return this.http.patch<any>(`${this.API}/users/${id}`, payload).pipe(
      map(u => this.mapToDomain(u))
    );
  }

  delete(id: string): Observable<void> {
    // Si el backend no tiene DELETE, usamos PATCH para desactivar
    return this.http.patch<void>(`${this.API}/users/${id}`, { isActive: false });
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/roles`);
  }

  updateRoles(id: string, roles: string[]): Observable<void> {
    return this.http.patch<void>(`${this.API}/users/${id}/roles`, { roles });
  }

  private mapToDomain(u: any): UserAdmin {
    const roleName = u.roles && u.roles.length > 0 ? (u.roles[0].nombre || u.roles[0]) : 'INVESTIGADOR';
    return {
      id: u.id,
      nombre: u.fullName || u.nombre || 'Sin nombre',
      email: u.email || u.institutionalEmail || '',
      rol: roleName.toUpperCase(),
      perfil: u.investigatorProfile ? 'Investigador' : 'Personal Administrativo',
      activo: u.isActive ?? true
    };
  }
}
