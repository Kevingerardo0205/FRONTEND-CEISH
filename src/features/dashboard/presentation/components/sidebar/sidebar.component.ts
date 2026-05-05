import { Component, inject, input, output, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { UserRole } from '@domain/entities/user.entity';

export interface MenuItem {
  label: string;
  icon: string;
  path: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  isMobile = input<boolean>(false);
  navClick = output<void>();

  private readonly allMenuItems: MenuItem[] = [
    { label: 'Salpicadero', icon: 'dashboard', path: '/dashboard/home' },
    { label: 'Usuarios', icon: 'group', path: '/dashboard/admin/users', roles: ['ADMIN'] },
    
    // Investigador
    { label: 'Mis Protocolos', icon: 'description', path: '/investigador/mis-protocolos', roles: ['INVESTIGADOR'] },
    { label: 'Nuevo Protocolo', icon: 'add_circle', path: '/investigador/nuevo-protocolo', roles: ['INVESTIGADOR'] },
    
    // Secretaría y Admin
    { label: 'Validación', icon: 'fact_check', path: '/dashboard/protocols/validation/list', roles: ['SECRETARIA', 'ADMIN'] },
    { label: 'Asignación', icon: 'assignment_ind', path: '/dashboard/evaluations/assignment', roles: ['SECRETARIA', 'ADMIN'] },
    
    // Evaluador
    { label: 'Mis Evaluaciones', icon: 'gavel', path: '/dashboard/evaluations/list', roles: ['EVALUADOR', 'ADMIN'] },
    
    // Resoluciones
    { label: 'Resoluciones', icon: 'gavel', path: '/dashboard/resolutions/generator', roles: ['SECRETARIA', 'PRESIDENTA', 'ADMIN'] },
    
    { label: 'Eventos Adversos', icon: 'warning', path: '/dashboard/follow-up/adverse-events' },
    { label: 'Solicitar Enmienda', icon: 'edit_document', path: '/dashboard/amendments/request' },
    { label: 'Renovaciones', icon: 'update', path: '/dashboard/renewals/request' },
    
    { label: 'Reportes', icon: 'insights', path: '/dashboard/reports', roles: ['SECRETARIA', 'PRESIDENTA', 'ADMIN'] },
    { label: 'Auditoría', icon: 'security', path: '/dashboard/audit', roles: ['ADMIN'] },
    { label: 'Notificaciones', icon: 'notifications', path: '/dashboard/notifications' },
  ];

  filteredMenuItems = computed(() => {
    const user = this.authFacade.currentUser();
    if (!user) return [];
    
    return this.allMenuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user.rol as UserRole);
    });
  });

  onNavClick() {
    this.navClick.emit();
  }

  onLogout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
