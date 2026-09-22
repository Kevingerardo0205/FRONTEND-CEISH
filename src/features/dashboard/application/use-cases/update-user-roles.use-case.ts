import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleAssignmentPayloadItem } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class UpdateUserRolesUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(id: string, roles: Array<string | RoleAssignmentPayloadItem>): Observable<void> {
    return this.repository.updateRoles(id, roles);
  }
}
