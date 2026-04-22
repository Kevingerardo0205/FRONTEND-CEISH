import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { FeaturesModule } from './features/features.module';
import { AuthRepositoryPort } from './features/auth/domain/repositories/auth-repository.port';
import { AuthHttpRepository } from './features/auth/infrastructure/repositories/auth-http.repository';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    FeaturesModule
  ],
  providers: [
    provideHttpClient(),
    { provide: AuthRepositoryPort, useClass: AuthHttpRepository }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
