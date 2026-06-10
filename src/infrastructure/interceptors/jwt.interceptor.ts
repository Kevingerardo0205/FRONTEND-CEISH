import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private tokenService: TokenStoreAdapter) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.getToken();
    
    // Incluir token solo si es ruta relativa (/) o coincide con la API base (environment.apiUrl)
    const url = request.url || '';
    const isLocalApi = url.startsWith('/') || url.startsWith(environment.apiUrl);
    
    if (token && isLocalApi) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request);
  }
}
