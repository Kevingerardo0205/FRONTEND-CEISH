import { Observable } from 'rxjs';
import { UserAdmin } from '../entities/user-admin.entity';

export abstract class IUserAdminRepositoryPort {
  abstract getAll(): Observable<UserAdmin[]>;
  abstract create(user: UserAdmin): Observable<UserAdmin>;
  abstract delete(id: string): Observable<void>;
}
