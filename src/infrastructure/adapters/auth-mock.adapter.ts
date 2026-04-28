import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';

@Injectable({ providedIn: 'root' })
export class AuthMockRepository implements IAuthRepositoryPort {
  private mockUsers: any[] = [
    {
      id: '1',
      email: 'admin@espoch.edu.ec',
      nombre: 'Administrador Sistema',
      rol: 'ADMIN',
      perfil: 'Administrador',
      activo: true
    },
    {
      id: '2',
      email: 'investigador@espoch.edu.ec',
      nombre: 'Dr. Investigador CEISH',
      rol: 'INVESTIGADOR',
      perfil: 'Investigador Principal',
      activo: true
    }
  ];

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('[AuthMockRepository] Simulando login para:', credentials.email);
    
    // Simular retraso de red
    return of({
      accessToken: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: '1',
        email: credentials.email,
        nombre: 'Usuario de Prueba',
        rol: credentials.email.includes('admin') ? 'ADMIN' : 'INVESTIGADOR',
        activo: true
      }
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
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    this.mockUsers.push(newUser);
    return of(newUser as User);
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
