import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.page';
import { UserManagementPage } from './pages/user-management.page';
import { AuthGuard } from '../../../core/auth/guards/auth.guard';
import { RoleGuard } from '../../../core/auth/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'admin/users',
        component: UserManagementPage,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: '',
        redirectTo: 'admin/users',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
