import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
// import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { JwtInterceptor } from '@infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from '@infrastructure/interceptors/error.interceptor';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { AuthApiAdapter } from '@infrastructure/adapters/auth-api.adapter';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { UserAdminApiAdapter } from '@infrastructure/adapters/user-admin-api.adapter';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationMockAdapter } from '@infrastructure/adapters/evaluation-mock.adapter';
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorMockAdapter } from '@infrastructure/adapters/evaluator-mock.adapter';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolMockAdapter } from '@infrastructure/adapters/protocol-mock.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    // provideCharts(withDefaultRegisterables()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: IAuthRepositoryPort, useClass: AuthApiAdapter },
    { provide: IUserAdminRepositoryPort, useClass: UserAdminApiAdapter },
    { provide: IEvaluationRepositoryPort, useClass: EvaluationMockAdapter },
    { provide: IEvaluatorRepositoryPort, useClass: EvaluatorMockAdapter },
    { provide: IProtocolRepositoryPort, useClass: ProtocolMockAdapter }
  ]
};
