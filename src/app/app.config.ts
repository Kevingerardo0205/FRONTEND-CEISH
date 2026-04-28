import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { JwtInterceptor } from '@infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from '@infrastructure/interceptors/error.interceptor';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { AuthApiAdapter } from '@infrastructure/adapters/auth-api.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: IAuthRepositoryPort, useClass: AuthApiAdapter }
  ]
};

