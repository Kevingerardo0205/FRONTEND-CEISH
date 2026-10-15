import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { ResolutionGeneratorPage } from './presentation/pages/resolution-generator/resolution-generator.page';

export const RESOLUTION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'calls',
        loadComponent: () => import('./presentation/pages/calls-management/calls-management.page').then(m => m.CallsManagementPage),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['SECRETARIA', 'PRESIDENTE', 'ADMIN_TI'], permissions: ['RESOLUCION_CONVOCATORIAS'] }
      },
      {
        path: 'generator',
        component: ResolutionGeneratorPage,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['SECRETARIA', 'PRESIDENTE', 'ADMIN_TI'] }
      },
      {
        path: '',
        redirectTo: 'generator',
        pathMatch: 'full'
      }
    ]
  }
];
