import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="welcome-section">
      <h1>Bienvenido, {{ userName() }}</h1>
      <p>Aquí tienes un resumen de la actividad reciente en el CEISH.</p>
    </div>

    <div class="stats-grid">
      @for (stat of stats; track stat.title) {
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" [style.background-color]="stat.color">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ stat.title }}</span>
              <h3 class="stat-value">{{ stat.value }}</h3>
              @if (stat.trend) {
                <span class="stat-trend">{{ stat.trend }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <div class="dashboard-grid mt-2">
      <mat-card class="main-card flex-2">
        <mat-card-header>
          <mat-card-title>Protocolos Recientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="empty-placeholder">
            <mat-icon>description</mat-icon>
            <p>No hay protocolos recientes para mostrar.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="side-card flex-1">
        <mat-card-header>
          <mat-card-title>Próximas Sesiones</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="empty-placeholder small">
            <mat-icon>event</mat-icon>
            <p>No hay sesiones programadas.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .welcome-section {
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.75rem; font-weight: 700; color: #0f172a; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      border-radius: 12px;
      border: none;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      
      mat-card-content {
        display: flex;
        align-items: center;
        padding: 1.5rem !important;
      }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1.25rem;
      
      mat-icon { color: white; }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      
      .stat-label { font-size: 0.875rem; color: #64748b; font-weight: 500; }
      .stat-value { margin: 0.125rem 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
      .stat-trend { font-size: 0.75rem; color: #10b981; }
    }

    .dashboard-grid {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .main-card { flex: 2; min-width: 300px; border-radius: 12px; }
    .side-card { flex: 1; min-width: 250px; border-radius: 12px; }
    .mt-2 { margin-top: 2rem; }

    .empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #94a3b8;
      
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }
      &.small { padding: 2rem 1rem; }
    }
  `]
})
export class DashboardHomePage {
  private readonly authFacade = inject(AuthFacade);
  
  userName = computed(() => this.authFacade.currentUser()?.nombre || 'Usuario');

  stats: StatCard[] = [
    { title: 'Protocolos Activos', value: 12, icon: 'assignment', color: '#3b82f6', trend: '+2 esta semana' },
    { title: 'En Evaluación', value: 5, icon: 'pending_actions', color: '#f59e0b' },
    { title: 'Aprobados', value: 124, icon: 'check_circle', color: '#10b981', trend: '+15 este mes' },
    { title: 'Usuarios', value: 8, icon: 'people', color: '#6366f1' },
  ];
}
