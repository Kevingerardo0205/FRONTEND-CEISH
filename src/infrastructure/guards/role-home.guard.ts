import { inject } from '@angular/core';
import { CanMatchFn, RedirectFunction, Router, UrlTree } from '@angular/router';
import { RoleCode } from '@domain/value-objects/role.vo';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { ROLE_HOME } from '@features/shell/domain/role-home';
import { NotificationService } from '@infrastructure/services/notification.service';

export const NO_ACTIVE_ROLE_MESSAGE = 'Su cuenta no tiene un rol vigente.';

/**
 * Inicio del rol activo (D12, 03/11/2026): ROLE_HOME[rol activo].
 * Sin rol activo (sesión sin un rol reconocido): /auth/login con aviso.
 * Se llama dentro de un contexto de inyección (guard, redirect o constructor).
 */
export function roleHomeUrlTree(): UrlTree {
  const router = inject(Router);
  const active = inject(ActiveRoleFacade).activeRole();
  if (active) return router.parseUrl(ROLE_HOME[active]);
  inject(NotificationService).notify(NO_ACTIVE_ROLE_MESSAGE, 'info');
  return router.createUrlTree(['/auth/login']);
}

/**
 * Ruta '' y '**' (D13): con sesión, el inicio del rol activo; sin sesión, /auth/login.
 */
export const redirectToRoleHome: RedirectFunction = () =>
  inject(AuthFacade).isAuthenticated()
    ? roleHomeUrlTree()
    : inject(Router).createUrlTree(['/auth/login']);

/**
 * Redirect absoluto que conserva los query params (D11: /dashboard/home?tab=peers →
 * /pendientes?tab=peers). Un redirectTo absoluto con string los pierde.
 */
export function redirectKeepingQuery(path: string): RedirectFunction {
  return ({ queryParams }) => inject(Router).createUrlTree([path], { queryParams });
}

/**
 * canMatch por rol activo (D9): la ruta solo coincide si el rol activo es `role`.
 * Se evalúa en cada navegación, así que al cambiar de rol cambia el layout.
 */
export function activeRoleIs(role: RoleCode): CanMatchFn {
  return () => inject(ActiveRoleFacade).activeRole() === role;
}
