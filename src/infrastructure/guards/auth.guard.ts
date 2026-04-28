import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private AuthFacade: AuthFacade, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.AuthFacade.isAuthenticated()) {
      return true;
    }
    return this.router.createUrlTree(['/auth/login']);
  }
}
