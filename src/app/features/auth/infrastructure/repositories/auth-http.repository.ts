import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthRepositoryPort } from '../../domain/repositories/auth-repository.port';
import { ApiClientService } from '../../../../core/http/api-client.service';
import { ENDPOINTS } from '../../../../core/http/endpoints.constant';
import { AuthResponse, LoginCredentials } from '../../../../core/auth/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthHttpRepository implements AuthRepositoryPort {
  constructor(private apiClient: ApiClientService) {}

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Error de conexión con el servidor.';
        
        if (error.status === 401) {
          message = 'Correo o contraseña incorrectos.';
        } else if (error.status === 403) {
          message = 'Tu cuenta ha sido bloqueada. Contacta al administrador.';
        } else if (error.status === 404) {
          message = 'Servicio de autenticación no encontrado.';
        }
        
        return throwError(() => new Error(message));
      })
    );
  }

  getUsers(): Observable<any[]> { return this.apiClient.get<any[]>(ENDPOINTS.AUTH.USERS); }
  getUserById(id: string): Observable<any> { return this.apiClient.get<any>(`${ENDPOINTS.AUTH.USERS}/${id}`); }
  checkEmailExists(email: string): Observable<boolean> { return this.apiClient.get<boolean>(`${ENDPOINTS.AUTH.USERS}/check-email`, { email }); }
  createUser(userDto: any): Observable<any> { return this.apiClient.post<any>(ENDPOINTS.AUTH.REGISTER, userDto); }
  updateUser(id: string, userDto: any): Observable<any> { return this.apiClient.put<any>(`${ENDPOINTS.AUTH.USERS}/${id}`, userDto); }
  deleteUser(id: string): Observable<void> { return this.apiClient.delete<void>(`${ENDPOINTS.AUTH.USERS}/${id}`); }
  logAudit(action: string, detail: string): Observable<void> { return this.apiClient.post<void>(`${ENDPOINTS.AUTH.USERS}/audit`, { action, detail }); }
}
