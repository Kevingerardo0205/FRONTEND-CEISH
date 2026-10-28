import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { VerificadoGuard } from './verificado.guard';

describe('VerificadoGuard (Multi-Role Support)', () => {
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

  it('debe permitir acceso directo a roles administrativos sin exigir emailVerificado', () => {
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Secretaria CEISH',
      email: 'sec@espoch.edu.ec',
      rol: 'SECRETARIA',
      roles: ['SECRETARIA'],
      activo: true,
      emailVerificado: false, // No verificado
    });
    mockAuthFacade.hasAnyRole.and.returnValue(true);

    const result = guard.canActivate();

    expect(result).toBeTrue();
  });

  it('debe permitir acceso si el usuario posee un rol administrativo como secundario', () => {
    // Usuario con INVESTIGADOR como primario y ADMIN_TI como secundario
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Ing. TI y Docente',
      email: 'ti@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR', 'ADMIN_TI'],
      activo: true,
      emailVerificado: false,
    });
    mockAuthFacade.hasAnyRole.and.returnValue(true);

    const result = guard.canActivate();

    expect(result).toBeTrue();
    expect(mockAuthFacade.hasAnyRole).toHaveBeenCalledWith([
      'ADMIN',
      'SECRETARIA',
      'PRESIDENTA',
      'PRESIDENTE',
      'ADMIN_TI',
    ]);
  });

  it('debe permitir acceso a investigadores si su email está verificado', () => {
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Dr. Investigador',
      email: 'inv@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      activo: true,
      emailVerificado: true, // Verificado
    });
    mockAuthFacade.hasAnyRole.and.returnValue(false);

    const result = guard.canActivate();

    expect(result).toBeTrue();
  });

  it('debe bloquear y notificar a un investigador no verificado', () => {
    mockAuthFacade.currentUser.and.returnValue({
      nombre: 'Dr. Investigador Nuevo',
      email: 'nuevo@espoch.edu.ec',
      rol: 'INVESTIGADOR',
      roles: ['INVESTIGADOR'],
      activo: true,
      emailVerificado: false, // No verificado
    });
    mockAuthFacade.hasAnyRole.and.returnValue(false);
    mockSnackBar.open.and.returnValue({ onAction: () => of(undefined) } as any);
    mockRouter.createUrlTree.and.returnValue('/dashboard' as any);

    const result = guard.canActivate();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/Debe verificar su correo/),
      jasmine.any(String),
      jasmine.any(Object),
    );
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe('/dashboard' as any);
  });
});
