import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Injectable()
export class AuditInterceptor implements HttpInterceptor {
  private authFacade = inject(AuthFacade);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo auditamos métodos que modifican estado
    const auditedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse && auditedMethods.includes(req.method)) {
            this.logAction(req, event);
          }
        }
      })
    );
  }

  private logAction(req: HttpRequest<any>, res: HttpResponse<any>) {
    const user = this.authFacade.currentUser();
    const auditEntry = {
      timestamp: new Date(),
      userId: user?.id || 'anonymous',
      userName: user?.nombre || 'Anonymous',
      method: req.method,
      url: req.url,
      action: this.mapMethodToAction(req.method, req.url),
      payload: req.body,
      status: res.status
    };

    // Aquí enviarías esto a un endpoint de auditoría en el backend
    console.log('%c [AUDITORÍA CEISH] ', 'background: #003366; color: #fff', auditEntry);
  }

  private mapMethodToAction(method: string, url: string): string {
    if (url.includes('approve') || url.includes('validate')) return 'APROBAR';
    switch (method) {
      case 'POST': return 'CREAR';
      case 'PUT': 
      case 'PATCH': return 'MODIFICAR';
      case 'DELETE': return 'ELIMINAR';
      default: return 'ACCION';
    }
  }
}
