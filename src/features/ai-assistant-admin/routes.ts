import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';

export const AI_ASSISTANT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/pages/ai-assistant-admin.page').then(m => m.AiAssistantAdminPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN_TI', 'PRESIDENTE'] }
  }
];

