import { Component, computed, inject, ViewChild, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthFacade } from '@features/auth/facades/auth.facade';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // State
  isMobile = false;
  
  // Derived state from AuthFacade
  user = this.authFacade.currentUser;
  
  userName = computed(() => this.user()?.nombre || 'Usuario');
  userEmail = computed(() => this.user()?.email || '');
  userRole = computed(() => this.user()?.rol || 'Invitado');
  userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  // Navigation Items
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard/home' },
    { label: 'Usuarios', icon: 'group', path: '/dashboard/admin/users', roles: ['ADMIN'] },
    { label: 'Protocolos', icon: 'description', path: '/dashboard/protocols' },
    { label: 'Evaluaciones', icon: 'gavel', path: '/dashboard/evaluations' },
  ];

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();
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
