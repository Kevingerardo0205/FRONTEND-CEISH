import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class ExtendTemporaryRoleUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(id: string, roleCode: string, validUntil: string, reason?: string): Observable<void> {
    return this.repository.extendTemporaryRole(id, roleCode, validUntil, reason);
  }
}
