import { Routes } from '@angular/router';
import { ProtocolListPage } from './components/protocol-list.page';
import { ProtocolValidationListPage } from './presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from './presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { ProtocolReceptionNewPage } from './presentation/pages/protocol-reception-new/protocol-reception-new.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import {
  redirectEvaluatorToMyEvaluations,
  redirectToFirstWorkspaceTab,
} from '@infrastructure/guards/workspace-entry.redirect';

import { ProtocolWorkspaceComponent } from './presentation/pages/protocol-workspace/protocol-workspace.component';
import { WORKSPACE_TAB_ROLES } from './domain/workspace-tab-roles';
import { PROTOCOL_HEADER_PROVIDERS } from './protocol-header.providers';

export const PROTOCOL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'list',
        component: ProtocolListPage,
        canActivate: [RoleGuard],
        data: { roles: ['SECRETARIA'] },
      },
      {
        path: 'workspace/:id',
        component: ProtocolWorkspaceComponent,
        // F10 D18: el encabezado del protocolo tiene su propio port (sin rellenos).
        providers: PROTOCOL_HEADER_PROVIDERS,
        children: [
          {
            path: 'reception',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/tabs/protocol-detail-tab.component').then(
                (m) => m.ProtocolDetailTabPage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info] },
          },
          {
            path: 'info',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/tabs/protocol-detail-tab.component').then(
                (m) => m.ProtocolDetailTabPage,
              ),
            canActivate: [RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info] },
          },
          {
            // EP2b: FORMULARIO de asignación (PeerAssignmentFormPage en modo espacio). Es el único
            // formulario: /dashboard/evaluations/assignment/:protocolId redirige aquí.
            path: 'assignment',
            loadComponent: () =>
              import('../evaluations/presentation/pages/peer-assignment-form/peer-assignment-form.page').then(
                (m) => m.PeerAssignmentFormPage,
              ),
            // canMatch: corre antes de activar la ruta; así AuthGuard no avisa al EVALUADOR, que va a
            // «Mis evaluaciones» sin aviso (los canActivate de una ruta corren en paralelo).
            canMatch: [redirectEvaluatorToMyEvaluations],
            canActivate: [RoleGuard, AuthGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.assignment], permissions: ['EVALUACION_ASIGNAR'] },
          },
          {
            // EP2c: HISTORIAL de asignaciones (consulta), con los roles de consulta.
            path: 'assignment-history',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/protocol-assignment-history.page').then(
                (m) => m.ProtocolAssignmentHistoryPage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info] },
          },
          {
            path: 'validation',
            component: ProtocolValidationDetailPage,
            canActivate: [RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.validation] },
          },
          {
            // F10 D11 (S-1c, actualizada en S-1f): la evaluación ya no está en el espacio; los enlaces
            // viejos van al mismo destino que la ruta sin pestaña (EVALUADOR: Mis evaluaciones).
            path: 'evaluation',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/protocol-workspace-stage.page').then(
                (m) => m.ProtocolWorkspaceStagePage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info], stage: 'EVALUACION' },
          },
          {
            path: 'resolution',
            loadComponent: () =>
              import('../resolutions/presentation/pages/resolution-stage/resolution-stage.page').then(
                (m) => m.ResolutionStagePage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info], stage: 'RESOLUCION' },
          },
          {
            path: 'follow-up',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/protocol-workspace-stage.page').then(
                (m) => m.ProtocolWorkspaceStagePage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info], stage: 'SEGUIMIENTO' },
          },
          {
            path: 'renewal',
            loadComponent: () =>
              import('./presentation/pages/protocol-workspace/protocol-workspace-stage.page').then(
                (m) => m.ProtocolWorkspaceStagePage,
              ),
            canActivate: [redirectEvaluatorToMyEvaluations, RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.info], stage: 'RENOVACION' },
          },
          {
            path: '',
            redirectTo: redirectToFirstWorkspaceTab,
            pathMatch: 'full',
          },
        ],
      },
      // Redirecciones Legacy para compatibilidad
      {
        path: 'detail/:id',
        redirectTo: 'workspace/:id/info',
      },
      {
        path: 'validation/detail/:id',
        redirectTo: 'workspace/:id/validation',
      },
      {
        path: 'validation/list',
        component: ProtocolValidationListPage,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['SECRETARIA'],
          permissions: ['RECEPCION_VALIDAR', 'DOCUMENTOS_VALIDAR', 'RECEPCION_VER'],
          permissionStrategy: 'any',
        },
      },
      {
        path: 'reception/new',
        component: ProtocolReceptionNewPage,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['SECRETARIA'],
          permissions: ['RECEPCION_NUEVO', 'RECEPCION_VER'],
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
