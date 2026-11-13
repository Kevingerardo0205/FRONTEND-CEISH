import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { catchError, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AiAssistantComponent } from '@shared/components/ai-assistant/ai-assistant.component';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { Role } from '@domain/value-objects/role.vo';
import { GetMenuForRoleUseCase } from '../../application/get-menu-for-role.use-case';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { GetPendingCountUseCase } from '../../application/get-pending-count.use-case';
import { SessionUserPort } from '../../domain/session-user.port';
import { RoleSelectorComponent } from '../role-selector/role-selector.component';

// Igual que el respaldo del backend (RagService.getAllowedRoles, HU-001 f).
const ASSISTANT_FALLBACK_ROLES: readonly string[] = ['SECRETARIA', 'EVALUADOR', 'PRESIDENTE'];

// F10 D16 (7): por debajo de 1024 px el menú va encima del contenido.
const NARROW_SCREEN_QUERY = '(max-width: 1023.98px)';

/**
 * AppShell: Armazón de la aplicación (spec-ui F00 §4), con el aspecto del marco del
 * Investigador (F10 D16). Criterio 1: para SECRETARIA muestra 5 entradas en orden y resalta la activa.
 * Sin OnPush (T10-5a): las pantallas de /dashboard/... usan detección por defecto y no se
 * refrescaban dentro de un padre OnPush (prueba "Riesgo OnPush" del spec).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatSidenavModule,
    AiAssistantComponent,
    RoleSelectorComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnInit {
  private readonly sessionUser = inject(SessionUserPort);
  private readonly router = inject(Router);
  private readonly getMenuForRoleUseCase = inject(GetMenuForRoleUseCase);
  private readonly activeRoleFacade = inject(ActiveRoleFacade);
  private readonly getPendingCountUseCase = inject(GetPendingCountUseCase);
  private readonly aiAssistantRepository = inject(IAiAssistantRepositoryPort, { optional: true });

  // Rol activo (ActiveRoleFacade, nunca user.rol)
  readonly activeRole = this.activeRoleFacade.activeRole;

  // F10 D9: INVESTIGADOR sin verificar ve un aviso en lugar de sus opciones.
  readonly needsVerification = computed(
    () => this.activeRole() === 'INVESTIGADOR' && !this.sessionUser.canEnterInvestigatorArea(),
  );

  // Menú dinámico según el rol activo
  readonly menuItems = computed(() => {
    const role = this.activeRole();
    if (!role || this.needsVerification()) return [];
    return this.getMenuForRoleUseCase.execute(role);
  });

  // Etiqueta del rol activo en el menú del avatar (F00 D14)
  readonly activeRoleLabel = computed(() => {
    const role = this.activeRole();
    return role ? Role.fromBackend(role).label : '';
  });

  // Contador de pendientes: emitirá número si hay adapter configurado, o null si no hay fuente
  readonly pendingCount = toSignal(
    this.getPendingCountUseCase.execute().pipe(catchError(() => of(null))),
    {
      initialValue: null,
    },
  );

  // Menú lateral (F10 D16 (7)): encima del contenido en ventana angosta, al lado desde 1024 px.
  readonly isNarrow = signal(false);
  readonly menuOpen = signal(true);

  readonly currentDate = new Date();

  // Usuario y avatar
  readonly user = toSignal(this.sessionUser.user$, { initialValue: null });
  readonly userName = computed(() => this.user()?.name || 'Usuario');
  readonly userEmail = computed(() => this.user()?.email || '');
  readonly userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'U';
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  // Roles permitidos para el asistente de IA
  readonly allowedAssistantRoles = signal<string[]>([]);
  readonly showAssistant = computed(() => {
    const role = this.activeRole();
    if (!role) return false;
    const allowed = this.allowedAssistantRoles();
    return allowed.some((r) => r.toUpperCase() === role.toUpperCase());
  });

  constructor() {
    inject(BreakpointObserver)
      .observe(NARROW_SCREEN_QUERY)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isNarrow.set(matches);
        this.menuOpen.set(!matches);
      });
  }

  ngOnInit(): void {
    if (this.aiAssistantRepository) {
      this.aiAssistantRepository.getAllowedRoles().subscribe({
        next: (res) => this.allowedAssistantRoles.set(res.allowedRoles),
        error: (err) => {
          console.warn(
            '[AppShell] Error al cargar roles permitidos del asistente de IA. Usando lista de respaldo.',
            err,
          );
          this.allowedAssistantRoles.set([...ASSISTANT_FALLBACK_ROLES]);
        },
      });
    } else {
      this.allowedAssistantRoles.set([...ASSISTANT_FALLBACK_ROLES]);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  onNavClick(): void {
    if (this.isNarrow()) this.menuOpen.set(false);
  }

  onLogout(): void {
    this.sessionUser.logout();
    this.router.navigate(['/auth/login']);
  }
}
