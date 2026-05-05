import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AmendmentRequestPage } from './presentation/pages/amendment-request/amendment-request.page';

export const AMENDMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'request',
        component: AmendmentRequestPage,
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
