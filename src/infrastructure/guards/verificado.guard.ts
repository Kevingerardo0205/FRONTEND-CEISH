import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class VerificadoGuard implements CanActivate {
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  canActivate(): boolean | UrlTree {
    const user = this.authFacade.currentUser();

    if (!user) {
      return this.router.createUrlTree(['/auth/login']);
    }

    if (user.emailVerificado) {
      return true;
    }

    // Si no está verificado, redirigir y avisar
    this.snackBar.open('⚠️ Debe verificar su correo para acceder a esta función.', 'Verificar ahora', {
      duration: 5000,
      panelClass: ['snackbar-warning']
    }).onAction().subscribe(() => {
      this.router.navigate(['/auth/confirm-email'], { queryParams: { email: user.email } });
    });

    return this.router.createUrlTree(['/dashboard']);
  }
}
