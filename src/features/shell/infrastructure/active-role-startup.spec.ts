import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { NotificationService } from '@infrastructure/services/notification.service';
import { ActiveRoleFacade } from '../application/active-role.facade';
import { SessionRolesPort } from '../domain/session-roles.port';
import { AuthSessionRolesAdapter } from './auth-session.adapter';

@Component({ standalone: true, template: '<p id="ok">ok</p>' })
class ProbeComponent {}

const TEST_USER = {
  id: 1,
  nombre: 'Usuario Prueba',
  email: 'usuario.prueba@example.test',
  rol: 'SECRETARIA',
  roles: ['SECRETARIA'],
};

/**
 * T13d-0: el rol activo debe estar disponible en la primera navegación, con el facade,
 * el adapter y AuthFacade reales (al recargar la página y justo después del login).
 */
describe('Rol activo en la primera navegación (T13d-0)', () => {
  let notify: jasmine.Spy;

  function configure(): void {
    notify = jasmine.createSpy('notify');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'solo-secretaria',
            component: ProbeComponent,
            canActivate: [RoleGuard],
            data: { roles: ['SECRETARIA'] },
          },
          { path: '**', component: ProbeComponent },
        ]),
        { provide: SessionRolesPort, useClass: AuthSessionRolesAdapter },
        {
          provide: TokenStoreAdapter,
          useValue: {
            getToken: () => null,
            saveToken: () => undefined,
            saveRefreshToken: () => undefined,
            removeTokens: () => undefined,
          },
        },
        { provide: IAuthRepositoryPort, useValue: { getUserById: () => of(TEST_USER) } },
        { provide: NotificationService, useValue: { notify } },
      ],
    });
  }

  beforeEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('ceish.activeRole');
  });

  afterEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('ceish.activeRole');
  });

  it('al recargar (usuario ya guardado), el guard de la primera navegación ve el rol activo', async () => {
    localStorage.setItem('user', JSON.stringify(TEST_USER));
    configure();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/solo-secretaria');

    expect(TestBed.inject(ActiveRoleFacade).activeRole()).toBe('SECRETARIA');
    expect(TestBed.inject(Router).url).toBe('/solo-secretaria');
    expect(notify).not.toHaveBeenCalled();
  });

  it('después de setAuth() del login, la navegación inmediata ve el rol activo', async () => {
    configure();
    const harness = await RouterTestingHarness.create();
    const activeRole = TestBed.inject(ActiveRoleFacade);
    expect(activeRole.activeRole()).toBeNull();

    TestBed.inject(AuthFacade).setAuth({
      accessToken: 'no-es-un-token',
      refreshToken: 'no-es-un-token',
      user: TEST_USER,
    } as never);
    await harness.navigateByUrl('/solo-secretaria');

    expect(activeRole.activeRole()).toBe('SECRETARIA');
    expect(TestBed.inject(Router).url).toBe('/solo-secretaria');
    expect(notify).not.toHaveBeenCalled();
  });
});
