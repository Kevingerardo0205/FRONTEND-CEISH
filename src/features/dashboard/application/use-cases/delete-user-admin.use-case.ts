import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class DeleteUserAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}
