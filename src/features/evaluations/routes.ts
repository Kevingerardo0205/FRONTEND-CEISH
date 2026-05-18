import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AssignmentPage } from './presentation/pages/assignment/assignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';
import { EvaluationConsolidationPage } from './presentation/pages/evaluation-consolidation/evaluation-consolidation.page';

export const EVALUATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'assignment',
        component: AssignmentPage,
        canActivate: [AuthGuard],
        data: { 
          permissions: ['EVALUATORS_ASSIGN', 'EVALUATORS_SUGGEST', 'EVALUACION_ASIGNAR'],
          permissionStrategy: 'any'
        }
      },
      {
        path: 'list',
        component: EvaluationListPage,
        canActivate: [AuthGuard],
        data: { permissions: ['EVALUACION_VER_PROPIAS', 'EVALUACION_COMPLETAR_FORMULARIO'] }
      },
      {
        path: 'evaluate/:id',
        component: EvaluationFormPage,
        canActivate: [AuthGuard],
        data: { permissions: ['EVALUACION_COMPLETAR_FORMULARIO'] }
      },
      {
        path: 'consolidation/:id',
        component: EvaluationConsolidationPage,
        canActivate: [AuthGuard],
        data: { permissions: ['RESOLUCION_CREAR'] }
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];

