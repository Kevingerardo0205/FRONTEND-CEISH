import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { NotificationService } from '@infrastructure/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
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

    if (active && requiredRoles.includes(active)) return true;

    this.notificationService.notify('No tiene acceso a esta sección con el rol activo.', 'info');
    return this.router.createUrlTree(['/dashboard']);
  }
}
