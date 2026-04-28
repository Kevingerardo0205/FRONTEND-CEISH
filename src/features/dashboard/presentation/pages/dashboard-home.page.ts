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
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="minimal-welcome">
      <div class="welcome-text">
        <h1>Hola, {{ userName() }}</h1>
        <p>Resumen de actividad institucional</p>
      </div>
      <div class="date-chip">
        {{ currentDate }}
      </div>
    </div>

    <div class="stats-row">
      @for (stat of stats; track stat.title) {
        <div class="minimal-stat-card">
          <div class="stat-icon-wrapper" [style.color]="stat.color">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-content">
            <span class="label">{{ stat.title }}</span>
            <span class="value">{{ stat.value }}</span>
          </div>
        </div>
      }
    </div>

    <div class="grid-layout">
      <section class="main-section">
        <header class="section-header">
          <h2>Protocolos recientes</h2>
          <button mat-button color="primary">Ver todos</button>
        </header>
        
        <div class="empty-state">
          <div class="empty-icon-box">
            <mat-icon>folder_open</mat-icon>
          </div>
          <h3>Sin actividad reciente</h3>
          <p>Los protocolos que gestiones aparecerán aquí.</p>
        </div>
      </section>

      <section class="side-section">
        <header class="section-header">
          <h2>Agenda</h2>
        </header>
        <div class="agenda-list">
          <p class="empty-msg">No hay eventos para hoy</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .minimal-welcome {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;

      h1 { margin: 0; font-size: 2rem; font-weight: 700; color: #0f172a; letter-spacing: -1px; }
      p { margin: 0.25rem 0 0; color: #94a3b8; font-weight: 500; }
    }

    .date-chip {
      padding: 0.5rem 1rem;
      background-color: #f1f5f9;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .minimal-stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem 0;

      .stat-icon-wrapper {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        mat-icon { font-size: 22px; width: 22px; height: 22px; }
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
      }
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 3rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    }

    .empty-state {
      padding: 5rem 2rem;
      background-color: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      text-align: center;

      .empty-icon-box {
        width: 60px;
        height: 60px;
        background-color: #f8fafc;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        mat-icon { color: #cbd5e1; font-size: 28px; width: 28px; height: 28px; }
      }

      h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.5rem 0 0; font-size: 0.875rem; color: #94a3b8; }
    }

    .agenda-list {
      padding: 2rem;
      border: 1px dashed #e2e8f0;
      border-radius: 20px;
      text-align: center;
      .empty-msg { font-size: 0.8rem; color: #94a3b8; font-weight: 500; margin: 0; }
    }

    @media (max-width: 1024px) {
      .grid-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardHomePage {
  private readonly authFacade = inject(AuthFacade);
  
  userName = computed(() => this.authFacade.currentUser()?.nombre?.split(' ')[0] || 'Usuario');
  currentDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date());

  stats: StatCard[] = [
    { title: 'Activos', value: 12, icon: 'bolt', color: '#2563eb' },
    { title: 'En Revisión', value: 5, icon: 'visibility', color: '#f59e0b' },
    { title: 'Finalizados', value: 124, icon: 'done_all', color: '#10b981' },
  ];
}
