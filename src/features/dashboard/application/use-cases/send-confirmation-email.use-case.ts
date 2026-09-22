import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';

@Injectable({ providedIn: 'root' })
export class SendConfirmationEmailUseCase {
  private repository = inject(IUserAdminRepositoryPort);

  execute(email: string): Observable<void> {
    return this.repository.sendConfirmationEmail(email);
  }
}
