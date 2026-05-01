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
    SidebarComponent
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
  currentDate = signal(new Date());
  
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

  @HostListener('window:resize')
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
