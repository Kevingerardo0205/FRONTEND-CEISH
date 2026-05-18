import { Injectable } from '@angular/core';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials, Permission } from '@domain/entities/user.entity';

import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';
import { SetupAccountRequest } from '@features/auth/domain/entities/setup-account.request';

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter extends BaseApiService implements IAuthRepositoryPort {
  
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  registerInvestigador(data: RegisterInvestigadorRequest): Observable<any> {
    return this.post<any>(ENDPOINTS.AUTH.REGISTER, data);
  }

  verifyOTP(email: string, code: string): Observable<any> {
    return this.post<any>(ENDPOINTS.AUTH.VERIFY_OTP, { email, code });
  }

  setupAccount(data: SetupAccountRequest): Observable<any> {
    return this.post<any>(ENDPOINTS.AUTH.SETUP_ACCOUNT, data);
  }

  private mapBackendUser(data: any): User {
    const rolesArray = data.roles || [];
    let roleCode = 'INVESTIGADOR';

    if (Array.isArray(rolesArray) && rolesArray.length > 0) {
      const firstRole = rolesArray[0];
      if (typeof firstRole === 'string') {
        roleCode = firstRole;
      } else {
        roleCode = firstRole.code || firstRole.codigo || firstRole.nombre || firstRole.name || 'INVESTIGADOR';
      }
    }

    const rawPermissions = data.permissions || [];
    
    // Normalizar permisos para que el resto del sistema siempre encuentre .code
    const normalizedFullPermissions = rawPermissions.map((p: any) => {
      if (typeof p === 'object') {
        return {
          ...p,
          code: p.code || p.codigo,
          module: p.module || p.modulo ? {
            ...(p.module || p.modulo),
            code: (p.module && p.module.code) || (p.modulo && p.modulo.codigo),
            icon: (p.module && p.module.icon) || (p.modulo && p.modulo.icono),
            name: (p.module && p.module.name) || (p.modulo && p.modulo.nombre)
          } : undefined
        };
      }
      return p;
    });

    const permissionCodes = normalizedFullPermissions.map((p: any) => typeof p === 'object' ? p.code : p);
    const fullPermissions = Array.isArray(normalizedFullPermissions) && typeof normalizedFullPermissions[0] === 'object' ? normalizedFullPermissions : [];

    return {
      id: data.id || data.Usuario_id,
      email: data.institutionalEmail || data.email || data.email_institucional || '',
      nombre: data.fullName || data.nombre || data.nombres_completos || 'Usuario CEISH',
      rol: roleCode.toUpperCase(),
      activo: data.isActive !== undefined ? data.isActive : (data.activo !== undefined ? data.activo : true),
      emailVerificado: data.isEmailVerified !== undefined ? data.isEmailVerified : (data.email_verificado || false),
      permissions: permissionCodes,
      fullPermissions: fullPermissions
    };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email,
      password: credentials.password
    };

    return this.post<any>(ENDPOINTS.AUTH.LOGIN, loginPayload).pipe(
      map(response => {
        const payload = response.data || response; 
        
        const permissions = payload.permissions || (payload.user && payload.user.permissions) || [];
        
        return {
          accessToken: payload.access_token || payload.accessToken || payload.token,
          refreshToken: payload.refresh_token || payload.refreshToken,
          user: payload.user ? this.mapBackendUser({ ...payload.user, permissions }) : undefined,
          permissions: permissions
        };
      }),
      switchMap(authData => {
        if (!authData.accessToken) {
          return throwError(() => new Error('No se recibió un token válido.'));
        }

        localStorage.setItem('auth_token', authData.accessToken);

        if (!authData.user) {
          return this.get<any>(ENDPOINTS.AUTH.PROFILE).pipe(
            map(profileRes => {
              const userData = profileRes.data || profileRes;
              return { ...authData, user: this.mapBackendUser(userData) };
            }),
            catchError(() => of(authData))
          );
        }
        return of(authData);
      })
    );
  }

  refreshToken(token: string): Observable<any> {
    return this.post<any>(ENDPOINTS.AUTH.REFRESH, { refreshToken: token }).pipe(
      map(response => {
        const payload = response.data || response;
        return {
          accessToken: payload.access_token || payload.accessToken || payload.token,
          refreshToken: payload.refresh_token || payload.refreshToken
        };
      })
    );
  }

  getUsers(): Observable<User[]> {
    const mockUsers: User[] = [
      { id: '1', nombre: 'Admin Sistema', email: 'admin@espoch.edu.ec', rol: 'ADMIN', activo: true, emailVerificado: true }
    ];
    return of(mockUsers).pipe(delay(300));
  }
  
  getUserById(id: string): Observable<User> { 
    return this.get<any>(ENDPOINTS.AUTH.PROFILE).pipe(map(res => this.mapBackendUser(res.data || res))); 
  }
  
  checkEmailExists(email: string): Observable<boolean> { return of(false); }
  createUser(userDto: any): Observable<User> { return this.post<any>(ENDPOINTS.AUTH.REGISTER, userDto); }
  updateUser(id: string, userDto: any): Observable<User> { return of(userDto); }
  deleteUser(id: string): Observable<void> { return of(undefined); }
  logAudit(action: string, detail: string): Observable<void> { return of(undefined); }
}
