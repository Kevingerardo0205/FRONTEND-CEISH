import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';

export interface MenuItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
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

  menuItems: MenuItem[] = [
    { label: 'Salpicadero', icon: 'dashboard', path: '/dashboard/home' },
    { label: 'Usuarios', icon: 'group', path: '/dashboard/admin/users', roles: ['ADMIN'] },
    { label: 'Protocolos', icon: 'description', path: '/dashboard/protocols' },
    { label: 'Evaluaciones', icon: 'gavel', path: '/dashboard/evaluations' },
  ];

  onNavClick() {
    this.navClick.emit();
  }

  onLogout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
