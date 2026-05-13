import { Component, inject, input, output, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  isMobile = input<boolean>(false);
  navClick = output<void>();

  private readonly PERMISSION_UI_MAP: Record<string, { label: string, path: string, icon: string }> = {
    'DASHBOARD_VER_PRINCIPAL': { label: 'Inicio', path: '/dashboard/home', icon: 'home' },
    'USUARIOS_VER': { label: 'Gestión de Usuarios', path: '/dashboard/admin/users', icon: 'person_search' },
    'RECEPCION_SUBIR_DOCUMENTOS': { label: 'Mis Protocolos', path: '/dashboard/investigador/mis-protocolos', icon: 'description' },
    'RECEPCION_INICIAR': { label: 'Nuevo Protocolo', path: '/dashboard/investigador/nuevo-protocolo', icon: 'add_circle' },
    'DOCUMENTOS_VALIDAR': { label: 'Bandeja de Validación', path: '/dashboard/protocols/validation/list', icon: 'fact_check' },
    'EVALUADORES_ASIGNAR': { label: 'Asignación de Evaluadores', path: '/dashboard/evaluations/assignment', icon: 'assignment_ind' },
    'EVALUACION_COMPLETAR_FORMULARIO': { label: 'Mis Evaluaciones', path: '/dashboard/evaluations/list', icon: 'gavel' },
    'RESOLUCION_CREAR': { label: 'Generar Resolución', path: '/dashboard/resolutions/generator', icon: 'article' },
    'ADMIN_ALL': { label: 'Panel de Auditoría', path: '/dashboard/audit', icon: 'security' },
    'NOTIFICACIONES_VER': { label: 'Mis Notificaciones', path: '/dashboard/notifications', icon: 'notifications' }
  };

  getRoute(permissionCode: string): string {
    return this.PERMISSION_UI_MAP[permissionCode]?.path || '/dashboard/home';
  }

  getLabel(permissionCode: string): string {
    return this.PERMISSION_UI_MAP[permissionCode]?.label || permissionCode;
  }

  getIcon(permissionCode: string): string {
    return this.PERMISSION_UI_MAP[permissionCode]?.icon || 'chevron_right';
  }

  onNavClick() {
    this.navClick.emit();
  }

  onLogout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
