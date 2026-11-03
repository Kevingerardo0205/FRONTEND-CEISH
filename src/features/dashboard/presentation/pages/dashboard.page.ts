import {
  Component,
  computed,
  inject,
  ViewChild,
  signal,
  HostListener,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { AiAssistantComponent } from '@shared/components/ai-assistant/ai-assistant.component';
import { IAiAssistantRepositoryPort } from '@domain/ports/IAiAssistantRepositoryPort';
import { RoleSelectorComponent } from '@features/shell/presentation/role-selector/role-selector.component';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Role } from '@domain/value-objects/role.vo';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    SidebarComponent,
    AiAssistantComponent,
    RoleSelectorComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly aiAssistantRepository = inject(IAiAssistantRepositoryPort);
  private readonly activeRoleFacade = inject(ActiveRoleFacade);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // State
  isMobile = false;
  currentDate = signal(new Date());
  allowedRoles = signal<string[]>([]);

  // Derived state from AuthFacade
  user = this.authFacade.currentUser;

  userName = computed(() => this.user()?.nombre || 'Usuario');
  userEmail = computed(() => this.user()?.email || '');
  // D14 (03/11/2026): el avatar y el asistente usan el rol activo, no user.rol.
  userRole = computed(() => {
    const active = this.activeRoleFacade.activeRole();
    return active ? Role.fromBackend(active).label : 'Invitado';
  });
  showAssistant = computed(() => {
    const active = this.activeRoleFacade.activeRole();
    const allowed = this.allowedRoles();
    return !!active && allowed.some((r) => r.toUpperCase() === active);
  });
  userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();

    // Cargar dinámicamente los roles permitidos
    this.aiAssistantRepository.getAllowedRoles().subscribe({
      next: (res) => this.allowedRoles.set(res.allowedRoles),
      error: (err) => {
        console.warn(
          '[DashboardPage] Error al cargar roles permitidos del asistente de IA. Usando lista de respaldo.',
          err,
        );
        this.allowedRoles.set([
          'SECRETARIA',
          'EVALUADOR',
          'PRESIDENTE',
          'ADMIN_TI',
          'INVESTIGADOR',
        ]); // Respaldo completo
      },
    });
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
  }

  onNavClick() {
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  onLogout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
