import { Routes } from '@angular/router';
import { RoleGuard } from '@infrastructure/guards/role.guard';

export const AUDIT_ROUTES: Routes = [
  {
    path: 'logs',
    loadComponent: () => import('./presentation/pages/audit-logs/audit-logs.page').then(m => m.AuditLogsPage),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'trail/:id',
    loadComponent: () => import('./presentation/pages/protocol-trail/protocol-trail.page').then(m => m.ProtocolTrailPage),
    canActivate: [RoleGuard],
    data: { roles: ['SECRETARIA', 'PRESIDENTE', 'PRESIDENTA', 'ADMIN'] }
  },
  {
    path: '',
    redirectTo: 'logs',
    pathMatch: 'full'
  }
];
