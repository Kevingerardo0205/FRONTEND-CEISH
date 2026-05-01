import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { StatCardComponent } from '../components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, StatCardComponent],
  template: `
    <div class="dashboard-header">
      <div class="welcome-container">
        <span class="greeting-chip">{{ greeting() }}</span>
        <h1 class="welcome-title">Hola, {{ userName() }}</h1>
        <p class="welcome-subtitle">Resumen de actividad institucional</p>
      </div>
      <div class="header-actions">
        <div class="date-display">
          <mat-icon>calendar_today</mat-icon>
          <span>{{ currentDate }}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      @for (stat of stats; track stat.title) {
        <app-stat-card
          [label]="stat.title"
          [value]="stat.value"
          [icon]="stat.icon"
          [color]="stat.color"
        />
      }
    </div>

    <div class="content-layout">
      <section class="main-content">
        <div class="section-card">
          <header class="section-header">
            <div class="header-title">
              <mat-icon>history</mat-icon>
              <h2>Protocolos recientes</h2>
            </div>
            <button mat-button color="primary" class="view-all-btn">
              Ver todos <mat-icon>arrow_forward</mat-icon>
            </button>
          </header>
          
          <div class="empty-state">
            <div class="empty-illustration">
              <mat-icon>folder_off</mat-icon>
              <div class="ripple"></div>
            </div>
            <h3>Sin actividad reciente</h3>
            <p>Los protocolos que gestiones aparecerán aquí de forma automática.</p>
            <button mat-stroked-button color="primary" class="action-btn">
              Crear nuevo protocolo
            </button>
          </div>
        </div>
      </section>

      <section class="side-content">
        <div class="section-card agenda-card">
          <header class="section-header">
            <div class="header-title">
              <mat-icon>event</mat-icon>
              <h2>Agenda</h2>
            </div>
          </header>
          <div class="agenda-content">
            <div class="empty-agenda">
              <p>No hay eventos para hoy</p>
              <span>Mantente al día con tus revisiones</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding-bottom: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5rem;

      .greeting-chip {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgba(77, 182, 172, 0.1);
        color: #00897B;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
      }

      .welcome-title {
        margin: 0;
        font-size: 2.25rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -1px;
        line-height: 1.2;
      }

      .welcome-subtitle {
        margin: 0.5rem 0 0;
        color: #64748b;
        font-size: 1.1rem;
        font-weight: 500;
      }
    }

    .date-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: white;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      color: #64748b;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #94a3b8;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .content-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .section-card {
      background: white;
      border-radius: 24px;
      padding: 1.75rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 25px rgba(0,0,0,0.03);
      height: 100%;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        mat-icon {
          color: #4DB6AC;
          font-size: 22px;
          width: 22px;
          height: 22px;
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.3px;
        }
      }

      .view-all-btn {
        font-weight: 600;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;

      .empty-illustration {
        position: relative;
        width: 80px;
        height: 80px;
        background: #f8fafc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #cbd5e1;
          z-index: 2;
        }

        .ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          animation: ripple 3s infinite;
        }
      }

      h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 0.75rem 0 2rem;
        color: #94a3b8;
        font-size: 0.95rem;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;
      }

      .action-btn {
        border-radius: 12px;
        padding: 0.5rem 1.5rem;
        font-weight: 600;
      }
    }

    .agenda-card {
      background: linear-gradient(135deg, #ffffff 0%, #fcfdfd 100%);
    }

    .empty-agenda {
      padding: 2rem 1rem;
      text-align: center;
      border: 2px dashed #f1f5f9;
      border-radius: 20px;

      p {
        margin: 0;
        font-weight: 700;
        color: #475569;
        font-size: 0.9rem;
      }

      span {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }

    @keyframes ripple {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    @media (max-width: 1024px) {
      .content-layout { grid-template-columns: 1fr; }
      .dashboard-header {
        flex-direction: column;
        gap: 1.5rem;
      }
    }
  `]
})
export class DashboardHomePage {
  private readonly authFacade = inject(AuthFacade);
  
  userName = computed(() => this.authFacade.currentUser()?.nombre?.split(' ')[0] || 'Usuario');
  
  currentDate = new Intl.DateTimeFormat('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  stats = [
    { title: 'Activos', value: 12, icon: 'bolt', color: '#2563eb' },
    { title: 'En Revisión', value: 5, icon: 'visibility', color: '#f59e0b' },
    { title: 'Finalizados', value: 124, icon: 'done_all', color: '#10b981' },
  ];
}
