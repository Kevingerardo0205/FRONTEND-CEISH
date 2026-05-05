import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class GetUsersAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(): Observable<UserAdmin[]> {
    return this.repository.getAll();
  }
}

@Injectable({ providedIn: 'root' })
export class RegisterUserAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(user: UserAdmin): Observable<UserAdmin> {
    return this.repository.create(user);
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateUserAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(id: string, user: Partial<UserAdmin>): Observable<UserAdmin> {
    return this.repository.update(id, user);
  }
}

@Injectable({ providedIn: 'root' })
export class DeleteUserAdminUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}

@Injectable({ providedIn: 'root' })
export class GetRolesUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(): Observable<any[]> {
    return this.repository.getRoles();
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateUserRolesUseCase {
  private repository = inject(IUserAdminRepositoryPort);
  execute(id: string, roles: string[]): Observable<void> {
    return this.repository.updateRoles(id, roles);
  }
}
