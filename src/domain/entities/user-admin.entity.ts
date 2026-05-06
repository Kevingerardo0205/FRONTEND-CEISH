import { Observable } from 'rxjs';
import { UserRole } from './user.entity';

export interface UserAdmin {
  id?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  perfil: string;
  activo: boolean;
}

export abstract class IUserAdminRepositoryPort {
  abstract getAll(): Observable<UserAdmin[]>;
  abstract create(user: UserAdmin): Observable<UserAdmin>;
  abstract delete(id: string): Observable<void>;
}
