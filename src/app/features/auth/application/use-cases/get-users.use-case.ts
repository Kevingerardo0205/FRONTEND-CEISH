import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../../domain/entities/user.entity';
import { AuthRepositoryPort } from '../../domain/repositories/auth-repository.port';

@Injectable({ providedIn: 'root' })
export class GetUsersUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  execute(): Observable<User[]> {
    return this.authRepository.getUsers().pipe(
      tap(() => this.authRepository.logAudit('USER_QUERY', 'Se consultó la lista de usuarios').subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class DeleteUserUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  execute(id: string): Observable<void> {
    return this.authRepository.deleteUser(id).pipe(
      tap(() => this.authRepository.logAudit('USER_DELETION', `Se eliminó el usuario ID: ${id}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateUserUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  execute(id: string, userData: any): Observable<User> {
    return this.authRepository.updateUser(id, userData).pipe(
      tap(user => this.authRepository.logAudit('USER_UPDATE', `Se actualizó el usuario: ${user.email}`).subscribe())
    );
  }
}
