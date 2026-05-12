import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registrar datos de localización para español
registerLocaleData(localeEs);

import { routes } from './app.routes';
import { JwtInterceptor } from '@infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from '@infrastructure/interceptors/error.interceptor';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { AuthApiAdapter } from '@infrastructure/adapters/auth-api.adapter';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { UserAdminApiAdapter } from '@infrastructure/adapters/user-admin-api.adapter';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationApiAdapter } from '@infrastructure/adapters/evaluation-api.adapter';
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorMockAdapter } from '@infrastructure/adapters/evaluator-mock.adapter';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolApiAdapter } from '@infrastructure/adapters/protocol-api.adapter';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { DocumentApiAdapter } from '@infrastructure/adapters/document-api.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: IAuthRepositoryPort, useClass: AuthApiAdapter },
    { provide: IUserAdminRepositoryPort, useClass: UserAdminApiAdapter },
    { provide: IEvaluationRepositoryPort, useClass: EvaluationApiAdapter },
    { provide: IEvaluatorRepositoryPort, useClass: EvaluatorMockAdapter },
    { provide: IProtocolRepositoryPort, useClass: ProtocolApiAdapter },
    { provide: IDocumentRepositoryPort, useClass: DocumentApiAdapter }
  ]
};
