import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    // 1. Verificar Autenticación
    if (!this.authFacade.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login']);
    }

    // 2. Verificar Permisos (PBAC) si están definidos en la ruta
    const requiredPermissions = route.data['permissions'] as string | string[];
    
    if (!requiredPermissions) {
      return true;
    }

    const user = this.authFacade.currentUser();
    const userPermissions = user?.permissions || [];
    
    const hasPermission = Array.isArray(requiredPermissions)
      ? requiredPermissions.every(p => userPermissions.includes(p))
      : userPermissions.includes(requiredPermissions);

    if (hasPermission) {
      return true;
    }

    console.warn(`Acceso denegado: Usuario no cuenta con los permisos requeridos: ${requiredPermissions}`);
    return this.router.createUrlTree(['/dashboard']);
  }
}
