import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthFacade, canEnterInvestigatorAreaRule } from '@features/auth/facades/auth.facade';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleHome } from './role-home.guard';

@Injectable({
  providedIn: 'root',
})
export class VerificadoGuard implements CanActivate {
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private roleHome = inject(RoleHome);

  canActivate(): boolean | UrlTree {
    const user = this.authFacade.currentUser();

    if (!user) {
      console.warn('[VerificadoGuard] No hay usuario autenticado');
      return this.router.createUrlTree(['/auth/login']);
    }

    if (canEnterInvestigatorAreaRule(user, (roles) => this.authFacade.hasAnyRole(roles))) return true;

    console.warn('[VerificadoGuard] Usuario no verificado:', user.email);

    // Si no está verificado, redirigir y avisar
    this.snackBar
      .open('⚠️ Debe verificar su correo para acceder a esta función.', 'Verificar ahora', {
        duration: 5000,
        panelClass: ['snackbar-warning'],
      })
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/auth/confirm-email'], { queryParams: { email: user.email } });
      });

    // D12: vuelve al inicio del rol activo.
    return this.roleHome.urlTree();
  }
}
