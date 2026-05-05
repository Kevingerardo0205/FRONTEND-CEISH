import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RenewalRequestPage } from './presentation/pages/renewal-request/renewal-request.page';

export const RENEWAL_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'request',
        component: RenewalRequestPage,
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'request',
        pathMatch: 'full'
      }
    ]
  }
];
