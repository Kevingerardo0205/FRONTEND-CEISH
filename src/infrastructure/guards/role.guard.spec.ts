import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { RoleGuard } from './role.guard';

describe('RoleGuard (Multi-Role Support)', () => {
  let guard: RoleGuard;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['currentUser', 'hasAnyRole', 'getActiveRoles']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(RoleGuard);
  });

  it('debe redirigir a /auth/login si no hay usuario autenticado', () => {
    mockAuthFacade.currentUser.and.returnValue(null);
    mockAuthFacade.hasAnyRole.and.returnValue(false);
    mockRouter.createUrlTree.and.returnValue('/auth/login' as any);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login' as any);
  });

  it('debe permitir acceso si el usuario posee el rol primario requerido', () => {
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Admin User',
      email: 'admin@espoch.edu.ec',
      rol: 'ADMIN',
      roles: ['ADMIN'],
      activo: true,
      emailVerificado: true
    });
    mockAuthFacade.hasAnyRole.and.returnValue(true);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(result).toBeTrue();
    expect(mockAuthFacade.hasAnyRole).toHaveBeenCalledWith(['ADMIN']);
  });

  it('debe permitir acceso si el usuario posee un rol secundario (caso multi-rol)', () => {
    // Usuario con rol primario INVESTIGADOR y secundario EVALUADOR
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Dra. María López',
      email: 'maria.lopez@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR', 'EVALUADOR'],
      activo: true,
      emailVerificado: true
    });
    // hasAnyRole debe retornar true porque 'EVALUADOR' está en sus roles
    mockAuthFacade.hasAnyRole.and.callFake((roles: string[]) => roles.includes('EVALUADOR'));

    const route = { data: { roles: ['EVALUADOR'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(result).toBeTrue();
  });

  it('debe denegar acceso y redirigir a /dashboard si el usuario no tiene ninguno de los roles requeridos', () => {
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Dr. Investigador',
      email: 'inv@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      activo: true,
      emailVerificado: true
    });
    mockAuthFacade.hasAnyRole.and.returnValue(false);
    mockAuthFacade.getActiveRoles.and.returnValue(['INVESTIGADOR']);
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);

    const route = { data: { roles: ['ADMIN', 'SECRETARIA'] } } as unknown as ActivatedRouteSnapshot;
    const result = guard.canActivate(route);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard' as any);
  });
});
