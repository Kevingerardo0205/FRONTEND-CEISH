import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthRepositoryPort } from '../../domain/repositories/auth-repository.port';
import { AuthResponse, LoginCredentials } from '../../../../core/auth/models/user.model';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  constructor(
    private authRepository: AuthRepositoryPort,
    private authService: AuthService
  ) {}

  execute(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.authRepository.login(credentials).pipe(
      tap(response => {
        this.authService.setAuth(response);
      })
    );
  }
}
