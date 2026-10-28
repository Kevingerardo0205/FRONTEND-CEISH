import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { SessionRolesPort } from '../domain/session-roles.port';

/** Toma los roles vigentes (sin suplencias expiradas) de la sesión de AuthFacade. */
@Injectable()
export class AuthSessionRolesAdapter extends SessionRolesPort {
  private authFacade = inject(AuthFacade);

  readonly roles$: Observable<string[]> = toObservable(this.authFacade.currentUser).pipe(
    map(() => this.authFacade.getActiveRoles()),
  );
}
