import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuditInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
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

  private logAction(_req: HttpRequest<unknown>, _res: HttpResponse<unknown>) {

  }

}
