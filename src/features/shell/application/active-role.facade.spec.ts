import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from './active-role.facade';

describe('ActiveRoleFacade', () => {
  const STORAGE_KEY = 'ceish.activeRole';
  let roles: ReturnType<typeof signal<string[]>>;

  function createFacade(initialRoles: string[]): ActiveRoleFacade {
    roles = signal(initialRoles);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthFacade,
          useValue: { currentUser: () => roles(), getActiveRoles: () => roles() },
        },
      ],
    });
    return TestBed.inject(ActiveRoleFacade);
  }

  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('con un solo rol, ese es el activo', () => {
    const facade = createFacade(['SECRETARIA']);

    expect(facade.availableRoles()).toEqual(['SECRETARIA']);
    expect(facade.activeRole()).toBe('SECRETARIA');
  });

  it('sin roles reconocidos no hay rol activo', () => {
    const facade = createFacade(['ADMIN_TI', 'PRESIDENTA']);

    expect(facade.availableRoles()).toEqual([]);
    expect(facade.activeRole()).toBeNull();
  });

  it('con varios roles expone solo los roles fijos y activa el primero', () => {
    const facade = createFacade(['EVALUADOR', 'ADMIN_TI', 'INVESTIGADOR']);

    expect(facade.availableRoles()).toEqual(['EVALUADOR', 'INVESTIGADOR']);
    expect(facade.activeRole()).toBe('EVALUADOR');
  });

  it('switchRole cambia el rol activo y lo guarda', () => {
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);

    expect(facade.switchRole('INVESTIGADOR')).toBeTrue();
    expect(facade.activeRole()).toBe('INVESTIGADOR');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('INVESTIGADOR');
  });

  it('switchRole rechaza un rol que el usuario no tiene', () => {
    const facade = createFacade(['EVALUADOR']);

    expect(facade.switchRole('SECRETARIA')).toBeFalse();
    expect(facade.activeRole()).toBe('EVALUADOR');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('recupera la última elección guardada', () => {
    localStorage.setItem(STORAGE_KEY, 'INVESTIGADOR');
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);

    expect(facade.activeRole()).toBe('INVESTIGADOR');
  });

  it('ignora una elección guardada que no es un rol válido o que el usuario ya no tiene', () => {
    localStorage.setItem(STORAGE_KEY, 'ADMIN_TI');
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);
    expect(facade.activeRole()).toBe('EVALUADOR');

    TestBed.resetTestingModule();
    localStorage.setItem(STORAGE_KEY, 'SECRETARIA');
    expect(createFacade(['EVALUADOR']).activeRole()).toBe('EVALUADOR');
  });

  it('se actualiza cuando cambian los roles del usuario', () => {
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);
    facade.switchRole('INVESTIGADOR');

    roles.set(['EVALUADOR']);

    expect(facade.activeRole()).toBe('EVALUADOR');
  });

  it('sigue funcionando si localStorage lanza error', () => {
    spyOn(localStorage, 'getItem').and.throwError('SecurityError');
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);

    expect(facade.activeRole()).toBe('EVALUADOR');
    expect(facade.switchRole('INVESTIGADOR')).toBeTrue();
    expect(facade.activeRole()).toBe('INVESTIGADOR');
  });
});
