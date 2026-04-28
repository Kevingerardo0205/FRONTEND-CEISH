import { Observable } from 'rxjs';

export interface UserAdmin {
  id?: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'INVESTIGADOR' | 'EVALUADOR' | 'SECRETARIA' | 'PRESIDENTA';
  perfil: string;
}

export abstract class IUserAdminRepositoryPort {
  abstract getAll(): Observable<UserAdmin[]>;
  abstract create(user: UserAdmin): Observable<UserAdmin>;
  abstract delete(id: string): Observable<void>;
}
