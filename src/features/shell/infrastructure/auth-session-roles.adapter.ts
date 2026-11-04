import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { SessionRolesPort } from '../domain/session-roles.port';
import { SessionUser, SessionUserPort } from '../domain/session-user.port';

/**
 * Toma los roles vigentes (sin suplencias expiradas) de la sesión de AuthFacade.
 * getActiveRoles() lee el signal del usuario: dentro de un computed, el cambio se ve
 * en la misma navegación (T13d-0), no después del effect de toObservable.
 */
@Injectable()
export class AuthSessionRolesAdapter extends SessionRolesPort {
  private authFacade = inject(AuthFacade);

  roles(): string[] {
    return this.authFacade.getActiveRoles();
  }
}

/**
 * Nombre y correo del usuario de la sesión, y cierre de sesión, desde AuthFacade.
 * Vive en este archivo porque es la única excepción de capas que lee @features/auth (plan §2).
 */
@Injectable()
export class AuthSessionUserAdapter extends SessionUserPort {
  private authFacade = inject(AuthFacade);

  readonly user$: Observable<SessionUser | null> = toObservable(this.authFacade.currentUser).pipe(
    map((user) => (user ? { name: user.nombre, email: user.email } : null)),
  );

  logout(): void {
    this.authFacade.logout();
  }
}
