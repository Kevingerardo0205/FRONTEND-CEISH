import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { NotificationService } from '@infrastructure/services/notification.service';
import { RoleHome } from './role-home.guard';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private readonly roleHome = inject(RoleHome);

  constructor(
    private authFacade: AuthFacade,
    private activeRoleFacade: ActiveRoleFacade,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const rawRoles = route.data['roles'];
    if (!rawRoles) return true;

    const requiredRoles: string[] = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const user = this.authFacade.currentUser();

    if (!user) return this.router.createUrlTree(['/auth/login']);

    const active = this.activeRoleFacade.activeRole();

    // D12: sin rol activo, RoleHome lleva a /auth/login con su propio aviso.
    if (!active) return this.roleHome.urlTree();
    if (requiredRoles.includes(active)) return true;

    this.notificationService.notify('No tiene acceso a esta sección con el rol activo.', 'info');
    // D12: vuelve al inicio del rol activo (ROLE_HOME), no a /dashboard.
    return this.roleHome.urlTree();
  }
}
