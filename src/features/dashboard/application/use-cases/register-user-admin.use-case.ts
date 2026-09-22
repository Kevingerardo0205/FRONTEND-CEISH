import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class RegisterUserAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(user: UserAdmin): Observable<UserAdmin> {
    return this.repository.create(user);
  }
}
