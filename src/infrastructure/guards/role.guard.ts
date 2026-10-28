import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private AuthFacade: AuthFacade,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const rawRoles = route.data['roles'];
    if (!rawRoles) return true;

    const requiredRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const user = this.AuthFacade.currentUser();

    if (!user) return this.router.createUrlTree(['/auth/login']);

    if (this.AuthFacade.hasAnyRole(requiredRoles)) {
      return true;
    }

    const activeRoles = this.AuthFacade.getActiveRoles();
    console.warn(
      `[RoleGuard] Acceso denegado: Usuario ${user.email} con roles [${activeRoles.join(', ')}] intentó acceder a ruta para [${requiredRoles.join(', ')}]`,
    );
    return this.router.createUrlTree(['/dashboard']);
  }
}
