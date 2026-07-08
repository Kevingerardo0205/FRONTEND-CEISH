import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private injector: Injector, private router: Router) {}

  private get authFacade(): AuthFacade {
    return this.injector.get(AuthFacade);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = request.url || '';
    const isLocalApi = url.startsWith('/') || url.startsWith(environment.apiUrl);

    if (!isLocalApi) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Evitar intentar refrescar token si la petición fallida ya es de login o de refresco
          if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
            return throwError(() => error);
          }
          return this.handle401Error(request, next);
        }
        
        if (error instanceof HttpErrorResponse && error.status === 403) {
          const userEmail = error.error?.email || '';
          if (error.error?.message?.includes('verificar') || error.error?.message?.includes('OTP')) {
            this.router.navigate(['/auth/confirm-email'], { queryParams: { email: userEmail } });
            return throwError(() => new Error('Su cuenta no ha sido verificada. Ingrese el código enviado a su correo.'));
          }
          this.router.navigate(['/dashboard']);
          return throwError(() => new Error('No tienes permisos para acceder a este recurso.'));
        }

        if (error instanceof HttpErrorResponse && error.status === 409) {
          return throwError(() => ({
            type: 'CONCURRENCY_ERROR',
            message: error.error?.message || 'Este trámite ha sido actualizado por otro usuario. Por favor, recargue el expediente.'
          }));
        }

        const errorMessage = error.error?.message || error.statusText;
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authFacade.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.accessToken);
          return next.handle(this.addToken(request, token.accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authFacade.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request, jwt));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
