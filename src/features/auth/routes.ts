import { Routes } from '@angular/router';
import { LoginPage } from './presentation/pages/login.page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
