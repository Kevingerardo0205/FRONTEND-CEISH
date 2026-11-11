import { Provider } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Role, RoleCode } from '@domain/value-objects/role.vo';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { destinoAccion } from '@features/pendientes/domain/accion.rules';
import { WORKSPACE_TAB_ROLES, WorkspaceTab } from '@features/protocols/domain/workspace-tab-roles';
import { PROTOCOL_ROUTES } from '@features/protocols/routes';
import { MENU_ITEMS } from '@features/shell/infrastructure/menu.config';
import { appConfig } from './app.config';
import { NotificationService } from '@infrastructure/services/notification.service';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';

const ROLE_KEY = 'ceish.activeRole';
const ACCESS_DENIED_MESSAGE = 'No tiene acceso a esta sección con el rol activo.';
const WORKSPACE_ROOT = '/dashboard/protocols/workspace/1';
/** Ruta de "Mis evaluaciones" aprobada en F10 D11 (11/11/2026); la prueba comprueba que es la de MENU_ITEMS. */
const EVALUATOR_LIST = '/dashboard/evaluations/list';

/** Tabla aprobada por la usuaria (F10 spec-ui D10, 11/11/2026). Es la referencia de la prueba: no se deriva del código. */
const EXPECTED_TAB_ROLES: Record<WorkspaceTab, RoleCode[]> = {
  info: ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
  validation: ['SECRETARIA', 'INVESTIGADOR'],
  'follow-up': ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'],
};

/**
 * Permisos por rol de la matriz fija del backend (dev: migraciones 1880000000000-FixedRolesMatrix
 * y 1900000000000-AddProtocolosListarPermission). Son los del rol, no los que pide cada ruta: así
 * esta prueba detecta si una entrada necesita un permiso que ese rol no tiene en la matriz.
 */
const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  SECRETARIA: [
    'DASHBOARD_RESUMEN', 'DASHBOARD_NOTIF', 'DASHBOARD_VENCIMIENTOS', 'RECEPCION_LISTA',
    'RECEPCION_VALIDAR', 'RECEPCION_BUSCAR', 'RECEPCION_CONSTANCIAS', 'RECEPCION_NUEVO',
    'EVALUACION_ASIGNAR', 'EVALUACION_INFORMES', 'EVALUACION_RIESGO', 'EVALUACION_EXPEDITA',
    'EVALUACION_PLENO', 'EVALUACION_SUBSANACIONES', 'RESOLUCION_CREAR', 'RESOLUCION_NOTIF',
    'RESOLUCION_HISTORIAL', 'RESOLUCION_CONVOCATORIAS', 'SEGUIMIENTO_AVANCE', 'SEGUIMIENTO_FINAL',
    'SEGUIMIENTO_EVENTOS', 'SEGUIMIENTO_RENOVACIONES', 'SEGUIMIENTO_SUSPENSION', 'USUARIOS_VER',
    'USUARIOS_GESTIONAR', 'USUARIOS_CONFLICTOS', 'EVALUADORES_PERFILES', 'REPORTES_CARGA',
    'REPORTES_EXPORTAR', 'REPORTES_AUDITORIA', 'AUDITORIA_ACCESOS', 'CONFIG_PARAMETROS',
    'CONFIG_PLANTILLAS', 'CONFIG_CATALOGOS', 'CONFIG_NOTIF', 'PROTOCOLOS_LISTAR',
  ],
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

