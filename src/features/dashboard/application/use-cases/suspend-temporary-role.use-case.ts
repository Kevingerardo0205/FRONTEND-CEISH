import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class SuspendTemporaryRoleUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(id: string, roleCode: string, reason?: string): Observable<void> {
    return this.repository.suspendTemporaryRole(id, roleCode, reason);
  }
}
