import { Routes } from '@angular/router';

export const SECURITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/pages/security.page').then(m => m.SecurityPage)
  }
];
