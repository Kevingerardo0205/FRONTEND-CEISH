import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Array<string>;
    const user = this.authService.currentUser();

    if (!user) return this.router.createUrlTree(['/auth/login']);

    // Log para depuración
    console.log('RoleGuard Check:', { userRole: user.rol, requiredRoles });

    // Normalizar el rol del usuario (por si viene de un array o es minúscula)
    const userRole = user.rol.toUpperCase();

    if (requiredRoles.includes(userRole)) {
      return true;
    }

    console.warn(`Acceso denegado: Usuario con rol ${userRole} intentó acceder a ruta para ${requiredRoles}`);
    return this.router.createUrlTree(['/dashboard']);
  }
}
