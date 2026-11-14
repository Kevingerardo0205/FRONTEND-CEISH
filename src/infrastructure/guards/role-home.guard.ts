import { Injectable, inject } from '@angular/core';
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
 * Servicio y no función suelta: lo usan guards de clase, el interceptor y el login.
 */
@Injectable({ providedIn: 'root' })
export class RoleHome {
  private readonly router = inject(Router);
  private readonly activeRoleFacade = inject(ActiveRoleFacade);
  private readonly notificationService = inject(NotificationService);

  urlTree(): UrlTree {
    const active = this.activeRoleFacade.activeRole();
    if (active) return this.router.parseUrl(ROLE_HOME[active]);
    this.notificationService.notify(NO_ACTIVE_ROLE_MESSAGE, 'info');
    return this.router.createUrlTree(['/auth/login']);
  }
}

/**
 * Ruta '' y '**' (D13): con sesión, el inicio del rol activo; sin sesión, /auth/login.
 */
export const redirectToRoleHome: RedirectFunction = () =>
  inject(AuthFacade).isAuthenticated()
    ? inject(RoleHome).urlTree()
    : inject(Router).createUrlTree(['/auth/login']);

/**
 * Redirect absoluto que conserva los query params (D11: /dashboard/home?tab=peers →
 * /pendientes?tab=peers). Un redirectTo absoluto con string los pierde.
 */
export function redirectKeepingQuery(path: string): RedirectFunction {
  return ({ queryParams }) => inject(Router).createUrlTree([path], { queryParams });
}

/**
 * canMatch por rol activo (F10 D16 (11)): la ruta solo coincide si el rol activo está en `roles`.
 * Sin rol activo no coincide. Se evalúa en cada navegación, así que sigue al cambio de rol.
 */
export function activeRoleIn(roles: readonly RoleCode[]): CanMatchFn {
  return () => {
    const active = inject(ActiveRoleFacade).activeRole();
    return !!active && roles.includes(active);
  };
}

/**
 * canMatch por rol activo (D9): la ruta solo coincide si el rol activo es `role`.
 * Se evalúa en cada navegación, así que al cambiar de rol cambia la rama de /dashboard.
 */
export function activeRoleIs(role: RoleCode): CanMatchFn {
  return activeRoleIn([role]);
}
