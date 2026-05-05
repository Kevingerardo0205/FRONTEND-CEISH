import { Routes } from '@angular/router';
import { RoleGuard } from '@infrastructure/guards/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: 'stats',
    loadComponent: () => import('./presentation/pages/stats-dashboard/stats-dashboard.page').then(m => m.StatsDashboardPage),
    canActivate: [RoleGuard],
    data: { roles: ['SECRETARY', 'PRESIDENT', 'ADMIN'] }
  },
  {
    path: 'msp',
    loadComponent: () => import('./presentation/pages/msp-reports/msp-reports.page').then(m => m.MSPReportsPage),
    canActivate: [RoleGuard],
    data: { roles: ['SECRETARY', 'PRESIDENT', 'ADMIN'] }
  },
  {
    path: 'custom',
    loadComponent: () => import('./presentation/pages/custom-report-builder/custom-report-builder.page').then(m => m.CustomReportBuilderPage),
    canActivate: [RoleGuard],
    data: { roles: ['SECRETARY', 'PRESIDENT', 'ADMIN'] }
  },
  {
    path: '',
    redirectTo: 'stats',
    pathMatch: 'full'
  }
];
