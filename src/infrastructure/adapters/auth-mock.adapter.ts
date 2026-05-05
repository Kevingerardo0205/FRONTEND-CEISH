import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';

import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';

@Injectable({ providedIn: 'root' })
export class AuthMockRepository implements IAuthRepositoryPort {
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@espoch.edu.ec',
      nombre: 'Administrador Sistema',
      rol: 'ADMIN',
      perfil: 'Administrador',
      activo: true,
      emailVerificado: true
    },
    {
      id: '2',
      email: 'investigador@espoch.edu.ec',
      nombre: 'Dr. Investigador CEISH',
      rol: 'INVESTIGADOR',
      perfil: 'Investigador Principal',
      activo: true,
      emailVerificado: true
    },
    {
      id: '3',
      email: 'secretaria@espoch.edu.ec',
      nombre: 'Secretaria CEISH',
      rol: 'SECRETARIA',
      perfil: 'Secretaria Técnica',
      activo: true,
      emailVerificado: true
    },
    {
      id: '4',
      email: 'evaluador@espoch.edu.ec',
      nombre: 'Evaluador CEISH',
      rol: 'EVALUADOR',
      perfil: 'Miembro del Comité',
      activo: true,
      emailVerificado: true
    },
    {
      id: '5',
      email: 'presidenta@espoch.edu.ec',
      nombre: 'Presidenta CEISH',
      rol: 'PRESIDENTA',
      perfil: 'Presidencia',
      activo: true,
      emailVerificado: true
    }
  ];

  registerInvestigador(data: RegisterInvestigadorRequest): Observable<any> {
    console.log('[AuthMockRepository] Registrando investigador:', data);
    
    // Simular creación exitosa
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      nombre: `${data.firstName} ${data.firstLastName}`,
      rol: 'INVESTIGADOR',
      activo: true,
      emailVerificado: false
    };
    
    this.mockUsers.push(newUser);
    
    return of({
      success: true,
      message: 'Investigador registrado correctamente (Mock)',
      data: newUser
    }).pipe(delay(1500));
  }

  verifyOTP(email: string, code: string): Observable<any> {
    console.log('[AuthMockRepository] Verificando OTP:', { email, code });
    return of({
      success: true,
      message: 'Email verificado correctamente (Mock)'
    }).pipe(delay(1000));
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('[AuthMockRepository] Intentando login para:', credentials.email);
    
    const user = this.mockUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!user) {
      return throwError(() => new Error('Usuario no encontrado en el sistema de pruebas.'));
    }

    // Simular éxito de login
    return of({
      accessToken: 'mock-jwt-token-' + Math.random().toString(36).substr(2),
      refreshToken: 'mock-refresh-token-' + Math.random().toString(36).substr(2),
      user: { ...user }
    }).pipe(delay(800));
  }

  getUsers(): Observable<User[]> {
    return of(this.mockUsers as User[]).pipe(delay(500));
  }

  getUserById(id: string): Observable<User> {
    const user = this.mockUsers.find(u => u.id === id);
    return user ? of(user as User) : throwError(() => new Error('Usuario no encontrado'));
  }

  checkEmailExists(email: string): Observable<boolean> {
    return of(this.mockUsers.some(u => u.email === email));
  }

  createUser(user: UserDTO): Observable<User> {
    const newUser: User = { ...user, id: Math.random().toString(36).substr(2, 9), activo: true, emailVerificado: true };
    this.mockUsers.push(newUser);
    return of(newUser);
  }

  updateUser(id: string, user: Partial<UserDTO>): Observable<User> {
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers[index] = { ...this.mockUsers[index], ...user };
      return of(this.mockUsers[index] as User);
    }
    return throwError(() => new Error('Usuario no encontrado'));
  }

  deleteUser(id: string): Observable<void> {
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    return of(undefined);
  }

  logAudit(action: string, detail: string): Observable<void> {
    console.log('[Audit Log]', action, detail);
    return of(undefined);
  }
}
