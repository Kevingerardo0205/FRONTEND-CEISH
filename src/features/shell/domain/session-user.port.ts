import { Observable } from 'rxjs';

/** Datos del usuario de la sesión que muestra el armazón (avatar). */
export interface SessionUser {
  name: string;
  email: string;
}

/**
 * Usuario de la sesión actual y cierre de sesión, para el AppShell.
 * Clase abstracta en lugar de InjectionToken, igual que SessionRolesPort
 * (README §2.2, regla 1: domain no importa @angular).
 */
export abstract class SessionUserPort {
  abstract readonly user$: Observable<SessionUser | null>;
  abstract logout(): void;
}
