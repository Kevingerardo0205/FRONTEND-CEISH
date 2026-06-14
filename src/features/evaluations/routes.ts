import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { AssignmentPage } from './presentation/pages/assignment/assignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';
import { PeerRiskAssessmentPage } from './presentation/pages/peer-risk-assessment/peer-risk-assessment.page';
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
        data: { 
          permissions: [
            'EVALUACION_VER_PROPIAS', 
            'EVALUACION_COMPLETAR_FORMULARIO', 
            'EVALUATION_VIEW_MINE', 
            'EVALUATION_FILL',
            'EVALUACION_EXPEDITA',
            'EVALUACION_PLENO',
            'EVALUACION_RIESGO'
          ],
          permissionStrategy: 'any'
        }
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
            'EVALUACION_PLENO'
          ],
          permissionStrategy: 'any'
        }
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
            'EVALUATION_VIEW_MINE'
          ],
          permissionStrategy: 'any'
        }
      },
      {
        path: 'consolidation/:id',
        component: EvaluationConsolidationPage,
        canActivate: [AuthGuard],
        data: { 
          permissions: ['RESOLUCION_CREAR', 'EVALUACION_INFORMES', 'EVALUATION_REPORTS'],
          permissionStrategy: 'any'
        }
      },
      {
        path: 'consolidacion/:id',
        component: EvaluationConsolidationPage,
        canActivate: [AuthGuard],
        data: { 
          permissions: ['RESOLUCION_CREAR', 'EVALUACION_INFORMES', 'EVALUATION_REPORTS'],
          permissionStrategy: 'any'
        }
      },
      {
        path: 'subsanaciones',
        loadComponent: () => import('./presentation/pages/subsanacion/subsanacion.page').then(m => m.SubsanacionPage),
        canActivate: [AuthGuard],
        data: { 
          permissions: ['EVALUACION_SUBSANACIONES'],
          permissionStrategy: 'any'
        }
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];

