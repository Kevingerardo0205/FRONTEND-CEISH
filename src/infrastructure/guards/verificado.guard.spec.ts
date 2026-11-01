import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { VerificadoGuard } from './verificado.guard';

const COMMITTEE_ROLES = ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR'];

const unverifiedUser = (rol: string) => ({
  nombre: 'Usuario Prueba',
  email: 'usuario.prueba@example.test',
  rol,
  roles: [rol],
  activo: true,
  emailVerificado: false,
});

describe('VerificadoGuard (role-based email verification)', () => {
  let guard: VerificadoGuard;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['currentUser', 'hasAnyRole']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree', 'navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        VerificadoGuard,
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    guard = TestBed.inject(VerificadoGuard);
  });

  it('debe redirigir a /auth/login si no hay usuario autenticado', () => {
    mockAuthFacade.currentUser.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue('/auth/login' as any);

    const result = guard.canActivate();

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe('/auth/login' as any);
  });

  it('debe consultar los 3 roles del comité exentos de verificación', () => {
    mockAuthFacade.currentUser.and.returnValue(unverifiedUser('SECRETARIA') as any);
    mockAuthFacade.hasAnyRole.and.returnValue(true);

    guard.canActivate();

    expect(mockAuthFacade.hasAnyRole).toHaveBeenCalledWith(COMMITTEE_ROLES);
  });

  COMMITTEE_ROLES.forEach((rol) => {
    it(`debe permitir acceso directo al rol del comité ${rol} sin emailVerificado`, () => {
      mockAuthFacade.currentUser.and.returnValue(unverifiedUser(rol) as any);
      mockAuthFacade.hasAnyRole.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBeTrue();
    });
  });

  it('debe permitir acceso a investigadores si su email está verificado', () => {
    mockAuthFacade.currentUser.and.returnValue({
      ...unverifiedUser('INVESTIGADOR'),
      emailVerificado: true,
    } as any);
    mockAuthFacade.hasAnyRole.and.returnValue(false);

    const result = guard.canActivate();

    expect(result).toBeTrue();
  });

  it('debe bloquear y notificar a un investigador no verificado (no exento)', () => {
    mockAuthFacade.currentUser.and.returnValue(unverifiedUser('INVESTIGADOR') as any);
    mockAuthFacade.hasAnyRole.and.returnValue(false);
    mockSnackBar.open.and.returnValue({ onAction: () => of(undefined) } as any);
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);

    const result = guard.canActivate();

    expect(mockAuthFacade.hasAnyRole).toHaveBeenCalledWith(COMMITTEE_ROLES);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Debe verificar su correo/),
      jasmine.any(String),
      jasmine.any(Object),
    );
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard' as any);
  });
});
