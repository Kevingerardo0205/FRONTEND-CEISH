import { Route, Routes } from '@angular/router';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { AI_ASSISTANT_ADMIN_ROUTES } from '@features/ai-assistant-admin/routes';
import { AUDIT_ROUTES } from '@features/audit/routes';
import { NOTIFICATION_ROUTES } from '@features/notifications/routes';
import { REPORTS_ROUTES } from '@features/reports/routes';
import { RESOLUTION_ROUTES } from '@features/resolutions/routes';
import { INVESTIGADOR_ROUTES } from '@features/investigador/investigador.routes';
import { PROTOCOL_ROUTES } from '@features/protocols/routes';
import { EVALUATION_ROUTES } from '@features/evaluations/routes';
import { DASHBOARD_ROUTES } from '@features/dashboard/routes';

interface FlatRoute {
  path: string;
  route: Route;
}

const ROUTE_GROUPS: Record<string, Routes> = {
  'ai-assistant-admin': AI_ASSISTANT_ADMIN_ROUTES,
  audit: AUDIT_ROUTES,
  notifications: NOTIFICATION_ROUTES,
  reports: REPORTS_ROUTES,
  resolutions: RESOLUTION_ROUTES,
  investigador: INVESTIGADOR_ROUTES,
  protocols: PROTOCOL_ROUTES,
  dashboard: DASHBOARD_ROUTES,
};

const VALID_ROLES = Role.all().map((role) => role.code);

function flatten(routes: Routes, prefix = ''): FlatRoute[] {
  return routes.flatMap((route) => {
    const segment = route.path ?? '';
    const fullPath = prefix && segment ? `${prefix}/${segment}` : segment || prefix;
    const current = { path: fullPath || '(root)', route };
    const children = route.children ? flatten(route.children, fullPath) : [];
    return [current, ...children];
  });
}

function roleList(route: Route): string[] | null {
  const roles = route.data?.['roles'];
  if (!roles) return null;
  return Array.isArray(roles) ? [...roles] : [roles];
}

describe('Route role codes (T13a)', () => {
  it('no usa códigos de rol fuera de Role.all()', () => {
    const invalid: string[] = [];

    for (const [group, routes] of Object.entries(ROUTE_GROUPS)) {
      for (const { path, route } of flatten(routes)) {
        for (const code of roleList(route) ?? []) {
          if (!VALID_ROLES.includes(code as RoleCode)) {
            invalid.push(`${group}|${path}|${code}`);
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('mantiene la tabla ruta → roles de las decisiones D2, D4 y D5', () => {
    const expected: Record<string, string[]> = {
      'ai-assistant-admin|(root)': ['SECRETARIA'],
      'audit|logs': ['SECRETARIA', 'PRESIDENTE'],
      'audit|trail/:id': ['SECRETARIA', 'PRESIDENTE'],
      'notifications|templates': ['SECRETARIA'],
      'reports|stats': ['SECRETARIA', 'PRESIDENTE'],
      'reports|msp': ['SECRETARIA', 'PRESIDENTE'],
      'reports|custom': ['SECRETARIA', 'PRESIDENTE'],
      'resolutions|calls': ['SECRETARIA', 'PRESIDENTE'],
      'resolutions|generator': ['SECRETARIA', 'PRESIDENTE'],
      'investigador|nuevo-protocolo': ['INVESTIGADOR', 'SECRETARIA'],
      'investigador|mis-protocolos': ['INVESTIGADOR', 'SECRETARIA'],
      'investigador|protocolo/:id/editar': ['INVESTIGADOR', 'SECRETARIA'],
      'investigador|protocolo-legacy/:id': ['INVESTIGADOR', 'SECRETARIA'],
      'investigador|evento-adverso/:id': ['INVESTIGADOR', 'SECRETARIA'],
      'investigador|renovacion/:id': ['INVESTIGADOR', 'SECRETARIA'],
      'protocols|list': ['SECRETARIA'],
      'protocols|validation/list': ['SECRETARIA'],
      'protocols|reception/new': ['SECRETARIA'],
      'dashboard|admin/users': ['SECRETARIA'],
      'dashboard|admin/templates': ['SECRETARIA'],
      'dashboard|admin/ai-assistant': ['SECRETARIA'],
      'dashboard|audit': ['SECRETARIA', 'PRESIDENTE'],
    };

    const actual: Record<string, string[]> = {};
    for (const [group, routes] of Object.entries(ROUTE_GROUPS)) {
      for (const { path, route } of flatten(routes)) {
        const roles = roleList(route);
        if (roles) actual[`${group}|${path}`] = roles;
      }
    }

    expect(actual).toEqual(expected);
  });

  it('deja las rutas de evaluación sin data.roles (no cambia quién entra)', () => {
    const withRoles = flatten(EVALUATION_ROUTES).filter(({ route }) => roleList(route));

    expect(withRoles).toEqual([]);
  });

  it('protege con RoleGuard toda ruta que declara data.roles', () => {
    const unprotected: string[] = [];

    for (const [group, routes] of Object.entries(ROUTE_GROUPS)) {
      for (const { path, route } of flatten(routes)) {
        if (roleList(route) && !(route.canActivate ?? []).includes(RoleGuard)) {
          unprotected.push(`${group}|${path}`);
        }
      }
    }

    expect(unprotected).toEqual([]);
  });
});
