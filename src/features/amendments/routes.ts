import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AmendmentListPage } from './presentation/pages/amendment-list/amendment-list.page';
import { AmendmentRequestPage } from './presentation/pages/amendment-request/amendment-request.page';

export const AMENDMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AmendmentListPage,
        canActivate: [AuthGuard],
      },
      {
        path: 'request',
        component: AmendmentRequestPage,
        canActivate: [AuthGuard],
      },
    ],
  },
];
