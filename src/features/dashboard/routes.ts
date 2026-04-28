import { Routes } from '@angular/router';
import { DashboardPage } from './presentation/pages/dashboard.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./presentation/pages/dashboard-home.page').then(m => m.DashboardHomePage)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./presentation/pages/user-management.page').then(m => m.UserManagementPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];
