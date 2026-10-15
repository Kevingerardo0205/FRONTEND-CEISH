import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap, retry, delay } from 'rxjs/operators';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthResponse } from '@domain/entities/user.entity';
import { SessionExpiredDialogComponent } from '@shared/components/session-expired-dialog/session-expired-dialog.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private injector: Injector, private router: Router) {}

  private get authFacade(): AuthFacade {
    return this.injector.get(AuthFacade);
  }

  private get snackBar(): MatSnackBar {
    return this.injector.get(MatSnackBar);
  }

  private get dialog(): MatDialog {
    return this.injector.get(MatDialog);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = request.url || '';
    const isLocalApi = url.startsWith('/') || url.startsWith(environment.apiUrl);

    if (!isLocalApi) {
      return next.handle(request);
    }

    let next$ = next.handle(request);

    if (request.method === 'GET') {
      next$ = next$.pipe(
        retry({
          count: 2,
          delay: (error, retryCount) => {
            if (error instanceof HttpErrorResponse && [0, 503, 504].includes(error.status)) {
              console.warn(`[ErrorInterceptor] Petición GET fallida. Reintento ${retryCount}/2...`);
              return of(null).pipe(delay(1000));
            }
            throw error;
          }
        })
      );
    }

    return next$.pipe(
      catchError((error: HttpErrorResponse) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Si la petición que falló con 401 es de refresco o de validación inicial (/me), cerrar sesión limpiamente
          if (url.includes('/auth/refresh') || url.includes('/auth/me')) {
            this.authFacade.logout();
            if (url.includes('/auth/refresh')) {
              this.showSessionExpiredModal();
            }
            return throwError(() => error);
          }
          if (url.includes('/auth/login')) {
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
            status: 409,
            message: error.error?.message || 'Este trámite ha sido actualizado por otro usuario. Por favor, recargue el expediente.'
          }));
        }

        if (error instanceof HttpErrorResponse) {
          if (error.status === 500 || error.status === 503 || error.status === 504) {
            this.snackBar.open(
              'El servidor del CEISH está experimentando problemas. Por favor, inténtelo de nuevo más tarde.',
              'Cerrar',
              { duration: 5000 }
            );
          } else if (error.status === 0) {
            this.snackBar.open(
              'Error de conexión. Verifique su red de internet.',
              'Cerrar',
              { duration: 5000 }
            );
          }
        }

        const errorMessage = error.error?.message || error.statusText;
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authFacade.refreshToken().pipe(
        switchMap((token: AuthResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.accessToken);
          return next.handle(this.addToken(request, token.accessToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authFacade.logout();
          this.showSessionExpiredModal();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addToken(request, jwt));
        })
      );
    }
  }

  private showSessionExpiredModal(): void {
    try {
      if (!this.dialog.openDialogs.some(d => d.componentInstance instanceof SessionExpiredDialogComponent)) {
        this.dialog.closeAll();
        const dialogRef = this.dialog.open(SessionExpiredDialogComponent, {
          width: '460px',
          disableClose: true,
          panelClass: 'session-expired-dialog-panel',
          autoFocus: true
        });
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    } catch {
      this.router.navigate(['/auth/login']);
    }
  }

  private addToken(request: HttpRequest<unknown>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
