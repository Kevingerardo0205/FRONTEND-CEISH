import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { IAuthRepositoryPort, MessageResponse } from '@domain/ports/IAuthRepositoryPort';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { User, AuthResponse, LoginCredentials, UserDTO } from '@domain/entities/user.entity';
import { UserRoleItem } from '@domain/entities/user-admin.entity';

import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';
import { SetupAccountRequest } from '@features/auth/domain/entities/setup-account.request';

interface RawRole {
  id?: number;
  code?: string;
  codigo?: string;
  nombre?: string;
  name?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
  isExpired?: boolean;
}

interface RawPermission {
  code?: string;
  codigo?: string;
  module?: { code?: string; icon?: string; name?: string };
  modulo?: { codigo?: string; icono?: string; nombre?: string };
}

interface RawBackendUser {
  id?: string;
  Usuario_id?: string;
  institutionalEmail?: string;
  email?: string;
  email_institucional?: string;
  fullName?: string;
  nombre?: string;
  nombres_completos?: string;
  roles?: Array<string | RawRole>;
  permissions?: Array<string | RawPermission>;
  isActive?: boolean;
  activo?: boolean;
  isEmailVerified?: boolean;
  email_verificado?: boolean;
  investigatorProfile?: {
    position?: string;
    phone?: string;
    institution?: string;
    senescytRegistration?: string;
    nationality?: string;
  };
  perfil?: string;
  telefono?: string;
  nationalId?: string;
  institucion?: string;
  registroSenescyt?: string;
  nacionalidad?: string;
}

