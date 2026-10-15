import { Routes } from '@angular/router';
import { RoleGuard } from '@infrastructure/guards/role.guard';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: 'center',
    loadComponent: () => import('./presentation/pages/notifications-center/notifications-center.page').then(m => m.NotificationsCenterPage)
  },
  {
    path: 'templates',
    loadComponent: () => import('./presentation/pages/email-templates/email-templates.page').then(m => m.EmailTemplatesPage),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: '',
    redirectTo: 'center',
    pathMatch: 'full'
  }
];
