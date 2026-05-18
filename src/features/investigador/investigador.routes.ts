import { Routes } from '@angular/router';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { VerificadoGuard } from '@infrastructure/guards/verificado.guard';

export const INVESTIGADOR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [VerificadoGuard],
    children: [
      {
        path: 'nuevo-protocolo',
        loadComponent: () => import('./presentation/pages/nuevo-protocolo/nuevo-protocolo.page').then(m => m.NuevoProtocoloPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: 'mis-protocolos',
        loadComponent: () => import('./presentation/pages/mis-protocolos/mis-protocolos.page').then(m => m.MisProtocolosPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: 'protocolo/:id',
        loadComponent: () => import('./presentation/pages/detalle-protocolo/detalle-protocolo.page').then(m => m.DetalleProtocoloPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: 'enmienda/:id',
        loadComponent: () => import('./presentation/pages/enmiendas/enmiendas.page').then(m => m.EnmiendasPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: 'evento-adverso/:id',
        loadComponent: () => import('./presentation/pages/eventos-adversos/eventos-adversos.page').then(m => m.EventosAdversosPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: 'renovacion/:id',
        loadComponent: () => import('./presentation/pages/renovaciones/renovaciones.page').then(m => m.RenovacionesPage),
        canActivate: [RoleGuard],
        data: { roles: ['INVESTIGADOR', 'ADMIN', 'SECRETARIA', 'PRESIDENTA'] }
      },
      {
        path: '',
        redirectTo: 'mis-protocolos',
        pathMatch: 'full'
      }
    ]
  }
];
