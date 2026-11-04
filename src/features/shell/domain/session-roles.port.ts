/**
 * Roles del usuario de la sesión actual, tal como los entrega el backend.
 * Clase abstracta en lugar de InjectionToken: sirve de token de inyección
 * sin que domain importe @angular (README §2.2, regla 1).
 *
 * roles() es una lectura síncrona del estado de la sesión. El adapter la implementa
 * leyendo un signal, así que dentro de un computed se recalcula en cuanto cambia la
 * sesión, sin esperar a un effect (T13d-0: el rol activo en la primera navegación).
 */
export abstract class SessionRolesPort {
  abstract roles(): string[];
}
