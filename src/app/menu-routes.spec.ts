import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { RoleCode } from '@domain/value-objects/role.vo';
import { NotificationService } from '@infrastructure/services/notification.service';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { MENU_ITEMS } from '@features/shell/infrastructure/menu.config';
import { appConfig } from './app.config';

const ROLE_KEY = 'ceish.activeRole';
/**
 * Permisos de cada rol en la matriz fija del backend (dev: migraciones 1880000000000-FixedRolesMatrix
 * y 1900000000000-AddProtocolosListarPermission). Son los del rol, no los que pide cada ruta: así la
 * prueba falla si una opción del menú necesita un permiso que ese rol no tiene.
 */
const ROLE_PERMISSIONS: Record<Exclude<RoleCode, 'SECRETARIA'>, string[]> = {
  PRESIDENTE: [
    'DASHBOARD_RESUMEN', 'DASHBOARD_NOTIF', 'DASHBOARD_VENCIMIENTOS', 'EVALUACION_INFORMES',
    'EVALUACION_RIESGO', 'EVALUACION_EXPEDITA', 'EVALUACION_PLENO', 'RESOLUCION_CREAR',
    'RESOLUCION_NOTIF', 'RESOLUCION_HISTORIAL', 'RESOLUCION_CONVOCATORIAS', 'RESOLUCION_FIRMAR',
    'SEGUIMIENTO_AVANCE', 'SEGUIMIENTO_FINAL', 'SEGUIMIENTO_EVENTOS', 'SEGUIMIENTO_RENOVACIONES',
    'SEGUIMIENTO_SUSPENSION', 'REPORTES_CARGA', 'REPORTES_EXPORTAR', 'REPORTES_AUDITORIA',
    'AUDITORIA_ACCESOS', 'PROTOCOLOS_LISTAR',
  ],
  EVALUADOR: [
    'DASHBOARD_RESUMEN', 'DASHBOARD_NOTIF', 'EVALUACION_RIESGO', 'EVALUACION_EXPEDITA',
    'EVALUACION_PLENO', 'SEGUIMIENTO_AVANCE', 'SEGUIMIENTO_FINAL', 'SEGUIMIENTO_EVENTOS',
    'SEGUIMIENTO_RENOVACIONES',
  ],
  INVESTIGADOR: [
    'DASHBOARD_RESUMEN', 'DASHBOARD_NOTIF', 'RECEPCION_NUEVO', 'EVALUACION_SUBSANACIONES',
    'SEGUIMIENTO_AVANCE', 'SEGUIMIENTO_FINAL', 'SEGUIMIENTO_EVENTOS', 'SEGUIMIENTO_RENOVACIONES',
  ],
};

describe('F10: cada opción del menú abre su pantalla con su rol activo', () => {
  let notify: jasmine.Spy;
  let harness: RouterTestingHarness;
  let router: Router;

  async function start(
    roles: RoleCode[] | null,
    active?: RoleCode,
    permissions: string[] = [],
    extra: Provider[] = [],
  ): Promise<void> {
    let token: string | null = roles ? 'token-de-prueba' : null;
    if (roles) {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          nombre: 'Usuario Prueba',
          email: 'usuario.prueba@example.test',
          rol: roles[0],
          roles,
          emailVerificado: true,
          permissions,
        }),
      );
    }
    if (active) localStorage.setItem(ROLE_KEY, active);
    notify = jasmine.createSpy('notify');
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        {
          provide: TokenStoreAdapter,
          useValue: {
            getToken: () => token,
            getRefreshToken: () => null,
            saveToken: (value: string) => (token = value),
            saveRefreshToken: () => undefined,
            removeTokens: () => undefined,
          },
        },
        { provide: NotificationService, useValue: { notify } },
        ...extra,
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem(ROLE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem(ROLE_KEY);
  });

  for (const item of MENU_ITEMS.filter((entry) => !entry.roles.includes('SECRETARIA'))) {
    const role = item.roles[0] as Exclude<RoleCode, 'SECRETARIA'>;

    it(role + ' abre ' + item.label + ' en ' + item.route, async () => {
      expect(ROLE_PERMISSIONS[role]).withContext('permisos de la matriz para ' + role).toBeDefined();
      await start([role], role, ROLE_PERMISSIONS[role]);

      await harness.navigateByUrl(item.route);

      expect(router.url).toBe(item.route);
      expect(notify).not.toHaveBeenCalled();
    });
  }

  it('INVESTIGADOR, con los permisos de la matriz, abre Subsanaciones desde su menú sin aviso (D4 v0.2)', async () => {
    const item = MENU_ITEMS.find(
      (entry) => entry.roles.includes('INVESTIGADOR') && entry.label === 'Subsanaciones',
    );
    expect(item?.route).toBe('/dashboard/evaluacion-etica/subsanaciones');
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ROLE_PERMISSIONS.INVESTIGADOR);

    await harness.navigateByUrl('/dashboard/evaluacion-etica/subsanaciones');

    expect(router.url).toBe('/dashboard/evaluacion-etica/subsanaciones');
    expect(notify).not.toHaveBeenCalled();
  });

  it('INVESTIGADOR que abre /dashboard/resolutions/calls vuelve a /dashboard/home con aviso', async () => {
    // Control: con el permiso de la ruta, AuthGuard deja pasar y es RoleGuard quien rebota con aviso.
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ['RESOLUCION_CONVOCATORIAS']);

    await harness.navigateByUrl('/dashboard/resolutions/calls');

    expect(router.url).toBe('/dashboard/home');
    expect(notify).toHaveBeenCalledOnceWith(
      'No tiene acceso a esta sección con el rol activo.',
      'info',
    );
  });
});