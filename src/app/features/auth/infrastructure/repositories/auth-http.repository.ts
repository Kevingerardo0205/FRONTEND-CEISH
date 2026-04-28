import { Injectable } from '@angular/core';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError, switchMap, map, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthRepositoryPort } from '../../domain/repositories/auth-repository.port';
import { ApiClientService } from '../../../../core/http/api-client.service';
import { ENDPOINTS } from '../../../../core/http/endpoints.constant';
import { AuthResponse, LoginCredentials, User } from '../../../../core/auth/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthHttpRepository implements AuthRepositoryPort {
  constructor(private apiClient: ApiClientService) {}

  private mapBackendUser(data: any): User {
    // Mapeo flexible para soportar snake_case de la BD y camelCase del API
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
      rol: roleName.toUpperCase(),
      activo: data.activo !== undefined ? data.activo : true
    };
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email,
      username: credentials.email,
      password: credentials.password
    };

    return this.apiClient.post<any>(ENDPOINTS.AUTH.LOGIN, loginPayload).pipe(
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
          return this.apiClient.get<any>(ENDPOINTS.AUTH.PROFILE).pipe(
            map(profileRes => {
              const userData = profileRes.data || profileRes;
              return { ...authData, user: this.mapBackendUser(userData) };
            }),
            catchError(() => of(authData))
          );
        }
        return of(authData);
      }),
      catchError((error: HttpErrorResponse) => {
        let message = 'Error de conexión.';
        if (error.status === 401) message = 'Usuario o contraseña incorrectos.';
        return throwError(() => new Error(message));
      })
    );
  }

  getUsers(): Observable<any[]> {
    // Por ahora mantenemos mock para la lista general si no hay endpoint GET /users
    const mockUsers = [
      { id: '1', nombre: 'Admin Sistema', email: 'admin@espoch.edu.ec', rol: 'ADMIN', perfil: 'Administrador' }
    ];
    return of(mockUsers).pipe(delay(300));
  }
  
  getUserById(id: string): Observable<any> { 
    return this.apiClient.get<any>(ENDPOINTS.AUTH.PROFILE).pipe(map(res => this.mapBackendUser(res.data || res))); 
  }
  
  checkEmailExists(email: string): Observable<boolean> { return of(false); }
  createUser(userDto: any): Observable<any> { return this.apiClient.post<any>(ENDPOINTS.AUTH.REGISTER, userDto); }
  updateUser(id: string, userDto: any): Observable<any> { return of(userDto); }
  deleteUser(id: string): Observable<void> { return of(undefined); }
  logAudit(action: string, detail: string): Observable<void> { return of(undefined); }
}
