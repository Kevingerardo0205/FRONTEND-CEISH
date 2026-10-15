import { Component, computed, inject, ViewChild, signal, HostListener, OnInit } from '@angular/core';
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
    AiAssistantComponent
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly aiAssistantRepository = inject(IAiAssistantRepositoryPort);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // State
  isMobile = false;
  currentDate = signal(new Date());
  allowedRoles = signal<string[]>([]);
  
  // Derived state from AuthFacade
  user = this.authFacade.currentUser;
  
  userName = computed(() => this.user()?.nombre || 'Usuario');
  userEmail = computed(() => this.user()?.email || '');
  userRole = computed(() => this.user()?.rol || 'Invitado');
  showAssistant = computed(() => {
    const role = this.userRole();
    const allowed = this.allowedRoles();
    return allowed.some(r => r.toUpperCase() === role.toUpperCase());
  });
  userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(' ')
      .map(n => n[0])
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
        console.warn('[DashboardPage] Error al cargar roles permitidos del asistente de IA. Usando lista de respaldo.', err);
        this.allowedRoles.set(['SECRETARIA', 'EVALUADOR', 'PRESIDENTE', 'ADMIN_TI', 'INVESTIGADOR']); // Respaldo completo
      }
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
