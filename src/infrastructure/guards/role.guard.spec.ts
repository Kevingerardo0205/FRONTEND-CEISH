import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { NotificationService } from '@infrastructure/services/notification.service';
import { appConfig } from '@app/app.config';
import { RoleGuard } from './role.guard';

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
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

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
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledWith(
      'No tiene acceso a esta sección con el rol activo.',
      'info',
    );
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard' as any);
  });

  // (e) sin rol activo (null) → redirige + notify
  it('(e) deniega si activeRole() devuelve null (usuario sin rol vigente reconocido)', () => {
    mockAuthFacade.currentUser.and.returnValue(USUARIO_PRUEBA as any);
    mockActiveRoleFacade.activeRole.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);
    const route = { data: { roles: ['SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledWith(
      'No tiene acceso a esta sección con el rol activo.',
      'info',
    );
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard' as any);
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
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);
    const route = { data: { roles: ['SECRETARIA', 'PRESIDENTE'] } } as unknown as ActivatedRouteSnapshot;
    guard.canActivate(route);
    expect(mockNotificationService.notify).toHaveBeenCalledTimes(1);
  });

  // prueba del provider (M7: quitar el provider de app.config.ts → falla)
  it('SessionRolesPort está provisto en appConfig: ActiveRoleFacade se inyecta sin NullInjectorError', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(() => TestBed.inject(ActiveRoleFacade)).not.toThrow();
  });
});
