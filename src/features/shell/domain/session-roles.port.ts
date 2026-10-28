import { Observable } from 'rxjs';

/**
 * Roles del usuario de la sesión actual, tal como los entrega el backend.
 * Clase abstracta en lugar de InjectionToken: sirve de token de inyección
 * sin que domain importe @angular (README §2.2, regla 1).
 */
export abstract class SessionRolesPort {
  abstract readonly roles$: Observable<string[]>;
}
