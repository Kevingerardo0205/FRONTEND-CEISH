import { Routes } from '@angular/router';

export const AI_ASSISTANT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/pages/ai-assistant-admin.page').then(m => m.AiAssistantAdminPage)
  }
];