describe('S-1a: pestañas del espacio del protocolo por rol activo (F10 D10)', () => {
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

  for (const tab of Object.keys(EXPECTED_TAB_ROLES) as WorkspaceTab[]) {
    for (const role of Role.all()) {
      const allowed = EXPECTED_TAB_ROLES[tab].includes(role.code);
      const url = WORKSPACE_ROOT + '/' + tab;

      it(
        role.code + (allowed ? ' abre ' : ' rebota en ') + tab + (allowed ? '' : ' con aviso'),
        async () => {
          await start([role.code], role.code, ROLE_PERMISSIONS[role.code]);

          await harness.navigateByUrl(url);

          if (allowed) {
            expect(router.url).toBe(url);
            expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
          } else {
            expect(router.url.startsWith(WORKSPACE_ROOT)).toBeFalse();
            expect(notify).toHaveBeenCalledOnceWith(ACCESS_DENIED_MESSAGE, 'info');
          }
        },
      );
    }
  }

  it('decide con el rol activo entre PRESIDENTE y EVALUADOR', async () => {
    await start(
      ['PRESIDENTE', 'EVALUADOR'],
      'PRESIDENTE',
      [...ROLE_PERMISSIONS.PRESIDENTE, ...ROLE_PERMISSIONS.EVALUADOR],
    );

    await harness.navigateByUrl(WORKSPACE_ROOT + '/info');
    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');

    TestBed.inject(ActiveRoleFacade).switchRole('EVALUADOR');
    await harness.navigateByUrl('/dashboard/home');
    await harness.navigateByUrl(WORKSPACE_ROOT + '/info');

    expect(router.url.startsWith(WORKSPACE_ROOT)).toBeFalse();
    expect(notify).toHaveBeenCalledOnceWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('INVESTIGADOR abre info desde Gestionar de Mis protocolos', async () => {
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ROLE_PERMISSIONS.INVESTIGADOR);

    await harness.navigateByUrl('/dashboard/investigador/mis-protocolos');
    await harness.navigateByUrl(WORKSPACE_ROOT + '/info');

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('INVESTIGADOR abre validation desde Subir correcciones de la versión 1', async () => {
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ROLE_PERMISSIONS.INVESTIGADOR);

    await harness.navigateByUrl('/dashboard/investigador/mis-protocolos');
    await harness.navigateByUrl(WORKSPACE_ROOT + '/validation');

    expect(router.url).toBe(WORKSPACE_ROOT + '/validation');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre validation desde VALIDAR de Mis pendientes', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl('/pendientes');
    const destino = destinoAccion('VALIDAR', 1);
    expect(destino).not.toBeNull();
    await router.navigate(destino ?? []);

    expect(router.url).toBe(WORKSPACE_ROOT + '/validation');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre info desde ASIGNAR de Mis pendientes', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl('/pendientes');
    const destino = destinoAccion('ASIGNAR', 1);
    expect(destino).not.toBeNull();
    await router.navigate(destino ?? []);

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre info desde Ver Info de la lista de validación', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl('/dashboard/protocols/validation/list');
    await harness.navigateByUrl(WORKSPACE_ROOT + '/info');

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre validation desde Validar de la lista de validación', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl('/dashboard/protocols/validation/list');
    await harness.navigateByUrl(WORKSPACE_ROOT + '/validation');

    expect(router.url).toBe(WORKSPACE_ROOT + '/validation');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('INVESTIGADOR abre info desde /dashboard/protocols/detail/1', async () => {
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ROLE_PERMISSIONS.INVESTIGADOR);

    await harness.navigateByUrl('/dashboard/protocols/detail/1');

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre validation desde /dashboard/protocols/validation/detail/1', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl('/dashboard/protocols/validation/detail/1');

    expect(router.url).toBe(WORKSPACE_ROOT + '/validation');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('INVESTIGADOR abre info desde /dashboard/investigador/protocolo/1', async () => {
    await start(['INVESTIGADOR'], 'INVESTIGADOR', ROLE_PERMISSIONS.INVESTIGADOR);

    await harness.navigateByUrl('/dashboard/investigador/protocolo/1');

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('SECRETARIA abre info desde /dashboard/protocols/workspace/1', async () => {
    await start(['SECRETARIA'], 'SECRETARIA', ROLE_PERMISSIONS.SECRETARIA);

    await harness.navigateByUrl(WORKSPACE_ROOT);

    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  for (const role of ['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR'] as RoleCode[]) {
    it(role + ' en workspace/1/evaluation llega a info (S-1c, D11)', async () => {
      await start([role], role, ROLE_PERMISSIONS[role]);

      await harness.navigateByUrl(WORKSPACE_ROOT + '/evaluation');

      expect(router.url).toBe(WORKSPACE_ROOT + '/info');
      expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
    });
  }

  for (const role of ['PRESIDENTE', 'INVESTIGADOR'] as RoleCode[]) {
    it(role + ' en workspace/1 sin pestaña llega a info (S-1c, D11)', async () => {
      await start([role], role, ROLE_PERMISSIONS[role]);

      await harness.navigateByUrl(WORKSPACE_ROOT);

      expect(router.url).toBe(WORKSPACE_ROOT + '/info');
      expect(notify).not.toHaveBeenCalledWith(ACCESS_DENIED_MESSAGE, 'info');
    });
  }

  it('EVALUADOR en workspace/1/evaluation llega a info y rebota con aviso (S-1c, D11 y EARS 10)', async () => {
    await start(['EVALUADOR'], 'EVALUADOR', ROLE_PERMISSIONS.EVALUADOR);

    await harness.navigateByUrl(WORKSPACE_ROOT + '/evaluation');

    expect(router.url.startsWith(WORKSPACE_ROOT)).toBeFalse();
    expect(notify).toHaveBeenCalledOnceWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('EVALUADOR en workspace/1 sin pestaña va a Mis evaluaciones del menú, sin aviso (S-1c, D11)', async () => {
    const menuRoute = MENU_ITEMS.find((item) => item.id === 'evaluador-evaluaciones')?.route;
    expect(menuRoute).toBe(EVALUATOR_LIST);
    await start(['EVALUADOR'], 'EVALUADOR', ROLE_PERMISSIONS.EVALUADOR);

    await harness.navigateByUrl(WORKSPACE_ROOT);

    expect(router.url).toBe(EVALUATOR_LIST);
    expect(notify).not.toHaveBeenCalled();
  });

  it('PRESIDENTE y EVALUADOR: workspace/1 sin pestaña sigue el rol activo (S-1c, D11)', async () => {
    await start(
      ['PRESIDENTE', 'EVALUADOR'],
      'EVALUADOR',
      [...ROLE_PERMISSIONS.PRESIDENTE, ...ROLE_PERMISSIONS.EVALUADOR],
    );

    await harness.navigateByUrl(WORKSPACE_ROOT);
    expect(router.url).toBe(EVALUATOR_LIST);

    TestBed.inject(ActiveRoleFacade).switchRole('PRESIDENTE');
    await harness.navigateByUrl(WORKSPACE_ROOT);
    expect(router.url).toBe(WORKSPACE_ROOT + '/info');
    expect(notify).not.toHaveBeenCalled();
  });

  it('EVALUADOR rebota desde /dashboard/protocols/detail/1 con aviso', async () => {
    await start(['EVALUADOR'], 'EVALUADOR', ROLE_PERMISSIONS.EVALUADOR);

    await harness.navigateByUrl('/dashboard/protocols/detail/1');

    expect(router.url.startsWith(WORKSPACE_ROOT)).toBeFalse();
    expect(notify).toHaveBeenCalledOnceWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('PRESIDENTE rebota desde /dashboard/protocols/validation/detail/1 con aviso', async () => {
    await start(['PRESIDENTE'], 'PRESIDENTE', ROLE_PERMISSIONS.PRESIDENTE);

    await harness.navigateByUrl('/dashboard/protocols/validation/detail/1');

    expect(router.url.startsWith(WORKSPACE_ROOT)).toBeFalse();
    expect(notify).toHaveBeenCalledOnceWith(ACCESS_DENIED_MESSAGE, 'info');
  });

  it('WORKSPACE_TAB_ROLES y PROTOCOL_ROUTES contienen las mismas tres filas con RoleGuard', () => {
    expect(Object.keys(WORKSPACE_TAB_ROLES)).toEqual(['info', 'validation', 'follow-up']);
    expect(WORKSPACE_TAB_ROLES).toEqual(EXPECTED_TAB_ROLES);

    const validRoles = new Set(Role.all().map((role) => role.code));
    for (const roles of Object.values(WORKSPACE_TAB_ROLES)) {
      expect(roles.length).toBeGreaterThan(0);
      for (const role of roles) expect(validRoles.has(role)).toBeTrue();
    }

    const workspaceRoute = PROTOCOL_ROUTES[0]?.children?.find(
      (route) => route.path === 'workspace/:id',
    );
    expect(workspaceRoute).toBeDefined();

    for (const tab of Object.keys(WORKSPACE_TAB_ROLES) as WorkspaceTab[]) {
      const tabRoute = workspaceRoute?.children?.find((route) => route.path === tab);
      expect(tabRoute).toBeDefined();
      expect(tabRoute?.canActivate).toContain(RoleGuard);
      expect(tabRoute?.data?.['roles']).toEqual([...WORKSPACE_TAB_ROLES[tab]]);
    }
  });
});
