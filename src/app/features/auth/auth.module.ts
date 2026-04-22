import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { RegisterComponent } from './presentation/components/register/register.component';
import { UserListComponent } from './presentation/components/login/login.component';
import { AuthPage } from './presentation/pages/auth.page';
import { AuthRoutingModule } from './presentation/auth-routing.module';

@NgModule({
  declarations: [
    RegisterComponent,
    UserListComponent,
    AuthPage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AuthRoutingModule
  ],
  exports: [
    RegisterComponent,
    UserListComponent,
    AuthPage
  ]
})
export class AuthModule { }
