import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { RoleCode } from '@domain/value-objects/role.vo';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { ROLE_HOME } from '@features/shell/domain/role-home';
import { DASHBOARD_ROUTES, SECRETARIA_DASHBOARD_ROUTES } from '@features/dashboard/routes';
import { SECRETARIA_ROUTES, routes } from './app.routes';

/**
 * Sin navegar: un ROLE_HOME que apunte a una ruta que su rol no admite produce un bucle
 * RoleGuard → ROLE_HOME → RoleGuard que cuelga el navegador. Esta prueba lo detecta antes.
 */
describe('ROLE_HOME contra data.roles de las rutas (T13d)', () => {
  const leaves = (list: Route[]): Route[] =>
    list.flatMap((r) => (r.children ? leaves(r.children) : r.redirectTo ? [] : [r]));

  for (const role of ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
    it(`ROLE_HOME[${role}] apunta a una ruta que admite ${role} (sin bucle)`, () => {
      const home = ROLE_HOME[role];
      const page = leaves(SECRETARIA_ROUTES).find((r) => '/' + r.path === home);
      if (page) {
        expect(page.data?.['roles']).toContain(role);
      } else {
        // Fuera de las rutas nuevas, el inicio es /dashboard/home, que no exige rol.
        expect(home).toBe('/dashboard/home');
      }
    });
  }
});

/**
 * Sin navegar: el padre único del AppShell coincide con los 4 roles (F10 D16 (11)) y no
 * coincide sin rol activo (esa sesión va al respaldo y recibe un solo aviso, F00 D12).
 */
describe('Padre único del AppShell (T13d-3)', () => {
  const shellIndex = () =>
    routes.findIndex((r) => !!r.loadComponent && !!r.children?.includes(SECRETARIA_ROUTES[0]));

  function matches(active: RoleCode | null): boolean {
    TestBed.configureTestingModule({
      providers: [{ provide: ActiveRoleFacade, useValue: { activeRole: signal(active) } }],
    });
    const guards = (routes[shellIndex()].canMatch ?? []) as CanMatchFn[];
    expect(guards.length).toBe(1);
    return TestBed.runInInjectionContext(
      () => guards[0](routes[shellIndex()], [] as UrlSegment[]) as boolean,
    );
  }

  for (const role of ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
    it(`el canMatch del AppShell coincide con el rol activo ${role}`, () => {
      expect(matches(role)).toBeTrue();
    });
  }

  it('el canMatch del AppShell no coincide sin rol activo', () => {
    expect(matches(null)).toBeFalse();
  });

  // Sin este canMatch, los otros roles toman la redirección de D11 y se forma el bucle
  // /pendientes ↔ /dashboard/home que cuelga el navegador.
  for (const role of ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
    it(`el primer hijo 'dashboard' del AppShell (D11) ${role === 'SECRETARIA' ? 'coincide' : 'no coincide'} con ${role}`, () => {
      TestBed.configureTestingModule({
        providers: [{ provide: ActiveRoleFacade, useValue: { activeRole: signal(role) } }],
      });
      const first = routes[shellIndex()].children?.find((r) => r.path === 'dashboard');
      const guards = (first?.canMatch ?? []) as CanMatchFn[];
      expect(guards.length).withContext('canMatch del primer hijo dashboard').toBe(1);
      const result = TestBed.runInInjectionContext(
        () => guards[0](first as Route, [] as UrlSegment[]) as boolean,
      );
      expect(result).toBe(role === 'SECRETARIA');
    });
  }

  it("no hay padre 'dashboard' fuera del AppShell, y el AppShell va antes que **", () => {
    const wildcard = routes.findIndex((r) => r.path === '**');
    expect(routes.some((r) => r.path === 'dashboard')).toBeFalse();
    expect(shellIndex()).toBeGreaterThanOrEqual(0);
    expect(shellIndex()).toBeLessThan(wildcard);
  });
});

/**
 * Sin navegar: D11 solo en la rama de la Secretaría. Si la rama de los otros roles también
 * redirigiera /dashboard/home a /pendientes, entrarían en un bucle con el RoleGuard.
 */
describe('Redirect de /dashboard/home solo en la rama de la Secretaría (D11)', () => {
  const home = (list: Route[]) => list.find((r) => r.path === 'home');

  it('en la rama de la Secretaría, home redirige (a /pendientes)', () => {
    expect(home(SECRETARIA_DASHBOARD_ROUTES)?.redirectTo).toBeDefined();
  });

  it('en la rama de los otros roles (DASHBOARD_ROUTES), home carga DashboardHomePage y no redirige', () => {
    const page = home(DASHBOARD_ROUTES);
    expect(page?.redirectTo).toBeUndefined();
    expect(page?.loadComponent).toBeDefined();
    expect(DASHBOARD_ROUTES.some((r) => !!r.component)).withContext('sin marco propio').toBeFalse();
  });
});
