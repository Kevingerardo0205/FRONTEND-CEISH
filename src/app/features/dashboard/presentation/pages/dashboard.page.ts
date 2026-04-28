import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <mat-sidenav-container class="dashboard-container">
      
      <!-- SIDEBAR -->
      <mat-sidenav #sidenav mode="side" opened class="dashboard-sidenav">
        <div class="sidenav-header">
          <mat-icon class="sidenav-logo-icon">admin_panel_settings</mat-icon>
          <h2>CEISH Admin</h2>
        </div>

        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard/admin/users" routerLinkActive="active-link">
            <mat-icon matListItemIcon>group</mat-icon>
            <div matListItemTitle>Usuarios</div>
          </a>
          <a mat-list-item routerLink="/dashboard/protocols" routerLinkActive="active-link">
            <mat-icon matListItemIcon>description</mat-icon>
            <div matListItemTitle>Protocolos</div>
          </a>
          <a mat-list-item routerLink="/dashboard/evaluations" routerLinkActive="active-link">
            <mat-icon matListItemIcon>gavel</mat-icon>
            <div matListItemTitle>Evaluaciones</div>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer">
          <button mat-flat-button color="warn" (click)="onLogout()" class="full-width">
            <mat-icon>exit_to_app</mat-icon>
            Cerrar Sesión
          </button>
        </div>
      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content class="dashboard-content">
        <mat-toolbar color="primary" class="dashboard-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span>Panel de Control</span>
          <span class="spacer"></span>
          <button mat-button>
            <mat-icon>person</mat-icon>
            Administrador
          </button>
        </mat-toolbar>

        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
    }
    .dashboard-sidenav {
      width: 260px;
      background-color: #1e293b;
      color: white;
    }
    .sidenav-header {
      padding: 2rem 1.5rem;
      text-align: center;
    }
    .logo {
      height: 60px;
      margin-bottom: 1rem;
    }
    .dashboard-sidenav .mat-mdc-nav-list {
      padding-top: 0;
    }
    .dashboard-sidenav .mdc-list-item {
      color: #cbd5e1;
    }
    .dashboard-sidenav .mat-mdc-list-item-icon {
      color: #cbd5e1;
    }
    .dashboard-sidenav .active-link {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    .dashboard-sidenav .active-link .mat-mdc-list-item-icon {
      color: white;
    }
    .sidenav-footer {
      position: absolute;
      bottom: 0;
      width: 100%;
      padding: 1.5rem;
      box-sizing: border-box;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .full-width {
      width: 100%;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .dashboard-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .content-body {
      padding: 2rem;
      background-color: #f1f5f9;
      min-height: calc(100vh - 64px);
    }
  `],
  standalone: false
})
export class DashboardComponent {
  constructor(private authService: AuthService, private router: Router) {
    console.log('DashboardComponent cargado');
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
