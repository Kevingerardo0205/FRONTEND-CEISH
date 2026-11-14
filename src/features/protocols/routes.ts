import { Routes } from '@angular/router';
import { ProtocolListPage } from './components/protocol-list.page';
import { ProtocolValidationListPage } from './presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from './presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { ProtocolReceptionNewPage } from './presentation/pages/protocol-reception-new/protocol-reception-new.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { redirectToFirstWorkspaceTab } from '@infrastructure/guards/workspace-entry.redirect';

import { ProtocolWorkspaceComponent } from './presentation/pages/protocol-workspace/protocol-workspace.component';
import { WORKSPACE_TAB_ROLES } from './domain/workspace-tab-roles';

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
        children: [
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
            path: 'validation',
            component: ProtocolValidationDetailPage,
            canActivate: [RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES.validation] },
          },
          {
            // F10 D11 (S-1c, actualizada en S-1f): la evaluación ya no está en el espacio; los enlaces
            // viejos van al mismo destino que la ruta sin pestaña (EVALUADOR: Mis evaluaciones).
            path: 'evaluation',
            redirectTo: redirectToFirstWorkspaceTab,
            pathMatch: 'full',
          },
          {
            path: 'follow-up',
            loadComponent: () =>
              import('../follow-up/presentation/pages/adverse-events/adverse-events-list.page').then(
                (m) => m.AdverseEventsListPage,
              ),
            canActivate: [RoleGuard],
            data: { roles: [...WORKSPACE_TAB_ROLES['follow-up']] },
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
