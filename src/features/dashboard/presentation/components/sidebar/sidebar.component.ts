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

  /**
   * Determina qué módulo debe estar expandido basándose en la ruta activa.
   */
  public activeModule = computed(() => {
    try {
      const currentUrl = this.router.url;
      const menu = this.authFacade.menuConfig();
      
      for (const group of menu) {
        // Resiliencia: Verificar que subItems exista y sea un array
        const subItems = group.subItems || [];
        if (subItems.some((item: any) => item.path && currentUrl.includes(item.path))) {
          return group.code;
        }
      }
      return null;
    } catch (err) {
      console.error('[SidebarComponent] Error en activeModule:', err);
      return null;
    }
  });

  onNavClick() {
    this.navClick.emit();
  }

  onLogout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
