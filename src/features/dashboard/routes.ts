import { Routes } from '@angular/router';
import { DashboardPage } from './components/dashboard.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'admin/users',
        loadComponent: () => import('./presentation/pages/user-management.page').then(m => m.UserManagementPage)
      },
      {
        path: '',
        redirectTo: 'admin/users',
        pathMatch: 'full'
      }
    ]
  }
];
