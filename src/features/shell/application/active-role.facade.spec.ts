import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SessionRolesPort } from '../domain/session-roles.port';
import { ActiveRoleFacade } from './active-role.facade';

describe('ActiveRoleFacade', () => {
  const STORAGE_KEY = 'ceish.activeRole';
  let roles$: BehaviorSubject<string[]>;

  function createFacade(initialRoles: string[]): ActiveRoleFacade {
    roles$ = new BehaviorSubject(initialRoles);
    TestBed.configureTestingModule({
      providers: [{ provide: SessionRolesPort, useValue: { roles$ } }],
    });
    return TestBed.inject(ActiveRoleFacade);
  }

  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('con un solo rol, ese es el activo', () => {
    const facade = createFacade(['EVALUADOR']);

    expect(facade.availableRoles()).toEqual(['EVALUADOR']);
    expect(facade.activeRole()).toBe('EVALUADOR');
  });

  it('con varios roles y nada guardado, activa el de mayor prioridad', () => {
    const facade = createFacade(['INVESTIGADOR', 'EVALUADOR', 'PRESIDENTE', 'SECRETARIA']);

    expect(facade.availableRoles()).toEqual([
      'SECRETARIA',
      'PRESIDENTE',
      'EVALUADOR',
      'INVESTIGADOR',
    ]);
    expect(facade.activeRole()).toBe('SECRETARIA');
  });

  it('ignora sin error los roles que el VO no reconoce (ADMIN_TI, PRESIDENTA)', () => {
    const facade = createFacade(['ADMIN_TI', 'PRESIDENTA', 'INVESTIGADOR']);

    expect(facade.availableRoles()).toEqual(['INVESTIGADOR']);
    expect(facade.activeRole()).toBe('INVESTIGADOR');
  });

  it('sin roles reconocidos no hay rol activo', () => {
    const facade = createFacade(['ADMIN_TI', 'PRESIDENTA']);

    expect(facade.availableRoles()).toEqual([]);
    expect(facade.activeRole()).toBeNull();
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

  it('usa el último rol guardado si sigue siendo válido', () => {
    localStorage.setItem(STORAGE_KEY, 'INVESTIGADOR');
    const facade = createFacade(['SECRETARIA', 'INVESTIGADOR']);

    expect(facade.activeRole()).toBe('INVESTIGADOR');
  });

  it('ignora un rol guardado que no es válido y vuelve a la prioridad', () => {
    localStorage.setItem(STORAGE_KEY, 'ADMIN_TI');
    const facade = createFacade(['INVESTIGADOR', 'EVALUADOR']);

    expect(facade.activeRole()).toBe('EVALUADOR');
  });

  it('ignora un rol guardado que el usuario ya no tiene', () => {
    localStorage.setItem(STORAGE_KEY, 'SECRETARIA');
    const facade = createFacade(['INVESTIGADOR', 'EVALUADOR']);

    expect(facade.activeRole()).toBe('EVALUADOR');
  });

  it('se actualiza cuando cambian los roles de la sesión', () => {
    const facade = createFacade(['EVALUADOR', 'INVESTIGADOR']);
    facade.switchRole('INVESTIGADOR');

    roles$.next(['EVALUADOR']);

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
