import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AssignmentPage } from './presentation/pages/assignment/assignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';

export const EVALUATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'assignment',
        component: AssignmentPage,
        canActivate: [AuthGuard]
      },
      {
        path: 'list',
        component: EvaluationListPage,
        canActivate: [AuthGuard]
      },
      {
        path: 'form/:id',
        component: EvaluationFormPage,
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];
