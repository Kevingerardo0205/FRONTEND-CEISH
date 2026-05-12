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
  permissions?: string[];
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
    { label: 'Usuarios', icon: 'group', path: '/dashboard/admin/users', permissions: ['USUARIOS_CREAR', 'USUARIOS_DESACTIVAR'] },
    
    // Investigador
    { label: 'Mis Protocolos', icon: 'description', path: '/dashboard/investigador/mis-protocolos', permissions: ['RECEPCION_SUBIR_DOCUMENTOS'] },
    { label: 'Nuevo Protocolo', icon: 'add_circle', path: '/dashboard/investigador/nuevo-protocolo', permissions: ['RECEPCION_SUBIR_DOCUMENTOS'] },
    
    // Secretaría y Admin
    { label: 'Validación', icon: 'fact_check', path: '/dashboard/protocols/validation/list', permissions: ['DOCUMENTOS_VALIDAR'] },
    { label: 'Asignación', icon: 'assignment_ind', path: '/dashboard/evaluations/assignment', permissions: ['EVALUADORES_ASIGNAR'] },
    
    // Evaluador
    { label: 'Mis Evaluaciones', icon: 'gavel', path: '/dashboard/evaluations/list', permissions: ['EVALUACION_COMPLETAR_FORMULARIO'] },
    
    // Resoluciones
    { label: 'Resoluciones', icon: 'gavel', path: '/dashboard/resolutions/generator', permissions: ['RESOLUCION_CREAR'] },
    
    { label: 'Eventos Adversos', icon: 'warning', path: '/dashboard/follow-up/adverse-events' },
    { label: 'Solicitar Enmienda', icon: 'edit_document', path: '/dashboard/amendments/request' },
    { label: 'Renovaciones', icon: 'update', path: '/dashboard/renewals/request' },
    
    { label: 'Reportes', icon: 'insights', path: '/dashboard/reports', permissions: ['DOCUMENTOS_VALIDAR', 'RESOLUCION_CREAR'] },
    { label: 'Auditoría', icon: 'security', path: '/dashboard/audit', permissions: ['ADMIN_ALL'] },
    { label: 'Notificaciones', icon: 'notifications', path: '/dashboard/notifications' },
  ];

  filteredMenuItems = computed(() => {
    const user = this.authFacade.currentUser();
    if (!user) return [];
    
    const userPermissions = user.permissions || [];
    
    return this.allMenuItems.filter(item => {
      if (!item.permissions) return true;
      return item.permissions.some(p => userPermissions.includes(p));
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
