import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    AuthRoutingModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  exports: [
    RegisterComponent,
    UserListComponent,
    AuthPage
  ]
})
export class AuthModule { }
