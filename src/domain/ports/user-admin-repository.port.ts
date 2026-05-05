import { Observable } from 'rxjs';
import { UserAdmin } from '../entities/user-admin.entity';

export abstract class IUserAdminRepositoryPort {
  abstract getAll(): Observable<UserAdmin[]>;
  abstract create(user: UserAdmin): Observable<UserAdmin>;
  abstract update(id: string, user: Partial<UserAdmin>): Observable<UserAdmin>;
  abstract delete(id: string): Observable<void>;
  abstract getRoles(): Observable<any[]>;
  abstract updateRoles(id: string, roles: string[]): Observable<void>;
}
