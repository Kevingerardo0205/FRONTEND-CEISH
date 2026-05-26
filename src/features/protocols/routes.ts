import { Routes } from '@angular/router';
import { ProtocolListPage } from './components/protocol-list.page';
import { ProtocolCreatePage } from './components/protocol-create.page';
import { ProtocolDetailPage } from './components/protocol-detail.page';
import { ProtocolValidationListPage } from './presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from './presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { ProtocolReceptionNewPage } from './presentation/pages/protocol-reception-new/protocol-reception-new.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { VerificadoGuard } from '@infrastructure/guards/verificado.guard';

import { ProtocolWorkspaceComponent } from './presentation/pages/protocol-workspace/protocol-workspace.component';

export const PROTOCOL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'list',
        component: ProtocolListPage
      },
      {
        path: 'workspace/:id',
        component: ProtocolWorkspaceComponent,
        children: [
          {
            path: 'info',
            loadComponent: () => import('./presentation/pages/protocol-workspace/tabs/protocol-detail-tab.component').then(m => m.ProtocolDetailTabPage)
          },
          {
            path: 'validation',
            component: ProtocolValidationDetailPage
          },
          {
            path: 'evaluation',
            loadComponent: () => import('../evaluations/presentation/pages/evaluation-form/evaluation-form.page').then(m => m.EvaluationFormPage)
          },
          {
            path: 'follow-up',
            loadComponent: () => import('../follow-up/presentation/pages/adverse-events/adverse-events-list.page').then(m => m.AdverseEventsListPage)
          },
          {
            path: '',
            redirectTo: 'info',
            pathMatch: 'full'
          }
        ]
      },
      // Redirecciones Legacy para compatibilidad
      {
        path: 'detail/:id',
        redirectTo: 'workspace/:id/info'
      },
      {
        path: 'validation/detail/:id',
        redirectTo: 'workspace/:id/validation'
      },
      {
        path: 'validation/list',
        component: ProtocolValidationListPage,
        canActivate: [AuthGuard],
        data: { 
          permissions: ['RECEPCION_VALIDAR', 'DOCUMENTOS_VALIDAR', 'RECEPCION_VER'],
          permissionStrategy: 'any'
        }
      },
      {
        path: 'reception/new',
        component: ProtocolReceptionNewPage,
        canActivate: [AuthGuard],
        data: { 
          permissions: ['RECEPCION_NUEVO', 'RECEPCION_VER'],
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
