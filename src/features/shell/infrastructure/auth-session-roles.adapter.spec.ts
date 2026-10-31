import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuthSessionRolesAdapter } from './auth-session-roles.adapter';

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
