import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuthSessionRolesAdapter, AuthSessionUserAdapter } from './auth-session-roles.adapter';

describe('AuthSessionRolesAdapter', () => {
  it('emite los roles vigentes de AuthFacade cada vez que cambia el usuario', () => {
    const user = signal<{ roles: string[] } | null>({ roles: ['SECRETARIA'] });
    TestBed.configureTestingModule({
      providers: [
        AuthSessionRolesAdapter,
        {
          provide: AuthFacade,
          useValue: { currentUser: user, getActiveRoles: () => user()?.roles ?? [] },
        },
      ],
    });
    const adapter = TestBed.inject(AuthSessionRolesAdapter);
    const emitted: string[][] = [];
    adapter.roles$.subscribe((r) => emitted.push(r));

    TestBed.tick();
    user.set({ roles: ['EVALUADOR', 'INVESTIGADOR'] });
    TestBed.tick();

    expect(emitted).toEqual([['SECRETARIA'], ['EVALUADOR', 'INVESTIGADOR']]);
  });
});

describe('AuthSessionUserAdapter', () => {
  const setup = (initial: { nombre: string; email: string } | null) => {
    const user = signal(initial);
    const logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({
      providers: [AuthSessionUserAdapter, { provide: AuthFacade, useValue: { currentUser: user, logout } }],
    });
    return { user, logout, adapter: TestBed.inject(AuthSessionUserAdapter) };
  };

  it('emite nombre y correo del usuario de la sesión, y null sin sesión', () => {
    const { user, adapter } = setup({ nombre: 'Usuario Prueba', email: 'usuario.prueba@example.test' });
    const emitted: unknown[] = [];
    adapter.user$.subscribe((u) => emitted.push(u));

    TestBed.tick();
    user.set(null);
    TestBed.tick();

    expect(emitted).toEqual([{ name: 'Usuario Prueba', email: 'usuario.prueba@example.test' }, null]);
  });

  it('logout delega en AuthFacade.logout', () => {
    const { logout, adapter } = setup(null);
    adapter.logout();
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
