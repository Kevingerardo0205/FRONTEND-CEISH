import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { activeRoleIs, redirectToRoleHome } from '@infrastructure/guards/role-home.guard';

/**
 * Rutas nuevas de la Secretaría bajo el AppShell (D10, 03/11/2026; spec-ui §7).
 * Solo SECRETARIA: RoleGuard va primero para que otro rol vuelva a su inicio con aviso
 * (criterio 4); AuthGuard revisa los mismos permisos que la ruta /dashboard/... de origen.
 * PRESIDENTE sigue entrando a convocatorias y reportes por /dashboard/....
 */
export const SECRETARIA_ROUTES: Routes = [
  {
    path: 'pendientes',
    loadComponent: () =>
      import('@features/dashboard/presentation/pages/dashboard-secretaria/dashboard-secretaria.page').then(
        (m) => m.DashboardSecretariaPage,
      ),
    canActivate: [RoleGuard, AuthGuard],
    data: { roles: ['SECRETARIA'] },
  },
  {
    // Temporal hasta F01: Validación Documental.
    path: 'protocolos',
    loadComponent: () =>
      import('@features/protocols/presentation/pages/protocol-validation-list/protocol-validation-list.page').then(
        (m) => m.ProtocolValidationListPage,
      ),
    canActivate: [RoleGuard, AuthGuard],
    data: {
      roles: ['SECRETARIA'],
      permissions: ['RECEPCION_VALIDAR', 'DOCUMENTOS_VALIDAR', 'RECEPCION_VER'],
      permissionStrategy: 'any',
    },
  },
  {
    path: 'convocatorias',
    loadComponent: () =>
      import('@features/resolutions/presentation/pages/calls-management/calls-management.page').then(
        (m) => m.CallsManagementPage,
      ),
    canActivate: [RoleGuard, AuthGuard],
    data: { roles: ['SECRETARIA'], permissions: ['RESOLUCION_CONVOCATORIAS'] },
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('@features/reports/presentation/pages/stats-dashboard/stats-dashboard.page').then(
        (m) => m.StatsDashboardPage,
      ),
    canActivate: [RoleGuard, AuthGuard],
    data: { roles: ['SECRETARIA'] },
  },
  {
    // Plazos es F08.
    path: 'configuracion',
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('@features/dashboard/presentation/pages/user-management.page').then(
            (m) => m.UserManagementPage,
          ),
        canActivate: [RoleGuard, AuthGuard],
        data: { roles: ['SECRETARIA'], permissions: ['USUARIOS_VER'] },
      },
    ],
  },
];

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    // D13: con sesión, el inicio del rol activo; sin sesión, /auth/login.
    path: '',
    redirectTo: redirectToRoleHome,
    pathMatch: 'full',
  },
  {
    // D9 (T13d-3): un solo AppShell para la Secretaría, con las rutas nuevas y /dashboard/...
    // como hijos: la instancia se conserva al pasar de /pendientes a /dashboard/... y volver.
    path: '',
    loadComponent: () =>
      import('@features/shell/presentation/app-shell/app-shell.component').then(
        (m) => m.AppShellComponent,
      ),
    canMatch: [activeRoleIs('SECRETARIA')],
    canActivate: [AuthGuard],
    children: [
      ...SECRETARIA_ROUTES,
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/routes').then((m) => m.SECRETARIA_DASHBOARD_ROUTES),
      },
    ],
  },
  {
    // Criterio 4: con otro rol activo, el canMatch de arriba no coincide. Sin este respaldo
    // (sin layout) la URL caería en ** y llegaría al inicio sin aviso; aquí el RoleGuard de
    // cada ruta nueva avisa y lleva al inicio del rol activo (D12).
    path: '',
    children: SECRETARIA_ROUTES,
  },
  {
    // Otros roles: /dashboard/... con DashboardPage (D1).
    path: 'dashboard',
    loadChildren: () => import('@features/dashboard/routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    // D13: igual que ''.
    path: '**',
    redirectTo: redirectToRoleHome,
  },
];
