import { Routes } from '@angular/router';
import { ProtocolListPage } from './components/protocol-list.page';
import { ProtocolCreatePage } from './components/protocol-create.page';
import { ProtocolDetailPage } from './components/protocol-detail.page';
import { ProtocolValidationListPage } from './presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from './presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { ProtocolReceptionNewPage } from './presentation/pages/protocol-reception-new/protocol-reception-new.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { VerificadoGuard } from '@infrastructure/guards/verificado.guard';

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
        path: 'create',
        component: ProtocolCreatePage,
        canActivate: [AuthGuard, VerificadoGuard],
        data: { permissions: ['RECEPCION_SUBIR_DOCUMENTOS'] }
      },
      {
        path: 'detail/:id',
        component: ProtocolDetailPage
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
        path: 'validation/detail/:id',
        component: ProtocolValidationDetailPage,
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
