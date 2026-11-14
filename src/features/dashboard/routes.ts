import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { redirectKeepingQuery } from '@infrastructure/guards/role-home.guard';

/**
 * /dashboard/... de PRESIDENTE, EVALUADOR e INVESTIGADOR dentro del AppShell (F10 D16 (11));
 * la Secretaría usa las mismas rutas con los redirects de D11 (SECRETARIA_DASHBOARD_ROUTES).
 * Retiro: cuando F01–F08 muevan cada pantalla a su ruta nueva, su hijo sale de aquí.
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./presentation/pages/dashboard-home.page').then((m) => m.DashboardHomePage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./presentation/pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./presentation/pages/user-management.page').then((m) => m.UserManagementPage),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA'], permissions: ['USUARIOS_VER'] },
  },
  // Retirado en F00-T01b: fuera de alcance (el código se borra en F08).
  {
    path: 'admin/security',
    redirectTo: '/dashboard/home',
  },
  {
    path: 'admin/ai-assistant',
    loadChildren: () =>
      import('@features/ai-assistant-admin/routes').then((m) => m.AI_ASSISTANT_ADMIN_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA'], permissions: ['CONFIG_PLANTILLAS'] },
  },
  {
    path: 'admin/templates',
    loadComponent: () =>
      import('./presentation/pages/template-management/template-management.page').then(
        (m) => m.TemplateManagementPage,
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA'], permissions: ['CONFIG_PLANTILLAS'] },
  },
  {
    path: 'protocols',
    loadChildren: () => import('@features/protocols/routes').then((m) => m.PROTOCOL_ROUTES),
  },
  {
    path: 'evaluations',
    loadChildren: () => import('@features/evaluations/routes').then((m) => m.EVALUATION_ROUTES),
  },
  {
    path: 'evaluacion-etica',
    loadChildren: () => import('@features/evaluations/routes').then((m) => m.EVALUATION_ROUTES),
  },
  {
    path: 'follow-up',
    loadChildren: () => import('@features/follow-up/routes').then((m) => m.FOLLOW_UP_ROUTES),
  },
  {
    path: 'resolutions',
    loadChildren: () => import('@features/resolutions/routes').then((m) => m.RESOLUTION_ROUTES),
  },
  // Retirado en F00-T01b: fuera de alcance (el código se borra en F08).
  {
    path: 'amendments',
    redirectTo: '/dashboard/home',
  },
  {
    path: 'renewals',
    loadChildren: () => import('@features/renewals/routes').then((m) => m.RENEWAL_ROUTES),
  },
  {
    path: 'reports',
    loadChildren: () => import('@features/reports/routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'investigador',
    loadChildren: () =>
      import('@features/investigador/investigador.routes').then((m) => m.INVESTIGADOR_ROUTES),
  },
  {
    path: 'audit',
    loadChildren: () => import('@features/audit/routes').then((m) => m.AUDIT_ROUTES),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SECRETARIA', 'PRESIDENTE'] },
  },
  {
    path: 'notifications',
    loadChildren: () => import('@features/notifications/routes').then((m) => m.NOTIFICATION_ROUTES),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

/**
 * /dashboard/... de la Secretaría (D9, T13d-3): se carga como el primer hijo 'dashboard' del
 * AppShell (canMatch SECRETARIA), así /pendientes y /dashboard/... comparten la misma instancia.
 * D11: /dashboard y /dashboard/home → /pendientes, conservando los query params (?tab=peers).
 * Retiro: cuando F01–F08 muevan las pantallas de la Secretaría a sus rutas nuevas.
 */
export const SECRETARIA_DASHBOARD_ROUTES: Routes = [
  { path: 'home', redirectTo: redirectKeepingQuery('/pendientes'), pathMatch: 'full' },
  { path: '', redirectTo: redirectKeepingQuery('/pendientes'), pathMatch: 'full' },
  ...DASHBOARD_ROUTES,
];
