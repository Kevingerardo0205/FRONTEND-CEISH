import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserAdminRepositoryPort, Role } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class GetRolesUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(): Observable<Role[]> {
    return this.repository.getRoles();
  }
}
