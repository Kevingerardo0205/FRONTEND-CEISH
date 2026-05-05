import { Observable } from 'rxjs';
import { User, UserDTO, AuthResponse, LoginCredentials } from '../entities/user.entity';
import { RegisterInvestigadorRequest } from '@features/auth/domain/entities/register.request';

export abstract class IAuthRepositoryPort {
  abstract login(credentials: LoginCredentials): Observable<AuthResponse>;
  abstract registerInvestigador(data: RegisterInvestigadorRequest): Observable<any>;
  abstract verifyOTP(email: string, code: string): Observable<any>;
  abstract getUsers(): Observable<User[]>;
  abstract getUserById(id: string): Observable<User>;
  abstract checkEmailExists(email: string): Observable<boolean>;
  abstract createUser(user: UserDTO): Observable<User>;
  abstract updateUser(id: string, user: Partial<UserDTO>): Observable<User>;
  abstract deleteUser(id: string): Observable<void>;
  abstract logAudit(action: string, detail: string): Observable<void>;
}
