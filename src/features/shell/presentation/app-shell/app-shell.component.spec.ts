import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component, NgZone, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, map, of, throwError } from 'rxjs';
import { AppShellComponent } from './app-shell.component';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { GetMenuForRoleUseCase } from '../../application/get-menu-for-role.use-case';
import { GetPendingCountUseCase } from '../../application/get-pending-count.use-case';
import { SessionUser, SessionUserPort } from '../../domain/session-user.port';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { MENU_ITEMS, StaticMenuConfigAdapter } from '../../infrastructure/menu.config';
import { RoleCode } from '@domain/value-objects/role.vo';
import { appConfig } from 'src/app/app.config';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { formatDate, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// La barra muestra la fecha con locale 'es': la prueba no depende de que otro spec lo registre.
registerLocaleData(localeEs);

@Component({ standalone: true, template: '' })
class DummyComponent {}

// F10 D16 (7): el corte escrito a mano. El simulado solo responde a esta consulta, así que
// otro corte en el componente deja la ventana "ancha" y fallan las pruebas de ventana angosta.
const NARROW_QUERY = '(max-width: 1023.98px)';

describe('AppShellComponent (T13b)', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;
  let router: Router;
  let narrow$: BehaviorSubject<boolean>;

  const breakpointObserverMock = {
    observe: (query: string | readonly string[]): Observable<BreakpointState> =>
      query === NARROW_QUERY
        ? narrow$.pipe(map((matches) => ({ matches, breakpoints: { [NARROW_QUERY]: matches } })))
        : of({ matches: false, breakpoints: {} }),
  };

  let mockSessionUser: {
    user$: BehaviorSubject<SessionUser | null>;
    logout: jasmine.Spy;
    canEnterInvestigatorArea: jasmine.Spy;
  };

  let mockActiveRoleFacade: {
    availableRoles: ReturnType<typeof signal<RoleCode[]>>;
    activeRole: ReturnType<typeof signal<RoleCode | null>>;
    switchRole: jasmine.Spy;
  };

  let mockPendingCountUseCase: {
    execute: jasmine.Spy;
  };

  let mockAiAssistantRepo: {
    getAllowedRoles: jasmine.Spy;
  };

  beforeEach(async () => {
    mockSessionUser = {
      user$: new BehaviorSubject<SessionUser | null>({
        name: 'Usuario Prueba',
        email: 'usuario.prueba@example.test',
      }),
      logout: jasmine.createSpy('logout'),
      canEnterInvestigatorArea: jasmine.createSpy('canEnterInvestigatorArea').and.returnValue(true),
    };
    narrow$ = new BehaviorSubject<boolean>(false);

    mockActiveRoleFacade = {
      availableRoles: signal<RoleCode[]>(['SECRETARIA', 'EVALUADOR']),
      activeRole: signal<RoleCode | null>('SECRETARIA'),
      switchRole: jasmine.createSpy('switchRole').and.returnValue(true),
    };

    mockPendingCountUseCase = {
      execute: jasmine.createSpy('execute').and.returnValue(of(null)),
    };

    mockAiAssistantRepo = {
      getAllowedRoles: jasmine.createSpy('getAllowedRoles').and.returnValue(
        of({ allowedRoles: ['SECRETARIA', 'PRESIDENTE'] }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([
          { path: 'pendientes', component: DummyComponent },
          { path: 'protocolos', component: DummyComponent },
          { path: 'convocatorias', component: DummyComponent },
          { path: 'reportes', component: DummyComponent },
          { path: 'configuracion', component: DummyComponent },
          { path: 'auth/login', component: DummyComponent },
          { path: 'dashboard/profile', component: DummyComponent },
          { path: 'dashboard/notifications/center', component: DummyComponent },
        ]),
        provideNoopAnimations(),
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
        { provide: SessionUserPort, useValue: mockSessionUser },
        { provide: ActiveRoleFacade, useValue: mockActiveRoleFacade },
        { provide: MenuConfigPort, useClass: StaticMenuConfigAdapter },
        { provide: GetPendingCountUseCase, useValue: mockPendingCountUseCase },
        { provide: IAiAssistantRepositoryPort, useValue: mockAiAssistantRepo },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Criterio 1: Menú lateral de la Secretaría', () => {
    it('muestra exactamente 5 entradas en el orden especificado para SECRETARIA', () => {
      const navLinks = fixture.debugElement.queryAll(By.css('.sidebar-nav .nav-link'));
      const labels = navLinks.map((el) => el.query(By.css('.nav-label')).nativeElement.textContent.trim());

      expect(labels).toEqual([
        'Mis pendientes',
        'Protocolos',
        'Convocatorias',
        'Reportes',
        'Configuración',
      ]);
    });

    it('marca la entrada activa con aria-current="page" al navegar a su ruta', async () => {
      await router.navigateByUrl('/pendientes');
      fixture.detectChanges();

      const activeLink = fixture.debugElement.query(By.css('.sidebar-nav .nav-link.active'));
      expect(activeLink).not.toBeNull();
      expect(activeLink.nativeElement.getAttribute('aria-current')).toBe('page');
      expect(activeLink.query(By.css('.nav-label')).nativeElement.textContent.trim()).toBe('Mis pendientes');
    });
  });

  describe('Menú calculado con el rol activo', () => {
    it('muestra el menú de Secretaría si el rol activo es SECRETARIA', () => {
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      fixture.detectChanges();

      const items = component.menuItems();
      expect(items.length).toBe(5);
      expect(items[0].label).toBe('Mis pendientes');
    });

    it('no muestra el menú de Secretaría si el rol activo es INVESTIGADOR', () => {
      mockActiveRoleFacade.activeRole.set('INVESTIGADOR');
      fixture.detectChanges();

      // F10 T10-1: el rol activo INVESTIGADOR tiene su propio menú (spec-ui F10 §3).
      const items = component.menuItems();
      expect(items.map((i) => i.label)).toEqual(['Mis protocolos', 'Nuevo protocolo', 'Subsanaciones']);
      expect(items.some((i) => i.roles.includes('SECRETARIA'))).toBeFalse();
    });

    it('no muestra el menú de Secretaría a un usuario con varios roles si el rol activo es EVALUADOR', () => {
      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      fixture.detectChanges();

      const items = component.menuItems();
      expect(items.map((i) => i.label)).toEqual(['Mis evaluaciones']);
      expect(items.some((i) => i.roles.includes('SECRETARIA'))).toBeFalse();
    });
  });

  describe('Contador de pendientes', () => {
    it('muestra el badge con el valor cuando el use case entrega un número', () => {
      mockPendingCountUseCase.execute.and.returnValue(of(6));

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const badge = testFixture.debugElement.query(By.css('[data-testid="pending-badge"]'));
      expect(badge).not.toBeNull();
      expect(badge.nativeElement.textContent.trim()).toBe('6');
    });

    it('oculta el badge cuando no hay fuente (use case emite null)', () => {
      mockPendingCountUseCase.execute.and.returnValue(of(null));

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const badge = testFixture.debugElement.query(By.css('[data-testid="pending-badge"]'));
      expect(badge).toBeNull();
    });

    it('oculta el badge cuando el observable falla con error', () => {
      mockPendingCountUseCase.execute.and.returnValue(
        throwError(() => new Error('Error al cargar pendientes')),
      );

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const badge = testFixture.debugElement.query(By.css('[data-testid="pending-badge"]'));
      expect(badge).toBeNull();
    });

    it('no muestra el contador con 0 cuando no hay fuente', () => {
      mockPendingCountUseCase.execute.and.returnValue(of(null));

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const badge = testFixture.debugElement.query(By.css('[data-testid="pending-badge"]'));
      expect(badge).toBeNull();

      const anyZero = testFixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link'))
        .some((el) => el.nativeElement.textContent.includes('0'));
      expect(anyZero).toBeFalse();
    });

    it('F01 T01-3: con totales.todos = 0 no muestra el número', () => {
      mockPendingCountUseCase.execute.and.returnValue(of(0));

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      expect(testFixture.debugElement.query(By.css('[data-testid="pending-badge"]'))).toBeNull();
      const anyZero = testFixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link'))
        .some((el) => el.nativeElement.textContent.includes('0'));
      expect(anyZero).toBeFalse();
    });

    it('F01 T01-3: el número va dentro del enlace "Mis pendientes" (canvas)', () => {
      mockPendingCountUseCase.execute.and.returnValue(of(4));

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const badges = testFixture.debugElement.queryAll(By.css('[data-testid="pending-badge"]'));
      expect(badges.length).toBe(1);
      const link = (badges[0].nativeElement as HTMLElement).closest('.nav-link');
      expect(link?.querySelector('.nav-label')?.textContent?.trim()).toBe('Mis pendientes');
    });
  });

  // F10 T10-5b: GET /secretaria/pendientes es de la Secretaría; con otro rol el 403 haría
  // navegar al interceptor. El contador se pide solo con SECRETARIA activa.
  describe('Contador solo con SECRETARIA activa (F10 T10-5b)', () => {
    function createWith(role: RoleCode): ComponentFixture<AppShellComponent> {
      mockActiveRoleFacade.activeRole.set(role);
      mockPendingCountUseCase.execute.calls.reset();
      mockPendingCountUseCase.execute.and.returnValue(of(3));
      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();
      return testFixture;
    }
    const badge = (f: ComponentFixture<AppShellComponent>) =>
      f.debugElement.query(By.css('[data-testid="pending-badge"]'));

    it('con PRESIDENTE activo no se pide el contador ni se muestra', () => {
      const testFixture = createWith('PRESIDENTE');

      expect(mockPendingCountUseCase.execute).not.toHaveBeenCalled();
      expect(testFixture.componentInstance.pendingCount()).toBeNull();
      expect(badge(testFixture)).toBeNull();
    });

    it('al pasar de PRESIDENTE a SECRETARIA se pide el contador y se muestra', () => {
      const testFixture = createWith('PRESIDENTE');

      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      testFixture.detectChanges();

      expect(mockPendingCountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(badge(testFixture)?.nativeElement.textContent.trim()).toBe('3');
    });

    it('al volver de EVALUADOR a SECRETARIA se pide otra vez', () => {
      const testFixture = createWith('SECRETARIA');
      expect(mockPendingCountUseCase.execute).toHaveBeenCalledTimes(1);

      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      testFixture.detectChanges();
      expect(mockPendingCountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(testFixture.componentInstance.pendingCount()).toBeNull();

      mockPendingCountUseCase.execute.and.returnValue(of(5));
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      testFixture.detectChanges();

      expect(mockPendingCountUseCase.execute).toHaveBeenCalledTimes(2);
      expect(badge(testFixture)?.nativeElement.textContent.trim()).toBe('5');
    });
  });

  describe('Barra superior', () => {
    it('no contiene ningún elemento de búsqueda global (D7: oculta hasta que exista el endpoint)', () => {
      const search = fixture.debugElement.queryAll(
        By.css('input[type="search"], .search-box, [role="search"], input[placeholder*="Buscar"]'),
      );
      expect(search.length).toBe(0);
    });

    it('la campana de notificaciones tiene enlace a /dashboard/notifications/center y sin badge', () => {
      const bell = fixture.debugElement.query(By.css('[data-testid="notifications-bell"]'));
      expect(bell).not.toBeNull();
      expect(bell.nativeElement.getAttribute('href')).toBe('/dashboard/notifications/center');

      const badge = bell.query(By.css('.notification-badge, [matBadge]'));
      expect(badge).toBeNull();
    });

    // F10 D16 (6): reemplaza "el avatar muestra las iniciales del usuario y su nombre" (F00 T13b).
    it('el avatar es un cuadrado de 40 px con --c-brand, con las iniciales y sin el nombre', () => {
      const root = document.documentElement;
      root.style.setProperty('--c-brand', 'rgb(1, 2, 3)');
      try {
        const button: HTMLElement = fixture.debugElement.query(By.css('[data-testid="avatar-button"]')).nativeElement;
        const square = button.querySelector('.avatar-square') as HTMLElement;
        const style = getComputedStyle(square);

        expect(square.textContent?.trim()).toBe('UP');
        expect(style.width).toBe('40px');
        expect(style.height).toBe('40px');
        expect(style.borderRadius).not.toBe('50%');
        expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(button.textContent).not.toContain('Usuario Prueba');
        expect(button.querySelector('.status-indicator')).toBeNull();
      } finally {
        root.style.removeProperty('--c-brand');
      }
    });

    it('muestra "Panel de Gestión" con la fecha de hoy (F10 D16 (3))', () => {
      const topbar: HTMLElement = fixture.debugElement.query(By.css('.shell-topbar')).nativeElement;
      expect(topbar.querySelector('.topbar-title')?.textContent?.trim()).toBe('Panel de Gestión');
      expect(topbar.textContent).not.toContain('Comité de Ética de Investigación en Seres Humanos');
    });

    it('la fecha sale en español, en minúsculas y con "de": "jueves, 12 de noviembre" (F10 D16 (12))', () => {
      const date = fixture.debugElement.query(By.css('[data-testid="topbar-date"]')).nativeElement as HTMLElement;
      const text = date.textContent?.trim() ?? '';

      expect(text).toBe(formatDate(new Date(), "EEEE, d 'de' MMMM", 'es'));
      expect(text).toMatch(/^[a-záéíóúñ]+, \d{1,2} de [a-záéíóúñ]+$/);
      // El 12/11/2026 es jueves (el ejemplo de D16 (12) muestra el formato, no un día concreto).
      expect(formatDate(new Date(2026, 10, 12), "EEEE, d 'de' MMMM", 'es')).toBe('jueves, 12 de noviembre');
      expect(getComputedStyle(date).textTransform).toBe('none');
    });

    it('la barra mide 64 px y el menú lateral 280 px (F10 D16 (2), (3))', () => {
      const topbar: HTMLElement = fixture.debugElement.query(By.css('.shell-topbar')).nativeElement;
      const sidebar: HTMLElement = fixture.debugElement.query(By.css('mat-sidenav.shell-sidebar')).nativeElement;
      const header: HTMLElement = fixture.debugElement.query(By.css('.sidebar-header')).nativeElement;
      const content: HTMLElement = fixture.debugElement.query(By.css('.shell-content')).nativeElement;

      expect(getComputedStyle(topbar).height).toBe('64px');
      expect(getComputedStyle(sidebar).width).toBe('280px');
      expect(getComputedStyle(header).minHeight).toBe('64px');
      expect(getComputedStyle(content).paddingTop).toBe('40px');
      expect(getComputedStyle(content).maxWidth).toBe('1600px');
    });

    it('la campana no tiene punto rojo ni hay contadores sin fuente en la barra (F00 D7)', () => {
      const topbar: HTMLElement = fixture.debugElement.query(By.css('.shell-topbar')).nativeElement;
      expect(topbar.querySelector('.notification-badge')).toBeNull();
    });

    it('el menú de usuario no tiene "Configuración" y muestra la etiqueta del rol activo (F10 D16 (6), F00 D14)', () => {
      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      fixture.detectChanges();
      fixture.debugElement.query(By.css('[data-testid="avatar-button"]')).nativeElement.click();
      fixture.detectChanges();

      const panel = document.querySelector('.user-dropdown-panel') as HTMLElement;
      const items = Array.from(panel.querySelectorAll('[mat-menu-item]')).map((el) => el.textContent?.trim());
      expect(items.some((text) => text?.includes('Configuración'))).toBeFalse();
      expect(items.some((text) => text?.includes('Mi perfil'))).toBeTrue();
      expect(panel.querySelector('[data-testid="role-badge"]')?.textContent?.trim()).toBe('Evaluador');
    });

    it('el menú de usuario muestra el selector de rol (T13c) con los roles disponibles', () => {
      const avatarBtn = fixture.debugElement.query(By.css('[data-testid="avatar-button"]'));
      avatarBtn.nativeElement.click();
      fixture.detectChanges();

      const selector = document.querySelector('app-role-selector [data-testid="role-selector"]');
      expect(selector).not.toBeNull();
      expect(selector?.querySelectorAll('.role-option').length).toBe(2);
    });
  });

  describe('Cerrar sesión', () => {
    it('el botón de cerrar sesión en el sidebar cierra la sesión por el puerto y redirige a /auth/login', () => {
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      const logoutBtn = fixture.debugElement.query(By.css('.logout-link'));
      logoutBtn.nativeElement.click();

      expect(mockSessionUser.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('la opción de cerrar sesión en el menú de usuario cierra la sesión por el puerto y redirige a /auth/login', () => {
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      component.onLogout();

      expect(mockSessionUser.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('Íconos y Cerrar sesión (F10 T10-4)', () => {
    // Texto que queda para el nombre accesible: sin los nodos con aria-hidden="true".
    const accessibleText = (el: Element): string => {
      const clone = el.cloneNode(true) as Element;
      clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
      return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    };

    it('cada opción pinta el ícono de su configuración, no uno elegido por id', () => {
      const useCase = TestBed.inject(GetMenuForRoleUseCase);
      spyOn(useCase, 'execute').and.returnValue([
        {
          id: 'pendientes',
          label: 'Mis pendientes',
          route: '/pendientes',
          roles: ['SECRETARIA'],
          icon: 'star',
        },
        {
          id: 'protocolos',
          label: 'Protocolos',
          route: '/protocolos',
          roles: ['SECRETARIA'],
          icon: 'insights',
        },
      ]);
      // Otro rol activo para que el menú se vuelva a calcular con el caso de uso espiado.
      mockActiveRoleFacade.activeRole.set('PRESIDENTE');
      fixture.detectChanges();

      const icons = fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link mat-icon'))
        .map((el) => el.nativeElement.textContent.trim());
      expect(icons).toEqual(['star', 'insights']);
    });

    it('ya no elige los íconos con getIcon', () => {
      expect('getIcon' in component).toBeFalse();
    });

    it('los íconos de SECRETARIA son los de MENU_ITEMS, ocultos para lectores de pantalla, y el nombre accesible es el texto', () => {
      const expected = MENU_ITEMS.filter((item) => item.roles.includes('SECRETARIA'));
      const links: HTMLElement[] = fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link'))
        .map((el) => el.nativeElement);
      expect(links.length).toBe(expected.length);

      links.forEach((link, index) => {
        const icon = link.querySelector('mat-icon');
        const context = expected[index].label;
        expect(icon?.textContent?.trim()).withContext(context).toBe(expected[index].icon);
        expect(icon?.getAttribute('aria-hidden')).withContext(context).toBe('true');
        expect(accessibleText(link)).withContext(context).toBe(expected[index].label);
      });
    });

    it('Cerrar sesión toma el gris de --c-text-2 (F10 D6) y su ícono va oculto', () => {
      const root = document.documentElement;
      const logout: HTMLElement = fixture.debugElement.query(
        By.css('.sidebar-footer button.logout-link'),
      ).nativeElement;
      const icon = logout.querySelector('mat-icon') as HTMLElement;
      // Sin la transición de color: el estilo computado daría el color anterior (T10-5a, ya pintado
      // dentro de MatSidenav cuando cambia el token).
      logout.style.transition = 'none';
      // Color testigo: si el botón lo toma, el gris sale del token y no de un color escrito a mano.
      root.style.setProperty('--c-text-2', 'rgb(1, 2, 3)');
      try {
        expect(getComputedStyle(logout).color).toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(icon).color).toBe('rgb(1, 2, 3)');
        expect(icon.getAttribute('aria-hidden')).toBe('true');
        expect(accessibleText(logout)).toBe('Cerrar sesión');
      } finally {
        root.style.removeProperty('--c-text-2');
      }
    });

    it('en hover, Cerrar sesión sigue en --c-text-2 sobre --c-primary-soft (F10 D6; sin el índigo de .nav-link:hover)', () => {
      // :hover no se puede forzar desde la prueba: se leen las reglas de hover de los estilos del componente.
      const hoverRules = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        // Solo las del pie del menú del AppShell (.sidebar-footer).
        .filter((rule) =>
          /\.sidebar-footer[^,]*\.logout-link[^,\s]*:hover/.test(rule.selectorText),
        );

      const linkHover = hoverRules.find((rule) => !rule.selectorText.includes('nav-icon'));
      const iconHover = hoverRules.find((rule) => rule.selectorText.includes('nav-icon'));
      expect(linkHover?.style.getPropertyValue('color')).toContain('--c-text-2');
      expect(linkHover?.style.getPropertyValue('background-color')).toContain('--c-primary-soft');
      expect(iconHover?.style.getPropertyValue('color')).toContain('--c-text-2');
    });
  });

  describe('Asistente de IA Inteligente RAG', () => {
    it('monta <app-ai-assistant> cuando el rol activo está permitido', () => {
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      component.allowedAssistantRoles.set(['SECRETARIA']);
      fixture.detectChanges();

      const assistant = fixture.debugElement.query(By.css('app-ai-assistant'));
      expect(assistant).not.toBeNull();
    });

    it('oculta <app-ai-assistant> cuando el rol activo no está permitido', () => {
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      component.allowedAssistantRoles.set(['PRESIDENTE']);
      fixture.detectChanges();

      const assistant = fixture.debugElement.query(By.css('app-ai-assistant'));
      expect(assistant).toBeNull();
    });

    it('el asistente va fuera del contenedor del menú, para que el menú en modo over no lo tape (T10-5a)', () => {
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      component.allowedAssistantRoles.set(['SECRETARIA']);
      fixture.detectChanges();

      const assistant: HTMLElement = fixture.debugElement.query(By.css('app-ai-assistant')).nativeElement;
      expect(assistant.closest('mat-sidenav-container')).toBeNull();
    });

    // Trasladadas del antiguo marco (F00 D14, T10-5a): el asistente decide con el rol activo.
    it('D14: con EVALUADOR activo y asistente solo de SECRETARIA, no se muestra; al volver a SECRETARIA, sí', () => {
      mockAiAssistantRepo.getAllowedRoles.and.returnValue(of({ allowedRoles: ['SECRETARIA'] }));
      const testFixture = TestBed.createComponent(AppShellComponent);
      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      testFixture.detectChanges();
      expect(testFixture.debugElement.query(By.css('app-ai-assistant'))).toBeNull();

      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      testFixture.detectChanges();
      expect(testFixture.debugElement.query(By.css('app-ai-assistant'))).not.toBeNull();
    });

    it('D14: la etiqueta del rol del menú de usuario sigue al rol activo', () => {
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      fixture.detectChanges();
      expect(component.activeRoleLabel()).toBe('Secretaría');
      mockActiveRoleFacade.activeRole.set('PRESIDENTE');
      fixture.detectChanges();
      expect(component.activeRoleLabel()).toBe('Presidente');
    });

    it('la lista de roles de respaldo es la del backend (sin ADMIN_TI ni INVESTIGADOR)', () => {
      mockAiAssistantRepo.getAllowedRoles.and.returnValue(
        throwError(() => new Error('Error al cargar roles')),
      );

      const testFixture = TestBed.createComponent(AppShellComponent);
      testFixture.detectChanges();

      const roles = testFixture.componentInstance.allowedAssistantRoles();
      expect(roles).toEqual(['SECRETARIA', 'EVALUADOR', 'PRESIDENTE']);
    });
  });

  // Trasladadas del sidebar del antiguo marco (F10 T10-2 y T10-4) al retirarlo en T10-5b.
  describe('Menú de PRESIDENTE, EVALUADOR e INVESTIGADOR (trasladadas en T10-5b)', () => {
    const accessibleText = (el: Element): string => {
      const clone = el.cloneNode(true) as Element;
      clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
      return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    };
    const labels = (): string[] =>
      fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-label'))
        .map((el) => el.nativeElement.textContent.trim());

    it('cada opción de los 3 roles pinta el ícono de MENU_ITEMS, oculto, y su nombre accesible es el texto', () => {
      for (const role of ['PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
        mockActiveRoleFacade.activeRole.set(role);
        fixture.detectChanges();
        const expected = MENU_ITEMS.filter((item) => item.roles.includes(role));
        const links: HTMLElement[] = fixture.debugElement
          .queryAll(By.css('.sidebar-nav .nav-link'))
          .map((el) => el.nativeElement);
        expect(links.length).withContext(role).toBe(expected.length);
        links.forEach((link, index) => {
          const icon = link.querySelector('mat-icon');
          const context = role + ' · ' + expected[index].label;
          expect(icon?.textContent?.trim()).withContext(context).toBe(expected[index].icon);
          expect(icon?.getAttribute('aria-hidden')).withContext(context).toBe('true');
          expect(accessibleText(link)).withContext(context).toBe(expected[index].label);
        });
      }
    });

    it('al cambiar de PRESIDENTE a EVALUADOR el menú cambia sin recrear el componente', () => {
      mockActiveRoleFacade.activeRole.set('PRESIDENTE');
      fixture.detectChanges();
      const instance = fixture.componentInstance;
      expect(labels()).toEqual(['Sesiones del pleno', 'Reportes']);

      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      fixture.detectChanges();
      expect(fixture.componentInstance).toBe(instance);
      expect(labels()).toEqual(['Mis evaluaciones']);
    });

    it('con PRESIDENTE no salen opciones de SECRETARIA', () => {
      mockActiveRoleFacade.activeRole.set('PRESIDENTE');
      fixture.detectChanges();
      const secretaria = MENU_ITEMS.filter((item) => item.roles.includes('SECRETARIA')).map((item) => item.route);
      const routes = fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link'))
        .map((el) => el.nativeElement.getAttribute('href'));
      expect(routes).toEqual(['/dashboard/resolutions/calls', '/dashboard/reports/stats']);
      expect(routes.some((route) => secretaria.includes(route))).toBeFalse();
    });

    it('marca solo Sesiones del pleno como página actual en su ruta', async () => {
      router.resetConfig([
        ...router.config,
        { path: 'dashboard/resolutions/calls', component: DummyComponent },
        { path: 'dashboard/reports/stats', component: DummyComponent },
      ]);
      // Los enlaces existen antes de navegar, como en el menú real (RouterLinkActive se
      // actualiza con la navegación).
      mockActiveRoleFacade.activeRole.set('PRESIDENTE');
      fixture.detectChanges();
      await router.navigateByUrl('/dashboard/resolutions/calls');
      fixture.detectChanges();

      const current = fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-link[aria-current="page"]'))
        .map((el) => el.query(By.css('.nav-label')).nativeElement.textContent.trim());
      expect(current).toEqual(['Sesiones del pleno']);
    });

    it('con un solo rol el menú del avatar no muestra el selector de rol', () => {
      mockActiveRoleFacade.availableRoles.set(['EVALUADOR']);
      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      fixture.detectChanges();
      fixture.debugElement.query(By.css('[data-testid="avatar-button"]')).nativeElement.click();
      fixture.detectChanges();

      expect(document.querySelector('.user-dropdown-panel')).not.toBeNull();
      expect(document.querySelector('.user-dropdown-panel [data-testid="role-selector"]')).toBeNull();
    });
  });

  describe('Accesibilidad', () => {
    it('el menú principal tiene nav con aria-label descriptivo', () => {
      const nav = fixture.debugElement.query(By.css('nav[aria-label="Menú principal"]'));
      expect(nav).not.toBeNull();
    });

    it('el botón de cerrar sesión tiene aria-label="Cerrar sesión"', () => {
      const logoutBtn = fixture.debugElement.query(By.css('button.logout-link'));
      expect(logoutBtn.nativeElement.getAttribute('aria-label')).toBe('Cerrar sesión');
    });
  });

  describe('Marca (F10 D16 (5))', () => {
    it('la marca es exactamente "CEISH Espoch", sin ícono, y "comité de ética" no aparece en el marco', () => {
      const shell: HTMLElement = fixture.nativeElement;
      const header = shell.querySelector('.sidebar-header') as HTMLElement;

      expect(shell.querySelector('[data-testid="brand"]')?.textContent?.trim()).toBe('CEISH Espoch');
      expect(header.textContent?.trim()).toBe('CEISH Espoch');
      expect(header.querySelector('mat-icon')).toBeNull();
      expect((shell.textContent ?? '').toLowerCase()).not.toContain('comité de ética');
    });

    for (const role of ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'INVESTIGADOR'] as RoleCode[]) {
      it(`con ${role} activo la marca sigue siendo "CEISH Espoch" y sin "comité de ética"`, () => {
        mockActiveRoleFacade.activeRole.set(role);
        fixture.detectChanges();
        const shell: HTMLElement = fixture.nativeElement;
        expect(shell.querySelector('.sidebar-header')?.textContent?.trim()).toBe('CEISH Espoch');
        expect((shell.textContent ?? '').toLowerCase()).not.toContain('comité de ética');
      });
    }
  });

  describe('Botón del menú (F10 D16 (4))', () => {
    const toggle = (): HTMLButtonElement =>
      fixture.debugElement.query(By.css('[data-testid="menu-toggle"]')).nativeElement;
    const sidenav = (): MatSidenav => fixture.debugElement.query(By.directive(MatSidenav)).componentInstance;

    it('con el menú abierto dice "Ocultar menú", aria-expanded="true", controla el menú y muestra first_page', () => {
      const button = toggle();
      expect(button.getAttribute('aria-label')).toBe('Ocultar menú');
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.getAttribute('aria-controls')).toBe('shell-menu');
      expect(fixture.nativeElement.querySelector('#shell-menu')?.tagName.toLowerCase()).toBe('mat-sidenav');
      expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('first_page');
      expect(button.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('al pulsarlo pliega el menú: "Mostrar menú", aria-expanded="false" y last_page; al pulsarlo otra vez lo abre', () => {
      toggle().click();
      fixture.detectChanges();
      expect(sidenav().opened).toBeFalse();
      expect(toggle().getAttribute('aria-label')).toBe('Mostrar menú');
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(toggle().querySelector('mat-icon')?.textContent?.trim()).toBe('last_page');

      toggle().click();
      fixture.detectChanges();
      expect(sidenav().opened).toBeTrue();
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
    });

    it('mide 40×40, con fondo --c-brand e ícono blanco', () => {
      const root = document.documentElement;
      // Sin la transición del hover: el estilo computado daría el color anterior.
      toggle().style.transition = 'none';
      root.style.setProperty('--c-brand', 'rgb(1, 2, 3)');
      try {
        const style = getComputedStyle(toggle());
        expect(style.width).toBe('40px');
        expect(style.height).toBe('40px');
        expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.color).toBe('rgb(255, 255, 255)');
      } finally {
        root.style.removeProperty('--c-brand');
      }
    });

    it('en hover pasa a --c-primary-dark y el foco visible es de 2 px --c-primary', () => {
      const rules = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
      const hover = rules.find((rule) => /\.menu-toggle-btn[^,\s]*:hover/.test(rule.selectorText));
      const focus = rules.find((rule) => /\.menu-toggle-btn[^,\s]*:focus-visible/.test(rule.selectorText));
      expect(hover?.style.getPropertyValue('background-color')).toContain('--c-primary-dark');
      expect(focus?.style.getPropertyValue('outline')).toContain('2px solid');
      expect(focus?.style.getPropertyValue('outline')).toContain('--c-primary');
    });
  });

  describe('Ventana angosta (F10 D16 (7))', () => {
    const sidenav = (f = fixture): MatSidenav => f.debugElement.query(By.directive(MatSidenav)).componentInstance;
    const backdropShown = (f = fixture): boolean =>
      !!f.nativeElement.querySelector('.mat-drawer-backdrop.mat-drawer-shown');

    it('desde 1024 px el menú va al lado del contenido, abierto, sin fondo oscuro', () => {
      expect(sidenav().mode).toBe('side');
      expect(sidenav().opened).toBeTrue();
      expect(backdropShown()).toBeFalse();
    });

    it('desde 1024 px, elegir una opción no cierra el menú', () => {
      fixture.debugElement.query(By.css('.sidebar-nav .nav-link')).nativeElement.click();
      fixture.detectChanges();
      expect(sidenav().opened).toBeTrue();
    });

    it('por debajo de 1024 px el menú va encima del contenido y cerrado al cargar', () => {
      narrow$.next(true);
      const narrowFixture = TestBed.createComponent(AppShellComponent);
      narrowFixture.detectChanges();

      expect(sidenav(narrowFixture).mode).toBe('over');
      expect(sidenav(narrowFixture).opened).toBeFalse();
      expect(narrowFixture.nativeElement.querySelector('[data-testid="menu-toggle"]').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });

    it('por debajo de 1024 px, abierto con el botón muestra el fondo oscuro y se cierra al elegir una opción', async () => {
      narrow$.next(true);
      const narrowFixture = TestBed.createComponent(AppShellComponent);
      narrowFixture.detectChanges();

      narrowFixture.nativeElement.querySelector('[data-testid="menu-toggle"]').click();
      narrowFixture.detectChanges();
      await narrowFixture.whenStable();
      narrowFixture.detectChanges();
      expect(sidenav(narrowFixture).opened).toBeTrue();
      expect(backdropShown(narrowFixture)).toBeTrue();

      narrowFixture.nativeElement.querySelector('.sidebar-nav .nav-link').click();
      narrowFixture.detectChanges();
      expect(sidenav(narrowFixture).opened).toBeFalse();
    });

    it('al pasar de ancha a angosta el menú se cierra y al volver a ancha se abre', () => {
      narrow$.next(true);
      fixture.detectChanges();
      expect(sidenav().mode).toBe('over');
      expect(sidenav().opened).toBeFalse();

      narrow$.next(false);
      fixture.detectChanges();
      expect(sidenav().mode).toBe('side');
      expect(sidenav().opened).toBeTrue();
    });
  });

  describe('INVESTIGADOR sin verificar (F10 D9, trasladado del antiguo marco en T10-5a)', () => {
    it('muestra el aviso en lugar de sus opciones y conserva Cerrar sesión', () => {
      mockSessionUser.canEnterInvestigatorArea.and.returnValue(false);
      mockActiveRoleFacade.activeRole.set('INVESTIGADOR');
      fixture.detectChanges();

      const nav: HTMLElement = fixture.debugElement.query(By.css('nav[aria-label="Menú principal"]')).nativeElement;
      expect(nav.querySelector('[data-testid="verify-email-notice"]')?.textContent?.trim()).toBe(
        'Verifica tu correo para crear y ver tus protocolos.',
      );
      expect(nav.querySelectorAll('.nav-link').length).toBe(0);
      expect(fixture.nativeElement.querySelector('.sidebar-footer .logout-link .nav-label')?.textContent?.trim()).toBe(
        'Cerrar sesión',
      );
    });

    it('con el correo verificado ve sus 3 opciones y no el aviso', () => {
      mockSessionUser.canEnterInvestigatorArea.and.returnValue(true);
      mockActiveRoleFacade.activeRole.set('INVESTIGADOR');
      fixture.detectChanges();

      const labels = fixture.debugElement
        .queryAll(By.css('.sidebar-nav .nav-label'))
        .map((el) => el.nativeElement.textContent.trim());
      expect(labels).toEqual(['Mis protocolos', 'Nuevo protocolo', 'Subsanaciones']);
      expect(fixture.nativeElement.querySelector('[data-testid="verify-email-notice"]')).toBeNull();
    });

    it('el aviso es solo del rol activo INVESTIGADOR: SECRETARIA ve sus opciones aunque la regla diga que no', () => {
      mockSessionUser.canEnterInvestigatorArea.and.returnValue(false);
      mockActiveRoleFacade.activeRole.set('SECRETARIA');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="verify-email-notice"]')).toBeNull();
      expect(fixture.debugElement.queryAll(By.css('.sidebar-nav .nav-link')).length).toBe(5);
    });
  });

  describe('Riesgo OnPush (F10 T10-5a): pantallas con detección por defecto dentro del AppShell', () => {
    it('una pantalla que cambia un campo dentro de un subscribe se ve actualizada dentro del AppShell', async () => {
      const datos$ = new Subject<string>();

      // Como las pantallas de /dashboard/...: detección por defecto y un campo simple (sin signal
      // ni async pipe) que cambia cuando llega la respuesta.
      @Component({ standalone: true, template: '<p data-testid="valor">{{ valor }}</p>' })
      class PantallaPorDefecto {
        valor = 'inicial';
        constructor() {
          datos$.subscribe((v) => (this.valor = v));
        }
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            { path: '', component: AppShellComponent, children: [{ path: 'pantalla', component: PantallaPorDefecto }] },
          ]),
          provideNoopAnimations(),
          { provide: SessionUserPort, useValue: mockSessionUser },
          { provide: ActiveRoleFacade, useValue: mockActiveRoleFacade },
          { provide: MenuConfigPort, useClass: StaticMenuConfigAdapter },
          { provide: GetPendingCountUseCase, useValue: mockPendingCountUseCase },
          { provide: IAiAssistantRepositoryPort, useValue: mockAiAssistantRepo },
        ],
      });
      const harness = await RouterTestingHarness.create('/pantalla');
      const valor = () =>
        (harness.routeNativeElement?.ownerDocument.querySelector('[data-testid="valor"]') as HTMLElement)
          ?.textContent?.trim();
      expect(valor()).toBe('inicial');

      // La respuesta llega dentro de la zona, como un HttpClient; luego corre la detección desde la
      // raíz, como ApplicationRef.tick() en la app (el fixture del harness no está en ApplicationRef).
      TestBed.inject(NgZone).run(() => datos$.next('actualizado'));
      harness.detectChanges();
      await harness.fixture.whenStable();

      expect(valor()).toBe('actualizado');
    });
  });

  describe('Providers reales (app.config.ts)', () => {
    it('inyectar AppShellComponent y GetMenuForRoleUseCase con appConfig.providers no lanza NullInjectorError', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AppShellComponent],
        providers: [
          ...appConfig.providers,
          provideRouter([]),
        ],
      });

      expect(() => {
        TestBed.inject(GetMenuForRoleUseCase);
        TestBed.createComponent(AppShellComponent);
      }).not.toThrow();
    });
  });
});
