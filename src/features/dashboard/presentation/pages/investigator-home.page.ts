import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Component({
  selector: 'app-investigator-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink, StatCardComponent],
  template: `
    <div class="investigator-container">
      
      <!-- Welcome Section -->
      <header class="welcome-header">
        <div class="text">
          <h1>¡Hola, {{ firstName() }}! 👋</h1>
          <p>Bienvenido a su portal de investigación. Gestione sus protocolos y seguimiento ético.</p>
        </div>
        <button mat-raised-button color="primary" class="new-protocol-btn" routerLink="/dashboard/protocols/new">
          <mat-icon>add</mat-icon>
          Nuevo Protocolo
        </button>
      </header>

      <!-- Personal KPIs -->
      <section class="stats-grid">
        <app-stat-card label="Mis Protocolos" value="3" icon="folder_special" color="#003366"></app-stat-card>
        <app-stat-card label="En Validación" value="1" icon="hourglass_empty" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Observados" value="0" icon="error_outline" color="#ef4444"></app-stat-card>
        <app-stat-card label="Aprobados" value="2" icon="verified" color="#4DB6AC"></app-stat-card>
      </section>

      <!-- Recent Activity / Guidance -->
      <div class="info-layout">
        <main class="activity-section">
          <div class="section-header">
            <h3>Trámites Recientes</h3>
          </div>
          <div class="empty-state">
            <mat-icon>history</mat-icon>
            <p>No tiene trámites recientes. Inicie uno nuevo para comenzar.</p>
          </div>
        </main>

        <aside class="guidance-section">
          <div class="guidance-card">
            <mat-icon class="info-icon">lightbulb</mat-icon>
            <h4>Guía Rápida PET 2023</h4>
            <ul>
              <li>Asegúrese de que el CV esté actualizado.</li>
              <li>El Consentimiento debe seguir el Anexo 4.</li>
              <li>Peso máximo por archivo: 100MB.</li>
            </ul>
            <button mat-button class="help-btn">Ver Manual Completo</button>
          </div>
        </aside>
      </div>

    </div>
  `,
  styles: [`
    .investigator-container { animation: fadeIn 0.5s ease-out; }

    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      
      h1 { margin: 0; font-size: 2rem; font-weight: 800; color: #003366; letter-spacing: -1px; }
      p { margin: 0.5rem 0 0; color: #64748b; font-weight: 500; }
      
      .new-protocol-btn {
        height: 54px;
        padding: 0 2rem;
        border-radius: 14px;
        font-weight: 700;
        font-size: 1rem;
        background-color: #003366;
        box-shadow: 0 10px 20px rgba(0, 51, 102, 0.15);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .info-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2.5rem;
    }

    .activity-section {
      background: #ffffff;
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid #e2e8f0;
      min-height: 300px;
      
      .section-header h3 { margin: 0; font-weight: 800; color: #003366; }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #94a3b8;
        padding: 4rem 0;
        mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }
      }
    }

    .guidance-card {
      background: #e0f2f1;
      padding: 2rem;
      border-radius: 20px;
      color: #004d40;
      
      .info-icon { margin-bottom: 1rem; color: #00796b; }
      h4 { margin: 0 0 1rem; font-weight: 800; }
      ul { padding-left: 1.25rem; margin-bottom: 1.5rem; }
      li { margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 500; }
      .help-btn { background: white; color: #00796b; border-radius: 10px; font-weight: 700; width: 100%; }
    }

    @media (max-width: 1024px) {
      .info-layout { grid-template-columns: 1fr; }
      .welcome-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InvestigatorHomePage {
  private authFacade = inject(AuthFacade);
  
  firstName = computed(() => this.authFacade.currentUser()?.nombre.split(' ')[0] || 'Investigador');
}
