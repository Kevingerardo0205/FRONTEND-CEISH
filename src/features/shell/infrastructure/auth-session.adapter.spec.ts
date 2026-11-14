import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuthSessionRolesAdapter, AuthSessionUserAdapter } from './auth-session.adapter';

describe('AuthSessionRolesAdapter', () => {
  it('dentro de un computed, da los roles vigentes al instante cada vez que cambia el usuario', () => {
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
    const roles = computed(() => adapter.roles());

    expect(roles()).toEqual(['SECRETARIA']);
    user.set({ roles: ['EVALUADOR', 'INVESTIGADOR'] });
    // Sin TestBed.tick(): el cambio se ve sin esperar a un effect (T13d-0).
    expect(roles()).toEqual(['EVALUADOR', 'INVESTIGADOR']);
  });
});

describe('AuthSessionUserAdapter', () => {
  const setup = (initial: { nombre: string; email: string } | null) => {
    const user = signal(initial);
    const logout = jasmine.createSpy('logout');
    const canEnterInvestigatorArea = jasmine.createSpy('canEnterInvestigatorArea').and.returnValue(false);
    TestBed.configureTestingModule({
      providers: [
        AuthSessionUserAdapter,
        { provide: AuthFacade, useValue: { currentUser: user, logout, canEnterInvestigatorArea } },
      ],
    });
    return { user, logout, canEnterInvestigatorArea, adapter: TestBed.inject(AuthSessionUserAdapter) };
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

  it('canEnterInvestigatorArea delega en la regla única de AuthFacade (F10 D9)', () => {
    const { canEnterInvestigatorArea, adapter } = setup(null);
    expect(adapter.canEnterInvestigatorArea()).toBeFalse();
    canEnterInvestigatorArea.and.returnValue(true);
    expect(adapter.canEnterInvestigatorArea()).toBeTrue();
    expect(canEnterInvestigatorArea).toHaveBeenCalledTimes(2);
  });
});
