import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { ReassignmentPage } from './presentation/pages/reassignment/reassignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';
import { PeerRiskAssessmentPage } from './presentation/pages/peer-risk-assessment/peer-risk-assessment.page';
import { EvaluationConsolidationPage } from './presentation/pages/evaluation-consolidation/evaluation-consolidation.page';

export const EVALUATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      // F03 D1 y D2: lista y formulario de asignación, solo PRESIDENTE con EVALUACION_ASIGNAR.
      {
        path: 'assignment',
        loadComponent: () =>
          import('./presentation/pages/peer-assignment-list/peer-assignment-list.page').then(
            (m) => m.PeerAssignmentListPage,
          ),
        canActivate: [RoleGuard, AuthGuard],
        data: { roles: ['PRESIDENTE'], permissions: ['EVALUACION_ASIGNAR'] },
      },
      {
        path: 'assignment/:protocolId',
        loadComponent: () =>
          import('./presentation/pages/peer-assignment-form/peer-assignment-form.page').then(
            (m) => m.PeerAssignmentFormPage,
          ),
        canActivate: [RoleGuard, AuthGuard],
        data: { roles: ['PRESIDENTE'], permissions: ['EVALUACION_ASIGNAR'] },
      },
      {
        path: 'reassignment/:protocolId',
        component: ReassignmentPage,
        canActivate: [AuthGuard],
        data: {
          permissions: ['EVALUATORS_ASSIGN', 'EVALUATORS_SUGGEST', 'EVALUACION_ASIGNAR'],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'reassign/:id',
        component: ReassignmentPage,
        canActivate: [AuthGuard],
        data: {
          permissions: ['EVALUATORS_ASSIGN', 'EVALUATORS_SUGGEST', 'EVALUACION_ASIGNAR'],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'list',
        component: EvaluationListPage,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            'EVALUACION_VER_PROPIAS',
            'EVALUACION_COMPLETAR_FORMULARIO',
            'EVALUATION_VIEW_MINE',
            'EVALUATION_FILL',
            'EVALUACION_EXPEDITA',
            'EVALUACION_PLENO',
            'EVALUACION_RIESGO',
          ],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'evaluate/:id',
        component: EvaluationFormPage,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            'EVALUACION_COMPLETAR_FORMULARIO',
            'EVALUATION_FILL',
            'EVALUACION_EXPEDITA',
            'EVALUACION_PLENO',
          ],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'evaluate-risk/:id',
        component: PeerRiskAssessmentPage,
        canActivate: [AuthGuard],
        data: {
          permissions: [
            'EVALUACION_RIESGO',
            'EVALUACION_COMPLETAR_FORMULARIO',
            'EVALUATION_FILL',
            'EVALUATION_VIEW_MINE',
          ],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'consolidation/:id',
        component: EvaluationConsolidationPage,
        canActivate: [AuthGuard],
        data: {
          permissions: ['RESOLUCION_CREAR', 'EVALUACION_INFORMES', 'EVALUATION_REPORTS'],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'consolidacion/:id',
        component: EvaluationConsolidationPage,
        canActivate: [AuthGuard],
        data: {
          permissions: ['RESOLUCION_CREAR', 'EVALUACION_INFORMES', 'EVALUATION_REPORTS'],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'subsanaciones',
        loadComponent: () =>
          import('./presentation/pages/subsanacion/subsanacion.page').then(
            (m) => m.SubsanacionPage,
          ),
        canActivate: [AuthGuard],
        data: {
          permissions: ['EVALUACION_SUBSANACIONES'],
          permissionStrategy: 'any',
        },
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
