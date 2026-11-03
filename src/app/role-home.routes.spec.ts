import { Route } from '@angular/router';
import { RoleCode } from '@domain/value-objects/role.vo';
import { ROLE_HOME } from '@features/shell/domain/role-home';
import { SECRETARIA_ROUTES } from './app.routes';

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
