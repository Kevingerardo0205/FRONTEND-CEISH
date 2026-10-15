import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AdverseEventsListPage } from './presentation/pages/adverse-events/adverse-events-list.page';
import { AdverseEventFormPage } from './presentation/pages/adverse-events/adverse-event-form.page';

export const FOLLOW_UP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'adverse-events',
        component: AdverseEventsListPage,
        canActivate: [AuthGuard]
      },
      {
        path: 'adverse-events/new',
        component: AdverseEventFormPage,
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'adverse-events',
        pathMatch: 'full'
      }
    ]
  }
];
