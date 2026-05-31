import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User, UserDTO, AuthResponse, LoginCredentials } from '../../domain/entities/user.entity';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { AuthFacade } from './facades/auth.facade';

import { RegisterInvestigadorRequest } from './domain/entities/register.request';
import { SetupAccountRequest } from './domain/entities/setup-account.request';

@Injectable({ providedIn: 'root' })
export class RegisterInvestigadorUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(data: RegisterInvestigadorRequest): Observable<any> {
    return this.authRepository.registerInvestigador(data).pipe(
      tap(() => this.authRepository.logAudit('INVESTIGADOR_REGISTRATION', `Registro de investigador: ${data.email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class VerifyOtpUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(email: string, code: string): Observable<any> {
    return this.authRepository.verifyOTP(email, code).pipe(
      tap(() => this.authRepository.logAudit('OTP_VERIFICATION', `Verificación de correo: ${email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class SetupAccountUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(data: SetupAccountRequest): Observable<any> {
    return this.authRepository.setupAccount(data).pipe(
      tap(() => this.authRepository.logAudit('SETUP_ACCOUNT', `Configuración de cuenta: ${data.email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  constructor(
    private authRepository: IAuthRepositoryPort,
    private authFacade: AuthFacade
  ) {}

  execute(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.authRepository.login(credentials).pipe(
      tap(response => {
        this.authFacade.setAuth(response);
        this.authRepository.logAudit('LOGIN', `Inicio de sesión: ${credentials.email}`).subscribe();
      })
    );
  }
}

@Injectable({ providedIn: 'root' })
export class RegisterUserUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(userData: UserDTO): Observable<User> {
    return this.authRepository.createUser(userData).pipe(
      tap(user => this.authRepository.logAudit('USER_REGISTRATION', `Registro de nuevo usuario: ${user.email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class GetUsersUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(): Observable<User[]> {
    return this.authRepository.getUsers().pipe(
      tap(() => this.authRepository.logAudit('USER_QUERY', 'Se consultó la lista de usuarios').subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class DeleteUserUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(id: string): Observable<void> {
    return this.authRepository.deleteUser(id).pipe(
      tap(() => this.authRepository.logAudit('USER_DELETION', `Se eliminó el usuario ID: ${id}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateUserUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(id: string, userData: any): Observable<User> {
    return this.authRepository.updateUser(id, userData).pipe(
      tap(user => this.authRepository.logAudit('USER_UPDATE', `Se actualizó el usuario: ${user.email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ForgotPasswordUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(email: string): Observable<any> {
    return this.authRepository.forgotPassword(email).pipe(
      tap(() => this.authRepository.logAudit('PASSWORD_RECOVERY_REQUEST', `Solicitud de recuperación de contraseña: ${email}`).subscribe())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ResetPasswordUseCase {
  constructor(private authRepository: IAuthRepositoryPort) {}

  execute(email: string, code: string, password: string): Observable<any> {
    return this.authRepository.resetPassword(email, code, password).pipe(
      tap(() => this.authRepository.logAudit('PASSWORD_RECOVERY_SUCCESS', `Restablecimiento de contraseña exitoso: ${email}`).subscribe())
    );
  }
}
