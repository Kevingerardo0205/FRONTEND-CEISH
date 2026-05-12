import { Routes } from '@angular/router';
import { ProtocolListPage } from './components/protocol-list.page';
import { ProtocolCreatePage } from './components/protocol-create.page';
import { ProtocolDetailPage } from './components/protocol-detail.page';
import { ProtocolValidationListPage } from './presentation/pages/protocol-validation-list/protocol-validation-list.page';
import { ProtocolValidationDetailPage } from './presentation/pages/protocol-validation-detail/protocol-validation-detail.page';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { VerificadoGuard } from '@infrastructure/guards/verificado.guard';

export const PROTOCOL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, VerificadoGuard],
    children: [
      {
        path: 'list',
        component: ProtocolListPage
      },
      {
        path: 'create',
        component: ProtocolCreatePage,
        data: { permissions: ['RECEPCION_SUBIR_DOCUMENTOS'] }
      },
      {
        path: 'detail/:id',
        component: ProtocolDetailPage
      },
      {
        path: 'validation',
        data: { permissions: ['DOCUMENTOS_VALIDAR'] },
        children: [
          {
            path: 'list',
            component: ProtocolValidationListPage
          },
          {
            path: 'detail/:id',
            component: ProtocolValidationDetailPage
          }
        ]
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];
