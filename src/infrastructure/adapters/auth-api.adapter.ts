import { Injectable } from '@angular/core';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter extends BaseApiService implements IAuthRepositoryPort {
  
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  private mapBackendUser(data: any): User {
    const roles = data.roles || data.Usuario_roles || [];
    let roleName = 'INVESTIGADOR';

    if (Array.isArray(roles) && roles.length > 0) {
      roleName = roles[0].nombre || roles[0];
    } else if (data.rol) {
      roleName = data.rol;
    }

    return {
      id: data.id || data.Usuario_id,
      email: data.email || data.email_institucional || data.Usuario_email_institucional,
      nombre: data.nombre || data.full_name || 'Usuario CEISH',
      rol: roleName.toUpperCase() as UserRole,
      activo: data.activo !== undefined ? data.activo : true
    };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email,
      username: credentials.email,
      password: credentials.password
    };

    return this.post<any>(ENDPOINTS.AUTH.LOGIN, loginPayload).pipe(
      map(response => {
        const payload = response.data || response; 
        return {
          accessToken: payload.accessToken || payload.token || payload.access_token,
          refreshToken: payload.refreshToken || payload.refresh_token,
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
      { id: '1', nombre: 'Admin Sistema', email: 'admin@espoch.edu.ec', rol: 'ADMIN', activo: true }
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
