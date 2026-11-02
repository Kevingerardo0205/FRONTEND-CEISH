import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AiAssistantComponent } from '@shared/components/ai-assistant/ai-assistant.component';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { GetMenuForRoleUseCase } from '../../application/get-menu-for-role.use-case';
import { ActiveRoleFacade } from '../../application/active-role.facade';
import { GetPendingCountUseCase } from '../../application/get-pending-count.use-case';

/**
 * AppShell: Armazón de la aplicación (spec-ui §4).
 * Criterio 1: para SECRETARIA muestra 5 entradas en orden y resalta la activa.
 * D1 (31/10/2026): aplica solo al rol activo SECRETARIA.
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
    AiAssistantComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly getMenuForRoleUseCase = inject(GetMenuForRoleUseCase);
  private readonly activeRoleFacade = inject(ActiveRoleFacade);
  private readonly getPendingCountUseCase = inject(GetPendingCountUseCase);
  private readonly aiAssistantRepository = inject(IAiAssistantRepositoryPort, { optional: true });

  // Rol activo (ActiveRoleFacade, nunca user.rol)
  readonly activeRole = this.activeRoleFacade.activeRole;

  // Menú dinámico según el rol activo
  readonly menuItems = computed(() => {
    const role = this.activeRole();
    return role ? this.getMenuForRoleUseCase.execute(role) : [];
  });

  // Contador de pendientes: emitirá número si hay adapter configurado, o null si no hay fuente
  readonly pendingCount = toSignal(
    this.getPendingCountUseCase.execute().pipe(catchError(() => of(null))),
    {
      initialValue: null,
    },
  );

  // Usuario y avatar
  readonly user = this.authFacade.currentUser;
  readonly userName = computed(() => this.user()?.nombre || 'Usuario');
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

  // Roles permitidos para el asistente de IA (respaldo sin ADMIN_TI, TSK-001.1c)
  readonly allowedAssistantRoles = signal<string[]>([]);
  readonly showAssistant = computed(() => {
    const role = this.activeRole();
    if (!role) return false;
    const allowed = this.allowedAssistantRoles();
    return allowed.some((r) => r.toUpperCase() === role.toUpperCase());
  });

  ngOnInit(): void {
    if (this.aiAssistantRepository) {
      this.aiAssistantRepository.getAllowedRoles().subscribe({
        next: (res) => this.allowedAssistantRoles.set(res.allowedRoles),
        error: (err) => {
          console.warn(
            '[AppShell] Error al cargar roles permitidos del asistente de IA. Usando lista de respaldo.',
            err,
          );
          this.allowedAssistantRoles.set([
            'SECRETARIA',
            'EVALUADOR',
            'PRESIDENTE',
            'INVESTIGADOR',
          ]);
        },
      });
    } else {
      this.allowedAssistantRoles.set([
        'SECRETARIA',
        'EVALUADOR',
        'PRESIDENTE',
        'INVESTIGADOR',
      ]);
    }
  }

  getIcon(id: string): string {
    switch (id) {
      case 'pendientes':
        return 'assignment_late';
      case 'protocolos':
        return 'description';
      case 'convocatorias':
        return 'event_note';
      case 'reportes':
        return 'bar_chart';
      case 'configuracion':
        return 'settings';
      default:
        return 'folder';
    }
  }

  onLogout(): void {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
