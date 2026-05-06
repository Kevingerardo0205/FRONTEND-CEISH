import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { AssignmentPage } from './presentation/pages/assignment/assignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';

export const EVALUATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        component: AssignmentPage,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['PRESIDENTE'] }
      },
      {
        path: 'confirm-assignment',
        component: EvaluationListPage,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['SECRETARIA'] }
      },
      {
        path: 'my-tasks',
        component: EvaluationListPage,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['EVALUADOR'] }
      },
      {
        path: 'evaluate/:id',
        component: EvaluationFormPage,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['EVALUADOR'] }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
