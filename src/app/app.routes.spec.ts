import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { NEVER, of } from 'rxjs';
import { Route, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { AppShellComponent } from '@features/shell/presentation/app-shell/app-shell.component';
import { RouterTestingHarness } from '@angular/router/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { PENDIENTES_PROVIDERS } from '@features/pendientes/pendientes.providers';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { RoleCode } from '@domain/value-objects/role.vo';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { LoginPage } from '@features/auth/presentation/pages/login.page';
import { NO_ACTIVE_ROLE_MESSAGE } from '@infrastructure/guards/role-home.guard';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { NotificationService } from '@infrastructure/services/notification.service';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { ROLE_HOME } from '@features/shell/domain/role-home';
import { RoleSelectorComponent } from '@features/shell/presentation/role-selector/role-selector.component';
import { appConfig } from './app.config';
import { SECRETARIA_ROUTES, routes } from './app.routes';

const ROLE_KEY = 'ceish.activeRole';

/**
 * Rutas de T13d (D9–D11, D13) con el router, los guards, AuthFacade, ActiveRoleFacade y
 * el adapter reales; solo el almacén de tokens, las notificaciones y HTTP son de prueba.
 */
describe('Rutas por rol activo (T13d)', () => {
  let notify: jasmine.Spy;
  let harness: RouterTestingHarness;
  let router: Router;

  /** Sesión de prueba: `roles` vigentes; sin roles, no hay sesión. */
  async function start(
    roles: string[] | null,
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
            saveToken: (t: string) => (token = t),
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

  const has = (selector: string) => harness.fixture.nativeElement.querySelector(selector) !== null;

  beforeEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem(ROLE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem(ROLE_KEY);
  });

  describe('criterio 4: rutas solo de SECRETARIA', () => {
    it('INVESTIGADOR que abre /pendientes vuelve a /dashboard/home con aviso', async () => {
      await start(['INVESTIGADOR']);

      await harness.navigateByUrl('/pendientes');

      expect(router.url).toBe('/dashboard/home');
      expect(notify).toHaveBeenCalledOnceWith(
        'No tiene acceso a esta sección con el rol activo.',
        'info',
      );
    });

    it('EVALUADOR que abre /reportes vuelve a /dashboard/home con aviso', async () => {
      await start(['EVALUADOR']);

      await harness.navigateByUrl('/reportes');

      expect(router.url).toBe('/dashboard/home');
      expect(notify).toHaveBeenCalledTimes(1);
    });

    it('SECRETARIA en /pendientes ve el AppShell', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/pendientes');

      expect(router.url).toBe('/pendientes');
      expect(has('app-shell')).toBeTrue();
      expect(has('app-dashboard')).toBeFalse();
      expect(notify).not.toHaveBeenCalled();
    });
  });

  describe('F01 T01-5: /pendientes muestra Mis pendientes', () => {
    const pendientes = () => SECRETARIA_ROUTES.find((r) => r.path === 'pendientes');
    const urlPendientes = `${environment.apiUrl}/secretaria/pendientes`;

    it('SECRETARIA en /pendientes ve MisPendientesPage dentro del AppShell', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/pendientes');

      expect(router.url).toBe('/pendientes');
      expect(has('app-shell app-mis-pendientes-page')).toBeTrue();
      expect(has('app-dashboard-secretaria')).toBeFalse();
      expect(notify).not.toHaveBeenCalled();
    });

    it('path, canActivate y data no cambian; se agregan los providers de la sección', () => {
      const ruta = pendientes();
      expect(ruta?.path).toBe('pendientes');
      expect(ruta?.canActivate).toEqual([RoleGuard, AuthGuard]);
      expect(ruta?.data).toEqual({ roles: ['SECRETARIA'] });
      expect(ruta?.providers).toBe(PENDIENTES_PROVIDERS);
    });

    it('ROLE_HOME.SECRETARIA sigue siendo /pendientes', () => {
      expect(ROLE_HOME['SECRETARIA']).toBe('/pendientes');
    });

    it('un 403 de GET /secretaria/pendientes no deja la navegación en bucle', async () => {
      await start(['SECRETARIA']);
      const httpMock = TestBed.inject(HttpTestingController);

      await harness.navigateByUrl('/pendientes');
      // La página y el contador del menú piden el mismo endpoint.
      const primeras = httpMock.match((r) => r.url === urlPendientes);
      expect(primeras.length).toBeGreaterThan(0);
      for (const req of primeras) {
        req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
      }
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(router.url).toBe('/pendientes');
      expect(httpMock.match((r) => r.url === urlPendientes).length).toBe(0);
      expect(has('app-mis-pendientes-page')).toBeTrue();
      expect(harness.fixture.nativeElement.textContent).toContain('No pudimos cargar sus pendientes.');
    });
  });

  describe('D9: layout de /dashboard/... según el rol activo', () => {
    it('SECRETARIA en /dashboard/protocols/workspace/1/info ve el AppShell', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/dashboard/protocols/workspace/1/info');

      expect(router.url).toBe('/dashboard/protocols/workspace/1/info');
      expect(has('app-shell')).toBeTrue();
      expect(has('app-dashboard')).toBeFalse();
    });

    it('EVALUADOR en /dashboard/protocols/workspace/1/info ve DashboardPage', async () => {
      await start(['EVALUADOR']);

      await harness.navigateByUrl('/dashboard/protocols/workspace/1/info');

      expect(router.url).toBe('/dashboard/protocols/workspace/1/info');
      expect(has('app-dashboard')).toBeTrue();
      expect(has('app-shell')).toBeFalse();
    });

    it('T13d-3: /pendientes ↔ /dashboard/protocols/workspace/1/info conserva la misma instancia del AppShell', async () => {
      const getAllowedRoles = jasmine
        .createSpy('getAllowedRoles')
        .and.returnValue(of({ allowedRoles: ['SECRETARIA'] }));
      await start(
        ['SECRETARIA'],
        undefined,
        [],
        [{ provide: IAiAssistantRepositoryPort, useValue: { getAllowedRoles } }],
      );
      const shell = () => harness.fixture.debugElement.query(By.directive(AppShellComponent));

      await harness.navigateByUrl('/pendientes');
      const first = shell().componentInstance;

      await harness.navigateByUrl('/dashboard/protocols/workspace/1/info');
      expect(router.url).toBe('/dashboard/protocols/workspace/1/info');
      expect(shell().componentInstance).toBe(first);

      await harness.navigateByUrl('/pendientes');
      expect(router.url).toBe('/pendientes');
      expect(shell().componentInstance).toBe(first);
      expect(getAllowedRoles).toHaveBeenCalledTimes(1);
    });

    it('al cambiar de rol con el selector, la navegación al inicio del rol cambia de layout', async () => {
      await start(['SECRETARIA', 'EVALUADOR'], 'SECRETARIA');
      await harness.navigateByUrl('/pendientes');
      expect(has('app-shell')).toBeTrue();

      const selector = TestBed.createComponent(RoleSelectorComponent).componentInstance;
      selector.select('EVALUADOR');
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(router.url).toBe('/dashboard/home');
      expect(has('app-dashboard')).toBeTrue();
      expect(has('app-shell')).toBeFalse();

      selector.select('SECRETARIA');
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(router.url).toBe('/pendientes');
      expect(has('app-shell')).toBeTrue();
      expect(has('app-dashboard')).toBeFalse();
    });
  });

  describe("D13: rutas '' y **", () => {
    for (const url of ['/', '/ruta-que-no-existe']) {
      it(`${url} con SECRETARIA va a /pendientes`, async () => {
        await start(['SECRETARIA']);
        await harness.navigateByUrl(url);
        expect(router.url).toBe('/pendientes');
      });

      it(`${url} con EVALUADOR va a /dashboard/home`, async () => {
        await start(['EVALUADOR']);
        await harness.navigateByUrl(url);
        expect(router.url).toBe('/dashboard/home');
      });

      it(`${url} sin sesión va a /auth/login`, async () => {
        await start(null);
        await harness.navigateByUrl(url);
        expect(router.url).toBe('/auth/login');
      });
    }
  });

  describe('F01 T01-0: bandeja "Estratificación de Riesgo" en /estratificacion-riesgo', () => {
    const ASSIGN_PERMISSIONS = ['EVALUACION_ASIGNAR'];

    it('SECRETARIA con permiso de asignar abre la bandeja dentro del AppShell', async () => {
      await start(['SECRETARIA'], undefined, ASSIGN_PERMISSIONS);

      await harness.navigateByUrl('/estratificacion-riesgo');

      expect(router.url).toBe('/estratificacion-riesgo');
      expect(has('app-shell')).toBeTrue();
      expect(has('app-peer-risk-pending-page')).toBeTrue();
      expect(notify).not.toHaveBeenCalled();
    });

    it('INVESTIGADOR que abre /estratificacion-riesgo vuelve a su inicio con aviso', async () => {
      await start(['INVESTIGADOR'], undefined, ASSIGN_PERMISSIONS);

      await harness.navigateByUrl('/estratificacion-riesgo');

      expect(router.url).toBe('/dashboard/home');
      expect(notify).toHaveBeenCalledOnceWith(
        'No tiene acceso a esta sección con el rol activo.',
        'info',
      );
    });

    it('SECRETARIA sin permiso de asignar no entra y vuelve a /pendientes', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/estratificacion-riesgo');

      expect(router.url).toBe('/pendientes');
      expect(has('app-peer-risk-pending-page')).toBeFalse();
    });

    it('SECRETARIA: /dashboard/evaluations/assignment termina en /estratificacion-riesgo', async () => {
      await start(['SECRETARIA'], undefined, ASSIGN_PERMISSIONS);

      await harness.navigateByUrl('/dashboard/evaluations/assignment');
      await harness.fixture.whenStable();

      expect(router.url).toBe('/estratificacion-riesgo');
      expect(has('app-shell')).toBeTrue();
    });

    it('la ruta nueva no entra al menú: el menú de SECRETARIA sigue con 5 entradas', async () => {
      await start(['SECRETARIA'], undefined, ASSIGN_PERMISSIONS);

      await harness.navigateByUrl('/estratificacion-riesgo');

      const links = harness.fixture.nativeElement.querySelectorAll('.nav-list .nav-link');
      expect(links.length).toBe(5);
    });
  });

  describe('D11: /dashboard/home → /pendientes solo con SECRETARIA activa', () => {
    it('SECRETARIA: /dashboard/home?tab=peers → /pendientes?tab=peers', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/dashboard/home?tab=peers');

      expect(router.url).toBe('/pendientes?tab=peers');
      expect(has('app-shell')).toBeTrue();
    });

    it('SECRETARIA: /dashboard → /pendientes', async () => {
      await start(['SECRETARIA']);

      await harness.navigateByUrl('/dashboard');

      expect(router.url).toBe('/pendientes');
    });

    it('PRESIDENTE: /dashboard/home?tab=peers se queda en /dashboard/home', async () => {
      await start(['PRESIDENTE']);

      await harness.navigateByUrl('/dashboard/home?tab=peers');

      expect(router.url).toBe('/dashboard/home?tab=peers');
      expect(has('app-dashboard')).toBeTrue();
    });

    it('SECRETARIA+EVALUADOR con EVALUADOR activo se queda en /dashboard/home', async () => {
      await start(['SECRETARIA', 'EVALUADOR'], 'EVALUADOR');

      await harness.navigateByUrl('/dashboard/home');

      expect(TestBed.inject(ActiveRoleFacade).activeRole()).toBe('EVALUADOR');
      expect(router.url).toBe('/dashboard/home');
      expect(has('app-dashboard')).toBeTrue();
      // D14: user.rol es SECRETARIA, pero DashboardHomePage elige con el rol activo.
      expect(has('app-dashboard-home')).toBeTrue();
      expect(has('app-dashboard-secretaria')).toBeFalse();
    });
  });

  describe('D13: login e inicio sin rol activo', () => {
    async function loginAs(roles: string[]): Promise<void> {
      const user = {
        id: 1,
        nombre: 'Usuario Prueba',
        email: 'usuario.prueba@example.test',
        rol: roles[0],
        roles,
        permissions: [],
      };
      await start(
        null,
        undefined,
        [],
        [
          {
            provide: IAuthRepositoryPort,
            useValue: {
              login: () => of({ accessToken: 'token-de-prueba', refreshToken: 'r', user }),
              logAudit: () => of(undefined),
              getUserById: () => NEVER,
            },
          },
        ],
      );
      const page = (await harness.navigateByUrl('/auth/login', LoginPage)) as LoginPage;
      page.loginForm.setValue({ email: user.email, password: 'clave-de-prueba' });
      page.onSubmit();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();
    }

    it('login de SECRETARIA → /pendientes (inicio del rol activo)', async () => {
      await loginAs(['SECRETARIA']);
      expect(router.url).toBe('/pendientes');
      expect(has('app-shell')).toBeTrue();
    });

    it('login de EVALUADOR → /dashboard/home', async () => {
      await loginAs(['EVALUADOR']);
      expect(router.url).toBe('/dashboard/home');
      expect(has('app-dashboard')).toBeTrue();
    });

    it('login sin rol reconocido → /auth/login con aviso', async () => {
      await loginAs(['ADMIN_TI']);
      expect(router.url).toBe('/auth/login');
      expect(notify).toHaveBeenCalledOnceWith(NO_ACTIVE_ROLE_MESSAGE, 'info');
    });

    it("sesión sin rol activo: '' → /auth/login con aviso", async () => {
      await start(['ADMIN_TI']);

      await harness.navigateByUrl('/');

      expect(router.url).toBe('/auth/login');
      expect(notify).toHaveBeenCalledOnceWith(NO_ACTIVE_ROLE_MESSAGE, 'info');
    });

    it('sesión sin rol activo: /pendientes → /auth/login con un solo aviso', async () => {
      await start(['ADMIN_TI']);

      await harness.navigateByUrl('/pendientes');

      expect(router.url).toBe('/auth/login');
      expect(notify).toHaveBeenCalledOnceWith(NO_ACTIVE_ROLE_MESSAGE, 'info');
    });
  });

  describe('ROLE_HOME admite a su rol (sin bucle ni rechazo)', () => {
    for (const role of ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
      it(`${role} entra a ${ROLE_HOME[role]} sin aviso`, async () => {
        await start([role]);

        await harness.navigateByUrl(ROLE_HOME[role]);

        expect(router.url).toBe(ROLE_HOME[role]);
        expect(notify).not.toHaveBeenCalled();
      });
    }
  });

  describe('D10: rutas nuevas lazy', () => {
    const leaves = (list: Route[]): Route[] =>
      list.flatMap((r) => (r.children ? leaves(r.children) : r.redirectTo ? [] : [r]));

    it('las 5 entradas del menú y la bandeja temporal (F01 T01-0) existen bajo el AppShell', () => {
      const paths = SECRETARIA_ROUTES.map((r) => r.path);
      expect(paths).toEqual([
        'pendientes',
        'protocolos',
        'convocatorias',
        'reportes',
        'configuracion',
        'estratificacion-riesgo',
      ]);
    });

    it('cada ruta nueva usa loadComponent y no component', () => {
      const pages = leaves(SECRETARIA_ROUTES);
      expect(pages.length).toBe(6);
      for (const page of pages) {
        expect(page.loadComponent).withContext(String(page.path)).toBeDefined();
        expect(page.component).withContext(String(page.path)).toBeUndefined();
      }
      // T13d-3: el padre del AppShell es el que lleva canMatch; sus hijos son las rutas
      // nuevas más 'dashboard'. El padre de respaldo (criterio 4) no tiene layout.
      const shell = routes.find((r) => r.canMatch && r.children?.includes(SECRETARIA_ROUTES[0]));
      expect(shell?.loadComponent).toBeDefined();
      expect(shell?.component).toBeUndefined();
      expect(shell?.children?.find((r) => r.path === 'dashboard')?.loadChildren).toBeDefined();
      const fallback = routes.find((r) => r.children === SECRETARIA_ROUTES);
      expect(fallback?.component).toBeUndefined();
      expect(fallback?.loadComponent).toBeUndefined();
    });

    it('cada ruta nueva exige el rol SECRETARIA con RoleGuard', () => {
      for (const page of leaves(SECRETARIA_ROUTES)) {
        expect(page.data?.['roles']).withContext(String(page.path)).toEqual(['SECRETARIA']);
      }
    });

    it('/configuracion → /configuracion/usuarios para SECRETARIA', async () => {
      await start(['SECRETARIA'], undefined, ['USUARIOS_VER']);

      await harness.navigateByUrl('/configuracion');

      expect(router.url).toBe('/configuracion/usuarios');
      expect(has('app-shell')).toBeTrue();
    });
  });
});
