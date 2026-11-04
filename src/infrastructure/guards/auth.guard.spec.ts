import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuthGuard } from './auth.guard';
import { RoleHome } from './role-home.guard';

describe('AuthGuard (T13d-2, D12)', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;

  function setup(authenticated: boolean, permissions: string[]): void {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => commands.join('/') as never);
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: router },
        {
          provide: AuthFacade,
          useValue: {
            isAuthenticated: () => authenticated,
            currentUser: () => ({
              email: 'usuario.prueba@example.test',
              rol: 'EVALUADOR',
              permissions,
            }),
          },
        },
        { provide: RoleHome, useValue: { urlTree: () => 'inicio-del-rol-activo' } },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  }

  const route = (permissions?: string[]) =>
    ({ data: permissions ? { permissions } : {} }) as unknown as ActivatedRouteSnapshot;

  it('sin sesión redirige a /auth/login', () => {
    setup(false, []);
    expect(guard.canActivate(route())).toBe('/auth/login' as never);
  });

  it('con el permiso requerido deja pasar', () => {
    setup(true, ['USUARIOS_VER']);
    expect(guard.canActivate(route(['USUARIOS_VER']))).toBeTrue();
  });

  it('sin el permiso requerido vuelve al inicio del rol activo, no a /dashboard', () => {
    spyOn(console, 'error');
    setup(true, []);

    expect(guard.canActivate(route(['USUARIOS_VER']))).toBe('inicio-del-rol-activo' as never);
    expect(router.createUrlTree).not.toHaveBeenCalledWith(['/dashboard']);
  });
});
