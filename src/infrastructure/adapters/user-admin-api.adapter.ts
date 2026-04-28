import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class UserAdminApiAdapter implements IUserAdminRepositoryPort {
  private readonly http = inject(HttpClient);
  
  private mockUsers: UserAdmin[] = [
    { id: '1', nombre: 'Dr. Marco Vinicio', email: 'mvinicio@espoch.edu.ec', rol: 'ADMIN', perfil: 'Presidente CEISH' },
    { id: '2', nombre: 'Dra. Ana Lucía', email: 'alucia@espoch.edu.ec', rol: 'EVALUADOR', perfil: 'Docente Investigador' },
    { id: '3', nombre: 'Ing. Roberto Carlos', email: 'rcarlos@espoch.edu.ec', rol: 'INVESTIGADOR', perfil: 'Investigador Principal' }
  ];

  getAll(): Observable<UserAdmin[]> {
    return of(this.mockUsers).pipe(delay(500));
  }

  create(user: UserAdmin): Observable<UserAdmin> {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    this.mockUsers.push(newUser);
    return of(newUser).pipe(delay(500));
  }

  delete(id: string): Observable<void> {
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    return of(undefined).pipe(delay(500));
  }
}
