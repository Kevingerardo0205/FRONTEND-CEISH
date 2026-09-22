import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserAdmin, UserRoleItem, RoleAssignmentPayloadItem } from '@domain/entities/user-admin.entity';
import { UserRole } from '@domain/entities/user.entity';
import { IUserAdminRepositoryPort, Role } from '@domain/ports/user-admin-repository.port';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

interface RawRole {
  id?: number;
  code?: string;
  codigo?: string;
  name?: string;
  nombre?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
  isExpired?: boolean;
}

interface RawBackendUser {
  id?: string;
  Usuario_id?: string;
  fullName?: string;
  nombre?: string;
  email?: string;
  institutionalEmail?: string;
  roles?: Array<string | RawRole>;
  investigatorProfile?: unknown;
  isActive?: boolean;
  activo?: boolean;
  nationalId?: string;
  cedula?: string;
}

@Injectable({ providedIn: 'root' })
export class UserAdminApiAdapter implements IUserAdminRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getAll(): Observable<UserAdmin[]> {
    return this.apiClient.get<unknown>(ENDPOINTS.USERS.BASE).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: unknown };
        const users = envelope.data ?? res;
        return Array.isArray(users) ? (users as RawBackendUser[]).map((u) => this.mapToDomain(u)) : [];
      })
    );
  }

  create(user: UserAdmin): Observable<UserAdmin> {
    const rolesPayload = this.formatRolesPayload(user);
    const payload = {
      fullName: user.nombre,
      email: user.email,
      nationalId: user.cedula || '',
      roles: rolesPayload
    };
    return this.apiClient.post<unknown>(ENDPOINTS.USERS.BASE, payload).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: RawBackendUser };
        return this.mapToDomain(envelope.data ?? (res as RawBackendUser));
      })
    );
  }

  update(id: string, user: Partial<UserAdmin>): Observable<UserAdmin> {
    const payload: Record<string, unknown> = {};
    if (user.nombre) payload['fullName'] = user.nombre;
    if (user.email) payload['email'] = user.email;
    if (user.cedula) payload['nationalId'] = user.cedula;
    if (user.activo !== undefined) payload['isActive'] = user.activo;

    if (user.userRoles !== undefined && Array.isArray(user.userRoles)) {
      payload['roles'] = this.formatRolesPayload(user as UserAdmin);
    } else if (user.rol) {
      payload['roles'] = [user.rol.toUpperCase()];
    }

    return this.apiClient.patch<unknown>(ENDPOINTS.USERS.BY_ID(id), payload).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: RawBackendUser };
        return this.mapToDomain(envelope.data ?? (res as RawBackendUser));
      })
    );
  }

  private formatRolesPayload(user: UserAdmin): Array<string | RoleAssignmentPayloadItem> {
    const userRolesList = user.userRoles || [];
    if (userRolesList.length > 0) {
      return userRolesList.map((ur) => {
        if (ur.validUntil) {
          return {
            roleCode: ur.code.toUpperCase(),
            validFrom: ur.validFrom || null,
            validUntil: ur.validUntil,
            reason: ur.reason || null
          };
        }
        return ur.code.toUpperCase();
      });
    }
    const raw: string[] = user.roles ? user.roles : (user.rol ? [user.rol] : []);
    return raw.map((r: string) => r.toUpperCase());
  }

  delete(id: string): Observable<void> {
    return this.apiClient.patch<void>(ENDPOINTS.USERS.BY_ID(id), { isActive: false });
  }

  getRoles(): Observable<Role[]> {
    return this.apiClient.get<unknown>(ENDPOINTS.USERS.ROLES).pipe(
      map((res: unknown) => {
        const body = res as { data?: Role[] };
        return body.data ?? (res as Role[]);
      })
    );
  }

  updateRoles(id: string, roles: Array<string | RoleAssignmentPayloadItem>): Observable<void> {
    return this.apiClient.patch<void>(`${ENDPOINTS.USERS.BY_ID(id)}/roles`, { roles });
  }

  extendTemporaryRole(id: string, roleCode: string, validUntil: string, reason?: string): Observable<void> {
    return this.apiClient.patch<void>(`${ENDPOINTS.USERS.BY_ID(id)}/roles/${roleCode}/extend`, {
      validUntil,
      reason: reason || null
    });
  }

  suspendTemporaryRole(id: string, roleCode: string, reason?: string): Observable<void> {
    return this.apiClient.post<void>(`${ENDPOINTS.USERS.BY_ID(id)}/roles/${roleCode}/suspend`, {
      reason: reason || null
    });
  }

  sendConfirmationEmail(email: string): Observable<void> {
    return this.apiClient.post<void>(ENDPOINTS.AUTH.RESEND_OTP, { email });
  }

  private mapToDomain(u: RawBackendUser): UserAdmin {
    if (!u) {
      return {
        id: '',
        nombre: 'Sin nombre',
        email: '',
        rol: 'INVESTIGADOR',
        userRoles: [],
        perfil: 'Personal Administrativo',
        activo: true
      };
    }
    const rawRoles = Array.isArray(u.roles) ? u.roles : [];
    const userRoles: UserRoleItem[] = rawRoles.map((r) => {
      if (typeof r === 'string') {
        return {
          code: r.toUpperCase(),
          name: r
        };
      }
      const code = (r.code || r.codigo || r.nombre || r.name || '').toUpperCase();
      const validFrom = r.validFrom ?? (r as any).valid_from ?? null;
      const validUntil = r.validUntil ?? (r as any).valid_until ?? null;
      const reason = r.reason ?? (r as any).motivo_delegacion ?? null;
      const isExpired = r.isExpired !== undefined 
        ? r.isExpired 
        : (r as any).is_expired !== undefined
        ? (r as any).is_expired
        : Boolean(validUntil && new Date(validUntil).getTime() < Date.now());
      return {
        id: r.id,
        code,
        name: r.name || r.nombre || code,
        validFrom,
        validUntil,
        reason,
        isExpired
      };
    });

    const roleCodes = userRoles.map(r => r.code).filter(Boolean);
    const primaryRole = (roleCodes[0] || 'INVESTIGADOR') as UserRole;

    return {
      id: u.id || u.Usuario_id,
      nombre: u.fullName || u.nombre || 'Sin nombre',
      email: u.email || u.institutionalEmail || '',
      rol: primaryRole,
      userRoles,
      perfil: u.investigatorProfile ? 'Investigador' : 'Personal Administrativo',
      activo: u.isActive ?? u.activo ?? true,
      cedula: u.nationalId || u.cedula
    };
  }
}
