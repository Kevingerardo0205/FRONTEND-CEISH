import { Routes } from '@angular/router';
import { LoginPage } from './presentation/pages/login.page';
import { RegisterPage } from './presentation/pages/register.page';
import { ConfirmEmailPage } from './presentation/pages/confirm-email.page';
import { SetupAccountPage } from './presentation/pages/setup-account.page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailPage
  },
  {
    path: 'setup-account',
    component: SetupAccountPage
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