interface RawLoginPayload {
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: RawBackendUser;
  permissions?: Array<string | RawPermission>;
}

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter extends BaseApiService implements IAuthRepositoryPort {
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  registerInvestigador(data: RegisterInvestigadorRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>(ENDPOINTS.AUTH.REGISTER, data);
  }

  verifyOTP(email: string, code: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(ENDPOINTS.AUTH.VERIFY_OTP, { email, code });
  }

  setupAccount(data: SetupAccountRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>(ENDPOINTS.AUTH.SETUP_ACCOUNT, data);
  }

  private mapBackendUser(data: RawBackendUser): User {
    const rolesArray = data.roles || [];
    let roleCode = 'INVESTIGADOR';

    if (Array.isArray(rolesArray) && rolesArray.length > 0) {
      const firstRole = rolesArray[0];
      if (typeof firstRole === 'string') {
        roleCode = firstRole;
      } else {
        roleCode =
          firstRole.code ||
          firstRole.codigo ||
          firstRole.nombre ||
          firstRole.name ||
          'INVESTIGADOR';
      }
    }

    const userRoles: UserRoleItem[] = Array.isArray(rolesArray)
      ? rolesArray.map((r) => {
          if (typeof r === 'string') {
            return {
              code: r.toUpperCase(),
              name: r,
            };
          }
          const code = (r.code || r.codigo || r.nombre || r.name || '').toUpperCase();
          const isExpired =
            r.isExpired !== undefined
              ? r.isExpired
              : Boolean(r.validUntil && new Date(r.validUntil).getTime() < Date.now());
          return {
            id: r.id,
            code,
            name: r.name || r.nombre || code,
            validFrom: r.validFrom || null,
            validUntil: r.validUntil || null,
            reason: r.reason || null,
            isExpired,
          };
        })
      : [];

    const rolesList: string[] = userRoles.map((r) => r.code).filter(Boolean);

    const rawPermissions = data.permissions || [];

    const normalizedFullPermissions = rawPermissions.map((p: string | RawPermission) => {
      if (typeof p === 'object') {
        return {
          ...p,
          code: p.code || p.codigo || '',
          module:
            p.module || p.modulo
              ? {
                  code: p.module?.code || p.modulo?.codigo || '',
                  icon: p.module?.icon || p.modulo?.icono || '',
                  name: p.module?.name || p.modulo?.nombre || '',
                  order: 0,
                }
              : undefined,
        };
      }
      return { code: p, module: undefined };
    });

    const permissionCodes = normalizedFullPermissions.map((p) => p.code);
    const fullPermissions = normalizedFullPermissions;

    return {
      id: data.id || data.Usuario_id,
      email: data.institutionalEmail || data.email || data.email_institucional || '',
      nombre: data.fullName || data.nombre || data.nombres_completos || 'Usuario CEISH',
      rol: roleCode.toUpperCase(),
      roles: rolesList.length > 0 ? rolesList : [roleCode.toUpperCase()],
      userRoles,
      activo:
        data.isActive !== undefined
          ? data.isActive
          : data.activo !== undefined
            ? data.activo
            : true,
      emailVerificado:
        data.isEmailVerified !== undefined ? data.isEmailVerified : data.email_verificado || false,
      permissions: permissionCodes,
      fullPermissions: fullPermissions,
      perfil: data.investigatorProfile?.position || data.perfil || 'Docente Investigador',
      telefono: data.investigatorProfile?.phone || data.telefono || '',
      nationalId: data.nationalId || '',
      institucion: data.investigatorProfile?.institution || '',
      registroSenescyt: data.investigatorProfile?.senescytRegistration || '',
      nacionalidad: data.investigatorProfile?.nationality || '',
    };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email,
      password: credentials.password,
    };

    return this.post<unknown>(ENDPOINTS.AUTH.LOGIN, loginPayload).pipe(
      map((response: unknown) => {
        const envelope = response as { data?: RawLoginPayload };
        const payload = envelope.data ?? (response as RawLoginPayload);

        const permissions = payload.permissions || (payload.user && payload.user.permissions) || [];

        return {
          accessToken: payload.access_token || payload.accessToken || payload.token || '',
          refreshToken: payload.refresh_token || payload.refreshToken || '',
          user: payload.user ? this.mapBackendUser({ ...payload.user, permissions }) : undefined,
          permissions: permissions,
        } as AuthResponse;
      }),
      switchMap((authData) => {
        if (!authData.accessToken) {
          return throwError(() => new Error('No se recibió un token válido.'));
        }

        localStorage.setItem('auth_token', authData.accessToken);

        if (!authData.user) {
          return this.get<unknown>(ENDPOINTS.AUTH.PROFILE).pipe(
            map((profileRes: unknown) => {
              const envelope = profileRes as { data?: RawBackendUser };
              const userData = envelope.data ?? (profileRes as RawBackendUser);
              return { ...authData, user: this.mapBackendUser(userData) } as AuthResponse;
            }),
            catchError(() => of(authData)),
          );
        }
        return of(authData);
      }),
    );
  }

  refreshToken(token: string): Observable<{ accessToken: string; refreshToken: string }> {
    return this.post<unknown>(ENDPOINTS.AUTH.REFRESH, { refreshToken: token }).pipe(
      map((response: unknown) => {
        const envelope = response as { data?: RawLoginPayload };
        const payload = envelope.data ?? (response as RawLoginPayload);
        return {
          accessToken: payload.access_token || payload.accessToken || payload.token || '',
          refreshToken: payload.refresh_token || payload.refreshToken || '',
        };
      }),
    );
  }

  getUsers(): Observable<User[]> {
    return this.get<unknown>(ENDPOINTS.USERS.BASE).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: unknown };
        const users = envelope.data ?? res;
        return Array.isArray(users)
          ? (users as RawBackendUser[]).map((u) => this.mapBackendUser(u))
          : [];
      }),
    );
  }

  getUserById(_id: string): Observable<User> {
    return this.get<unknown>(ENDPOINTS.AUTH.PROFILE).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: RawBackendUser };
        return this.mapBackendUser(envelope.data ?? (res as RawBackendUser));
      }),
    );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  resetPassword(email: string, code: string, password: string): Observable<MessageResponse> {
    return this.post<MessageResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, { email, code, password });
  }

  checkEmailExists(_email: string): Observable<boolean> {
    return of(false);
  }
  createUser(userDto: UserDTO): Observable<User> {
    return this.post<unknown>(ENDPOINTS.AUTH.REGISTER, userDto).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: RawBackendUser };
        return this.mapBackendUser(envelope.data ?? (res as RawBackendUser));
      }),
    );
  }
  updateUser(id: string, userDto: Partial<User>): Observable<User> {
    const payload: Record<string, string> = {};
    if (userDto.nombre) payload['fullName'] = userDto.nombre;
    if (userDto.perfil) payload['position'] = userDto.perfil;
    if (userDto.email) payload['email'] = userDto.email;
    if (userDto.telefono) payload['phone'] = userDto.telefono;
    if (userDto.nacionalidad) payload['nationality'] = userDto.nacionalidad;
    if (userDto.institucion) payload['institution'] = userDto.institucion;
    if (userDto.registroSenescyt) payload['senescytRegistration'] = userDto.registroSenescyt;
    if (userDto.nationalId) payload['nationalId'] = userDto.nationalId;

    return this.patch<unknown>(ENDPOINTS.USERS.BY_ID(id), payload).pipe(
      map((res: unknown) => {
        const envelope = res as { data?: RawBackendUser };
        return this.mapBackendUser(envelope.data ?? (res as RawBackendUser));
      }),
    );
  }
  deleteUser(_id: string): Observable<void> {
    return of(undefined);
  }
  logAudit(_action: string, _detail: string): Observable<void> {
    return of(undefined);
  }
}
