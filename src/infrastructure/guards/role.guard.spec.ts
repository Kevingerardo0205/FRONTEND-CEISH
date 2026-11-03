import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { NotificationService } from '@infrastructure/services/notification.service';
import { appConfig } from '@app/app.config';
import { RoleGuard } from './role.guard';
import { NO_ACTIVE_ROLE_MESSAGE } from './role-home.guard';

describe('RoleGuard (rol activo — spec-001 v3.5.3)', () => {
  let guard: RoleGuard;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockActiveRoleFacade: jasmine.SpyObj<ActiveRoleFacade>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const USUARIO_PRUEBA = {
    nombre: 'Usuario Prueba',
    email: 'usuario.prueba@example.test',
    rol: 'SECRETARIA',
    roles: ['SECRETARIA'],
    activo: true,
    emailVerificado: true,
  };

  beforeEach(() => {
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['currentUser']);
    mockActiveRoleFacade = jasmine.createSpyObj('ActiveRoleFacade', ['activeRole']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['notify']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree', 'parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: ActiveRoleFacade, useValue: mockActiveRoleFacade },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    guard = TestBed.inject(RoleGuard);
  });

  // (a) sin data.roles → pasa sin consultar usuario ni rol activo
  it('(a) pasa si la ruta no exige rol (data.roles ausente)', () => {
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeTrue();
    expect(mockAuthFacade.currentUser).not.toHaveBeenCalled();
  });

  // (b) sin usuario → redirige a /auth/login
  it('(b) redirige a /auth/login si no hay sesión activa', () => {
    mockAuthFacade.currentUser.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue('/auth/login' as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login' as any);
  });

  // (c) rol activo en data.roles → pasa (reescritura de :42)
  it('(c) concede acceso cuando el rol activo está en los roles requeridos', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue('SECRETARIA');
    const route = { data: { roles: ['SECRETARIA', 'PRESIDENTE'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeTrue();
    expect(mockNotificationService.notify).not.toHaveBeenCalled();
  });

  // (d) rol activo no en data.roles → redirige + notify (reescritura de :60)
  it('(d) con varios roles, el acceso depende del rol activo, no de todos los roles del usuario', () => {
    mockAuthFacade.currentUser.and.returnValue(
      { ...USUARIO_PRUEBA, roles: ['EVALUADOR', 'INVESTIGADOR'] } as any,
    );
    // Activo: INVESTIGADOR; ruta requiere SECRETARIA → debe denegar
    mockActiveRoleFacade.activeRole.and.returnValue('INVESTIGADOR');
    mockRouter.parseUrl.and.returnValue('/dashboard/home' as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledWith(
      'No tiene acceso a esta sección con el rol activo.',
      'info',
    );
    // D12: vuelve al inicio del rol activo (ROLE_HOME), no a /dashboard.
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/dashboard/home');
    expect(result).toBe('/dashboard/home' as any);
  });

  it('(d2) D12: SECRETARIA+EVALUADOR con EVALUADOR activo en ruta de SECRETARIA vuelve a /dashboard/home', () => {
    mockAuthFacade.currentUser.and.returnValue(
      { ...USUARIO_PRUEBA, roles: ['SECRETARIA', 'EVALUADOR'] } as any,
    );
    mockActiveRoleFacade.activeRole.and.returnValue('EVALUADOR');
    mockRouter.parseUrl.and.callFake((url: string) => url as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBe('/dashboard/home' as any);
  });

  it('(d3) D12: PRESIDENTE activo en ruta de EVALUADOR vuelve al inicio de PRESIDENTE', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue('PRESIDENTE');
    mockRouter.parseUrl.and.callFake((url: string) => url as any);
    const route = { data: { roles: ['EVALUADOR'] } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBe('/dashboard/home' as any);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalledWith(['/dashboard']);
  });

  // (e) sin rol activo (null) → redirige + notify
  it('(e) deniega si activeRole() devuelve null (usuario sin rol vigente reconocido)', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue('/auth/login' as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);
    // D12: sin rol activo → /auth/login con "Su cuenta no tiene un rol vigente." (un solo aviso).
    expect(mockNotificationService.notify).toHaveBeenCalledOnceWith(NO_ACTIVE_ROLE_MESSAGE, 'info');
    expect(NO_ACTIVE_ROLE_MESSAGE).toBe('Su cuenta no tiene un rol vigente.');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login' as any);
  });

  // (f) data.roles como cadena → funciona
  it('(f) acepta data.roles como cadena simple además de arreglo', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue('EVALUADOR');
    const route = { data: { roles: 'EVALUADOR' } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeTrue();
  });

  // notifica exactamente una vez por intento denegado
  it('notifica exactamente una vez por intento de acceso denegado', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue('INVESTIGADOR');
    mockRouter.parseUrl.and.returnValue('/dashboard/home' as any);
    const route = { data: { roles: ['SECRETARIA', 'PRESIDENTE'] } } as unknown as ActivatedRouteSnapshot;
    guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledTimes(1);
  });

  // (g) el rol activo se lee en cada navegación (M8: leerlo una vez en el constructor → falla)
  it('(g) si el rol activo cambia entre dos llamadas, la segunda decide con el rol nuevo', () => {
    mockAuthFacade.currentUser.and.returnValue(
      { ...USUARIO_PRUEBA, roles: ['EVALUADOR', 'PRESIDENTE'] } as any,
    );
    mockRouter.parseUrl.and.returnValue('/dashboard/home' as any);
    const route = { data: { roles: ['PRESIDENTE'] } } as unknown as ActivatedRouteSnapshot;

    mockActiveRoleFacade.activeRole.and.returnValue('PRESIDENTE');
    expect(guard.canActivate(route)).toBeTrue();
    expect(mockNotificationService.notify).not.toHaveBeenCalled();

    mockActiveRoleFacade.activeRole.and.returnValue('EVALUADOR');
    const result = guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledOnceWith(
      'No tiene acceso a esta sección con el rol activo.',
      'info',
    );
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/dashboard/home');
    expect(result).toBe('/dashboard/home' as any);
  });

  // prueba del provider (M7: quitar el provider de app.config.ts → falla)
  it('SessionRolesPort está provisto en appConfig: ActiveRoleFacade se inyecta sin NullInjectorError', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(() => TestBed.inject(ActiveRoleFacade)).not.toThrow();
  });
});
