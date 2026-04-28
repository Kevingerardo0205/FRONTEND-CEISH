import { Routes } from '@angular/router';
import { AuthPage } from './components/auth.page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: AuthPage
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
