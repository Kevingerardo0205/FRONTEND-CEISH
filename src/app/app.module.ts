import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { FeaturesModule } from './features/features.module';
import { AuthRepositoryPort } from './features/auth/domain/repositories/auth-repository.port';
import { AuthMockRepository } from './features/auth/infrastructure/repositories/auth-mock.repository';
import { JwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/auth/interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    FeaturesModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: AuthRepositoryPort, useClass: AuthMockRepository }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
