import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AppShellComponent } from './app-shell.component';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { GetMenuForRoleUseCase } from '../../application/get-menu-for-role.use-case';
import { GetPendingCountUseCase } from '../../application/get-pending-count.use-case';
import { SessionUser, SessionUserPort } from '../../domain/session-user.port';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { StaticMenuConfigAdapter } from '../../infrastructure/menu.config';
import { RoleCode } from '@domain/value-objects/role.vo';
import { appConfig } from 'src/app/app.config';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('AppShellComponent (T13b)', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;
  let router: Router;

  let mockSessionUser: {
    user$: BehaviorSubject<SessionUser | null>;
    logout: jasmine.Spy;
  };

  let mockActiveRoleFacade: {
    activeRole: ReturnType<typeof signal<RoleCode | null>>;
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
    };

    mockActiveRoleFacade = {
      activeRole: signal<RoleCode | null>('SECRETARIA'),
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

      const items = component.menuItems();
      expect(items).toEqual([]);
    });

    it('no muestra el menú de Secretaría a un usuario con varios roles si el rol activo es EVALUADOR', () => {
      mockActiveRoleFacade.activeRole.set('EVALUADOR');
      fixture.detectChanges();

      const items = component.menuItems();
      expect(items).toEqual([]);
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

    it('el avatar muestra las iniciales del usuario y su nombre', () => {
      const avatarCircle = fixture.debugElement.query(By.css('.avatar-circle'));
      const avatarName = fixture.debugElement.query(By.css('.avatar-name'));

      expect(avatarCircle.nativeElement.textContent.trim()).toBe('UP');
      expect(avatarName.nativeElement.textContent.trim()).toBe('Usuario Prueba');
    });

    it('el menú de usuario contiene Mi perfil y espacio para el selector de rol', () => {
      const avatarBtn = fixture.debugElement.query(By.css('[data-testid="avatar-button"]'));
      avatarBtn.nativeElement.click();
      fixture.detectChanges();

      const slot = document.querySelector('[data-testid="role-selector-slot"]');
      expect(slot).not.toBeNull();
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
