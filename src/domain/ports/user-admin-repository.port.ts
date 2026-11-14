import { Observable } from 'rxjs';
import { UserAdmin, RoleAssignmentPayloadItem } from '../entities/user-admin.entity';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export abstract class IUserAdminRepositoryPort {
  abstract getAll(): Observable<UserAdmin[]>;
  abstract create(user: UserAdmin): Observable<UserAdmin>;
  abstract update(id: string, user: Partial<UserAdmin>): Observable<UserAdmin>;
  abstract delete(id: string): Observable<void>;
  abstract getRoles(): Observable<Role[]>;
  abstract updateRoles(
    id: string,
    roles: Array<string | RoleAssignmentPayloadItem>,
  ): Observable<void>;
  abstract extendTemporaryRole(
    id: string,
    roleCode: string,
    validUntil: string,
    reason?: string,
  ): Observable<void>;
  abstract suspendTemporaryRole(id: string, roleCode: string, reason?: string): Observable<void>;
  abstract sendConfirmationEmail(email: string): Observable<void>;
}
