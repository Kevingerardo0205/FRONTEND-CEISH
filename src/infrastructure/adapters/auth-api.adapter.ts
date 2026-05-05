import { Injectable } from '@angular/core';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';

import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';

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

  private mapBackendUser(data: any): User {
    const rolesArray = data.roles || [];
    let roleName = 'INVESTIGADOR';

    if (Array.isArray(rolesArray) && rolesArray.length > 0) {
      // Priorizar el primer rol del array
      roleName = typeof rolesArray[0] === 'string' ? rolesArray[0] : (rolesArray[0].nombre || rolesArray[0].name || 'INVESTIGADOR');
    }

    return {
      id: data.id || data.Usuario_id,
      email: data.institutionalEmail || data.email || data.email_institucional || '',
      nombre: data.fullName || data.nombre || data.nombres_completos || 'Usuario CEISH',
      rol: roleName.toUpperCase() as UserRole,
      activo: data.isActive !== undefined ? data.isActive : (data.activo !== undefined ? data.activo : true),
      emailVerificado: data.isEmailVerified !== undefined ? data.isEmailVerified : (data.email_verificado || false)
    };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email,
      password: credentials.password
    };

    return this.post<any>(ENDPOINTS.AUTH.LOGIN, loginPayload).pipe(
      map(response => {
        // El backend ahora envía { access_token, user }
        const payload = response.data || response; 
        return {
          accessToken: payload.access_token || payload.accessToken || payload.token,
          refreshToken: payload.refresh_token || payload.refreshToken,
          user: payload.user ? this.mapBackendUser(payload.user) : undefined
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
