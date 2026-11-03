import { TestBed } from '@angular/core/testing';
import { Component, input, output, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { RoleCode } from '@domain/value-objects/role.vo';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { DashboardPage } from './dashboard.page';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// La barra muestra la fecha con locale 'es': la prueba no depende de que otro spec lo registre.
registerLocaleData(localeEs);

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class SidebarStubComponent {
  isMobile = input(false);
  navClick = output<void>();
}

describe('DashboardPage: selector de rol (T13c)', () => {
  function setup(available: RoleCode[], assistantRoles: string[] = []) {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: AuthFacade,
          useValue: {
            currentUser: signal({ nombre: 'Usuario Prueba', email: 'usuario.prueba@example.test', rol: 'EVALUADOR' }),
            logout: jasmine.createSpy('logout'),
          },
        },
        {
          provide: ActiveRoleFacade,
          useValue: {
            availableRoles: signal(available),
            activeRole: signal<RoleCode | null>(available[0] ?? null),
            switchRole: jasmine.createSpy('switchRole').and.returnValue(true),
          },
        },
        {
          provide: IAiAssistantRepositoryPort,
          useValue: { getAllowedRoles: () => of({ allowedRoles: assistantRoles }) },
        },
      ],
    });
    TestBed.overrideComponent(DashboardPage, {
      remove: { imports: [SidebarComponent] },
      add: { imports: [SidebarStubComponent] },
    });
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.user-profile-button').click();
    fixture.detectChanges();
    return fixture;
  }

  it('el menú de avatar muestra el selector para volver a SECRETARIA', () => {
    setup(['SECRETARIA', 'EVALUADOR']);

    const selector = document.querySelector('app-role-selector [data-testid="role-selector"]');
    expect(selector).not.toBeNull();
    expect(selector?.querySelector('.role-option[data-role="SECRETARIA"]')).not.toBeNull();
  });

  it('D14: el role-badge muestra la etiqueta del rol activo, no user.rol', () => {
    // user.rol del mock es EVALUADOR; el rol activo es SECRETARIA.
    setup(['SECRETARIA', 'EVALUADOR']);

    expect(document.querySelector('.role-badge')?.textContent?.trim()).toBe('Secretaría');
  });

  it('D14: showAssistant decide con el rol activo, no con user.rol', () => {
    // El asistente solo admite SECRETARIA; user.rol es EVALUADOR y el rol activo SECRETARIA.
    const fixture = setup(['SECRETARIA', 'EVALUADOR'], ['SECRETARIA']);

    expect(fixture.componentInstance.showAssistant()).toBeTrue();
  });

  it('D14: con EVALUADOR activo y asistente solo de SECRETARIA, no se muestra', () => {
    const fixture = setup(['EVALUADOR'], ['SECRETARIA']);

    expect(fixture.componentInstance.showAssistant()).toBeFalse();
    expect(document.querySelector('.role-badge')?.textContent?.trim()).toBe('Evaluador');
  });

  it('con un solo rol, el menú de avatar no muestra el selector', () => {
    setup(['EVALUADOR']);

    expect(document.querySelector('app-role-selector')).not.toBeNull();
    expect(document.querySelector('[data-testid="role-selector"]')).toBeNull();
  });
});
