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
      console.warn('[AuthGuard] Usuario no autenticado, redirigiendo a login');
      return this.router.createUrlTree(['/auth/login']);
    }

    // 2. Verificar Permisos (PBAC) si están definidos en la ruta
    const requiredPermissions = route.data['permissions'] as string | string[];
    const strategy = route.data['permissionStrategy'] || 'any';
    
    if (!requiredPermissions) {
      return true;
    }

    const user = this.authFacade.currentUser();
    const userPermissions = user?.permissions || [];
    
    // Si el usuario tiene permiso total de administrador, permitir acceso
    if (userPermissions.includes('ADMIN_ALL')) {
      return true;
    }

    let hasPermission = false;
    if (Array.isArray(requiredPermissions)) {
      hasPermission = strategy === 'all'
        ? requiredPermissions.every(p => userPermissions.includes(p))
        : requiredPermissions.some(p => userPermissions.includes(p));
    } else {
      hasPermission = userPermissions.includes(requiredPermissions);
    }

    if (hasPermission) {
      return true;
    }

    console.error(`[AuthGuard] Acceso denegado: Usuario ${user?.email} (${user?.rol}) no cuenta con los permisos requeridos: ${requiredPermissions}. Permisos actuales:`, userPermissions);
    return this.router.createUrlTree(['/dashboard']);
  }
}
