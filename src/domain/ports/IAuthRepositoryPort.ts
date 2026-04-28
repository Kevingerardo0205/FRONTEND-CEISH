import { Observable } from 'rxjs';
import { User, UserDTO, AuthResponse, LoginCredentials } from '../entities/user.entity';

export abstract class IAuthRepositoryPort {
  abstract login(credentials: LoginCredentials): Observable<AuthResponse>;
  abstract getUsers(): Observable<User[]>;
  abstract getUserById(id: string): Observable<User>;
  abstract checkEmailExists(email: string): Observable<boolean>;
  abstract createUser(user: UserDTO): Observable<User>;
  abstract updateUser(id: string, user: Partial<UserDTO>): Observable<User>;
  abstract deleteUser(id: string): Observable<void>;
  abstract logAudit(action: string, detail: string): Observable<void>;
}
