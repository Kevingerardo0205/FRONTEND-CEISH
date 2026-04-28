import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { DashboardRoutingModule } from './presentation/dashboard-routing.module';
import { DashboardComponent } from './presentation/pages/dashboard.page';
import { UserManagementPage } from './presentation/pages/user-management.page';
import { AuthModule } from '../auth/auth.module';

@NgModule({
  declarations: [
    DashboardComponent,
    UserManagementPage
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    AuthModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule
  ]
})
export class DashboardModule { }
