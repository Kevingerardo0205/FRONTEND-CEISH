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
        path: 'profile',
        loadComponent: () => import('./presentation/pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./presentation/pages/user-management.page').then(m => m.UserManagementPage),
        canActivate: [AuthGuard],
        data: { permissions: ['USUARIOS_VER'] }
      },
      {
        path: 'admin/security',
        loadChildren: () => import('@features/security/routes').then(m => m.SECURITY_ROUTES),
        canActivate: [AuthGuard],
        data: { permissions: ['PERMISOS_GESTIONAR'] }
      },
      {
        path: 'protocols',
        loadChildren: () => import('@features/protocols/routes').then(m => m.PROTOCOL_ROUTES)
      },
      {
        path: 'evaluations',
        loadChildren: () => import('@features/evaluations/routes').then(m => m.EVALUATION_ROUTES)
      },
      {
        path: 'follow-up',
        loadChildren: () => import('@features/follow-up/routes').then(m => m.FOLLOW_UP_ROUTES)
      },
      {
        path: 'resolutions',
        loadChildren: () => import('@features/resolutions/routes').then(m => m.RESOLUTION_ROUTES)
      },
      {
        path: 'amendments',
        loadChildren: () => import('@features/amendments/routes').then(m => m.AMENDMENT_ROUTES)
      },
      {
        path: 'renewals',
        loadChildren: () => import('@features/renewals/routes').then(m => m.RENEWAL_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () => import('@features/reports/routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'investigador',
        loadChildren: () => import('@features/investigador/investigador.routes').then(m => m.INVESTIGADOR_ROUTES)
      },
      {
        path: 'audit',
        loadChildren: () => import('@features/audit/routes').then(m => m.AUDIT_ROUTES),
        canActivate: [AuthGuard],
        data: { permissions: ['ADMIN_ALL'] }
      },
      {
        path: 'notifications',
        loadChildren: () => import('@features/notifications/routes').then(m => m.NOTIFICATION_ROUTES)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];
