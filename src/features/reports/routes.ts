import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: 'stats',
    loadComponent: () =>
      import('./presentation/pages/stats-dashboard/stats-dashboard.page').then(
        (m) => m.StatsDashboardPage,
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA', 'PRESIDENTE'] },
  },
  {
    path: 'msp',
    loadComponent: () =>
      import('./presentation/pages/msp-reports/msp-reports.page').then((m) => m.MSPReportsPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA', 'PRESIDENTE'] },
  },
  {
    path: 'custom',
    loadComponent: () =>
      import('./presentation/pages/custom-report-builder/custom-report-builder.page').then(
        (m) => m.CustomReportBuilderPage,
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA', 'PRESIDENTE'] },
  },

  {
    path: '',
    redirectTo: 'stats',
    pathMatch: 'full',
  },
];
