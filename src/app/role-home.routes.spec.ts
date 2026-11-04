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
        // Fuera del AppShell, el inicio es /dashboard/home, que no exige rol.
        expect(home).toBe('/dashboard/home');
      }
    });
  }
});

/**
 * Sin navegar: sin el canMatch del AppShell, todos los roles entran a su rama y se forma
 * un bucle /pendientes ↔ /dashboard/home que cuelga el navegador. Esta prueba lo detecta antes.
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

  it('el canMatch del AppShell coincide solo con el rol activo SECRETARIA', () => {
    expect(matches('SECRETARIA')).toBeTrue();
  });

  for (const role of ['PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR', null] as (RoleCode | null)[]) {
    it(`el canMatch del AppShell no coincide con ${role ?? 'sin rol activo'}`, () => {
      expect(matches(role)).toBeFalse();
    });
  }

  it("el AppShell va antes que 'dashboard' de DashboardPage y que **", () => {
    const dashboard = routes.findIndex((r) => r.path === 'dashboard');
    const wildcard = routes.findIndex((r) => r.path === '**');
    expect(shellIndex()).toBeGreaterThanOrEqual(0);
    expect(shellIndex()).toBeLessThan(dashboard);
    expect(dashboard).toBeLessThan(wildcard);
  });
});

/**
 * Sin navegar: D11 solo en la rama de la Secretaría. Si DashboardPage también redirigiera
 * /dashboard/home a /pendientes, los otros roles entrarían en un bucle con el RoleGuard.
 */
describe('Redirect de /dashboard/home solo en la rama de la Secretaría (D11)', () => {
  const home = (list: Route[]) => list.find((r) => r.path === 'home');

  it('en la rama de la Secretaría, home redirige (a /pendientes)', () => {
    expect(home(SECRETARIA_DASHBOARD_ROUTES)?.redirectTo).toBeDefined();
  });

  it('en DashboardPage, home carga DashboardHomePage y no redirige', () => {
    const page = home(DASHBOARD_ROUTES[0].children ?? []);
    expect(page?.redirectTo).toBeUndefined();
    expect(page?.loadComponent).toBeDefined();
  });
});
