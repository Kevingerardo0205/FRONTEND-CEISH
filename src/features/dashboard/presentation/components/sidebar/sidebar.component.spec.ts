import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { RoleCode } from '@domain/value-objects/role.vo';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { MENU_ITEMS, StaticMenuConfigAdapter } from '@features/shell/infrastructure/menu.config';
import { SidebarComponent } from './sidebar.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('SidebarComponent (F10 T10-2)', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let router: Router;

  let mockActiveRoleFacade: {
    activeRole: ReturnType<typeof signal<RoleCode | null>>;
    availableRoles: ReturnType<typeof signal<RoleCode[]>>;
  };

  let mockAuthFacade: {
    canEnterInvestigatorArea: jasmine.Spy;
    logout: jasmine.Spy;
  };

  const navLabels = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'nav[aria-label="Menú principal"] .nav-link .nav-label',
      ),
    ).map((label) => label.textContent?.trim() ?? '');

  beforeEach(async () => {
    mockActiveRoleFacade = {
      activeRole: signal<RoleCode | null>('PRESIDENTE'),
      availableRoles: signal<RoleCode[]>(['PRESIDENTE', 'EVALUADOR']),
    };
    mockAuthFacade = {
      canEnterInvestigatorArea: jasmine.createSpy().and.returnValue(true),
      logout: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([
          ...MENU_ITEMS.map((item) => ({
            path: item.route.slice(1),
            component: DummyComponent,
          })),
          { path: 'auth/login', component: DummyComponent },
        ]),
        { provide: MenuConfigPort, useClass: StaticMenuConfigAdapter },
        { provide: ActiveRoleFacade, useValue: mockActiveRoleFacade },
        { provide: AuthFacade, useValue: mockAuthFacade },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('muestra exactamente las opciones de PRESIDENTE', () => {
    expect(navLabels()).toEqual(['Sesiones del pleno', 'Reportes']);
  });

  it('muestra exactamente las opciones de EVALUADOR', () => {
    mockActiveRoleFacade.activeRole.set('EVALUADOR');
    fixture.detectChanges();

    expect(navLabels()).toEqual(['Mis evaluaciones']);
  });

  it('muestra las opciones de INVESTIGADOR verificado en el orden configurado', () => {
    mockActiveRoleFacade.activeRole.set('INVESTIGADOR');
    fixture.detectChanges();

    expect(navLabels()).toEqual(['Mis protocolos', 'Nuevo protocolo', 'Subsanaciones']);
  });

  it('actualiza las opciones al cambiar de PRESIDENTE a EVALUADOR sin recrear el componente', () => {
    const instance = fixture.componentInstance;
    expect(navLabels()).toEqual(['Sesiones del pleno', 'Reportes']);

    mockActiveRoleFacade.activeRole.set('EVALUADOR');
    fixture.detectChanges();

    expect(navLabels()).toEqual(['Mis evaluaciones']);
    expect(fixture.componentInstance).toBe(instance);
  });

  it('muestra el aviso de verificación y conserva Cerrar sesión para INVESTIGADOR sin verificar', () => {
    mockAuthFacade.canEnterInvestigatorArea.and.returnValue(false);
    mockActiveRoleFacade.activeRole.set('INVESTIGADOR');
    fixture.detectChanges();

    const nav = (fixture.nativeElement as HTMLElement).querySelector(
      'nav[aria-label="Menú principal"]',
    ) as HTMLElement;
    expect(nav.querySelectorAll('.nav-link').length).toBe(0);
    expect(
      (nav.querySelector('[data-testid="verify-email-notice"]') as HTMLElement).textContent?.trim(),
    ).toBe('Verifica tu correo para crear y ver tus protocolos.');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('button.logout-link .nav-label')
        ?.textContent?.trim(),
    ).toBe('Cerrar sesión');
  });

  it('marca solo Sesiones del pleno como página actual en su ruta', async () => {
    await router.navigateByUrl('/dashboard/resolutions/calls');
    fixture.detectChanges();

    const nav = (fixture.nativeElement as HTMLElement).querySelector(
      'nav[aria-label="Menú principal"]',
    ) as HTMLElement;
    const currentLinks = nav.querySelectorAll('[aria-current="page"]');
    expect(currentLinks.length).toBe(1);
    expect(
      (currentLinks[0].querySelector('.nav-label') as HTMLElement).textContent?.trim(),
    ).toBe('Sesiones del pleno');

    const reportsLink = nav.querySelector(
      'a[href="/dashboard/reports/stats"]',
    ) as HTMLAnchorElement;
    expect(reportsLink.hasAttribute('aria-current')).toBeFalse();
  });

  it('expone el nombre accesible del menú principal', () => {
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'nav[aria-label="Menú principal"]',
      ),
    ).not.toBeNull();
  });

  it('no muestra entradas de SECRETARIA para los otros roles activos', () => {
    const secretariaItems = MENU_ITEMS.filter((item) => item.roles.includes('SECRETARIA'));

    for (const role of ['PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as const) {
      mockActiveRoleFacade.activeRole.set(role);
      fixture.detectChanges();

      const links = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
          'nav[aria-label="Menú principal"] .nav-link',
        ),
      );
      expect(links.length).withContext('Rol activo: ' + role).toBeGreaterThan(0);
      const hasSecretariaEntry = links.some((link) => {
        const label = link.querySelector('.nav-label')?.textContent?.trim();
        const href = link.getAttribute('href');
        return secretariaItems.some((item) => item.label === label && item.route === href);
      });

      expect(hasSecretariaEntry).withContext('Rol activo: ' + role).toBeFalse();
    }
  });

  it('cada opción pinta el ícono de su configuración, oculto para lectores de pantalla, y su nombre accesible es el texto (F10 D5, T10-4)', () => {
    // Texto que queda para el nombre accesible: sin los nodos con aria-hidden="true".
    const accessibleText = (el: Element): string => {
      const clone = el.cloneNode(true) as Element;
      clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
      return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    for (const role of ['INVESTIGADOR', 'PRESIDENTE', 'EVALUADOR'] as const) {
      mockActiveRoleFacade.activeRole.set(role);
      fixture.detectChanges();

      const expected = MENU_ITEMS.filter((item) => item.roles.includes(role));
      const links = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
          'nav[aria-label="Menú principal"] .nav-link',
        ),
      );
      expect(links.length)
        .withContext('Rol activo: ' + role)
        .toBe(expected.length);

      links.forEach((link, index) => {
        const icon = link.querySelector('mat-icon');
        const context = role + ' · ' + expected[index].label;
        expect(icon).withContext(context).not.toBeNull();
        expect(icon?.textContent?.trim()).withContext(context).toBe(expected[index].icon);
        expect(icon?.getAttribute('aria-hidden')).withContext(context).toBe('true');
        expect(accessibleText(link)).withContext(context).toBe(expected[index].label);
      });
    }
  });

  it('cierra sesión y navega a /auth/login al pulsar Cerrar sesión', () => {
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const logoutButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.logout-link',
    ) as HTMLButtonElement;
    logoutButton.click();

    expect(mockAuthFacade.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
