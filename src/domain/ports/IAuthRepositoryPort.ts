import { Observable } from 'rxjs';
import { User, UserDTO, AuthResponse, LoginCredentials } from '../entities/user.entity';
import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';
import { SetupAccountRequest } from '@features/auth/domain/entities/setup-account.request';

export abstract class IAuthRepositoryPort {
  abstract login(credentials: LoginCredentials): Observable<AuthResponse>;
  abstract refreshToken(token: string): Observable<any>;
  abstract registerInvestigador(data: RegisterInvestigadorRequest): Observable<any>;
  abstract verifyOTP(email: string, code: string): Observable<any>;
  abstract setupAccount(data: SetupAccountRequest): Observable<any>;
  abstract forgotPassword(email: string): Observable<any>;
  abstract resetPassword(email: string, code: string, password: string): Observable<any>;
  abstract getUsers(): Observable<User[]>;
  abstract getUserById(id: string): Observable<User>;
  abstract checkEmailExists(email: string): Observable<boolean>;
  abstract createUser(user: UserDTO): Observable<User>;
  abstract updateUser(id: string, user: Partial<UserDTO>): Observable<User>;
  abstract deleteUser(id: string): Observable<void>;
  abstract logAudit(action: string, detail: string): Observable<void>;
}
