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

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class SidebarStubComponent {
  isMobile = input(false);
  navClick = output<void>();
}

describe('DashboardPage: selector de rol (T13c)', () => {
  function setup(available: RoleCode[]) {
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
          useValue: { getAllowedRoles: () => of({ allowedRoles: [] }) },
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

  it('con un solo rol, el menú de avatar no muestra el selector', () => {
    setup(['EVALUADOR']);

    expect(document.querySelector('app-role-selector')).not.toBeNull();
    expect(document.querySelector('[data-testid="role-selector"]')).toBeNull();
  });
});
