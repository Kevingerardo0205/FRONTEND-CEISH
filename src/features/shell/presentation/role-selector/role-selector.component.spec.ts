import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RoleCode } from '@domain/value-objects/role.vo';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { RoleSelectorComponent } from './role-selector.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('RoleSelectorComponent (T13c)', () => {
  let fixture: ComponentFixture<RoleSelectorComponent>;
  let router: Router;
  let facade: {
    availableRoles: ReturnType<typeof signal<RoleCode[]>>;
    activeRole: ReturnType<typeof signal<RoleCode | null>>;
    switchRole: jasmine.Spy;
  };

  /** Simula ActiveRoleFacade: switchRole acepta solo roles disponibles. */
  function setup(available: RoleCode[], active: RoleCode | null): void {
    facade = {
      availableRoles: signal(available),
      activeRole: signal(active),
      switchRole: jasmine.createSpy('switchRole').and.callFake((role: RoleCode) => {
        if (!facade.availableRoles().includes(role)) return false;
        facade.activeRole.set(role);
        return true;
      }),
    };
    TestBed.configureTestingModule({
      imports: [RoleSelectorComponent],
      providers: [
        provideRouter([
          { path: 'pendientes', component: DummyComponent },
          { path: 'dashboard/home', component: DummyComponent },
        ]),
        { provide: ActiveRoleFacade, useValue: facade },
      ],
    });
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RoleSelectorComponent);
    fixture.detectChanges();
  }

  const options = () => fixture.debugElement.queryAll(By.css('.role-option'));
  const option = (code: RoleCode) =>
    fixture.debugElement.query(By.css(`.role-option[data-role="${code}"]`));

  async function choose(code: RoleCode): Promise<void> {
    option(code).nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('criterio 8: con un solo rol no hay selector', () => {
    setup(['SECRETARIA'], 'SECRETARIA');

    expect(fixture.debugElement.query(By.css('[data-testid="role-selector"]'))).toBeNull();
  });

  it('criterio 3: con 2 roles lista ambos con su nombre legible y marca el activo', () => {
    setup(['SECRETARIA', 'EVALUADOR'], 'SECRETARIA');

    expect(options().map((o) => o.query(By.css('span')).nativeElement.textContent.trim())).toEqual([
      'Secretaría',
      'Evaluador',
    ]);
    expect(option('SECRETARIA').nativeElement.getAttribute('aria-checked')).toBe('true');
    expect(option('EVALUADOR').nativeElement.getAttribute('aria-checked')).toBe('false');
  });

  it('criterio 3: al cambiar de rol cambia el activo y navega al inicio del rol nuevo', async () => {
    setup(['SECRETARIA', 'EVALUADOR'], 'SECRETARIA');

    await choose('EVALUADOR');

    expect(facade.switchRole).toHaveBeenCalledOnceWith('EVALUADOR');
    expect(facade.activeRole()).toBe('EVALUADOR');
    expect(option('EVALUADOR').nativeElement.getAttribute('aria-checked')).toBe('true');
    expect(router.url).toBe('/dashboard/home');
  });

  it('criterio 8: SECRETARIA+EVALUADOR con EVALUADOR activo, al cambiar a SECRETARIA queda en /pendientes', async () => {
    setup(['SECRETARIA', 'EVALUADOR'], 'EVALUADOR');

    await choose('SECRETARIA');

    expect(facade.activeRole()).toBe('SECRETARIA');
    expect(router.url).toBe('/pendientes');
  });

  it('elegir el rol que ya está activo no cambia el rol ni navega', async () => {
    setup(['SECRETARIA', 'EVALUADOR'], 'SECRETARIA');
    const navigate = spyOn(router, 'navigateByUrl').and.callThrough();

    await choose('SECRETARIA');

    expect(facade.switchRole).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('si switchRole devuelve false, no navega', async () => {
    setup(['SECRETARIA', 'EVALUADOR'], 'SECRETARIA');
    facade.switchRole.and.returnValue(false);
    const navigate = spyOn(router, 'navigateByUrl').and.callThrough();

    await choose('EVALUADOR');

    expect(facade.switchRole).toHaveBeenCalledOnceWith('EVALUADOR');
    expect(navigate).not.toHaveBeenCalled();
    expect(router.url).toBe('/');
  });
});
