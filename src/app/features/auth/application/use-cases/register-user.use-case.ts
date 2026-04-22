import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { User, UserDTO } from '../../domain/entities/user.entity';
import { AuthRepositoryPort } from '../../domain/repositories/auth-repository.port';

@Injectable({ providedIn: 'root' })
export class RegisterUserUseCase {
  constructor(private authRepository: AuthRepositoryPort) {}

  execute(userData: UserDTO): Observable<User> {
    // 1. Validar email institucional
    if (!userData.email.endsWith('@espoch.edu.ec')) {
      return throwError(() => new Error('El correo debe ser institucional (@espoch.edu.ec)'));
    }

    // 2. Verificar si el email ya existe en el sistema
    return this.authRepository.checkEmailExists(userData.email).pipe(
      switchMap(exists => {
        if (exists) {
          return throwError(() => new Error('Este correo electrónico ya está registrado.'));
        }
        
        // 3. Crear el usuario
        return this.authRepository.createUser(userData).pipe(
          tap(user => {
            // 4. Auditoría
            this.authRepository.logAudit('USER_CREATION', `Admin created user: ${user.email} with role ${user.rol}`).subscribe();
            console.log(`Log: Correo de activación enviado a ${user.email}`);
          })
        );
      }),
      catchError(error => {
        console.error('Error in RegisterUserUseCase:', error);
        return throwError(() => error);
      })
    );
  }
}
