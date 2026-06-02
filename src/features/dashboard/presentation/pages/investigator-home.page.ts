import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { DashboardFacade } from '../facades/dashboard.facade';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-investigator-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink, StatCardComponent, MatTooltipModule],
  template: `
    <div class="investigator-container animate-fade-in">
      
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

      <!-- Personal KPIs (Dinamizados) -->
      <section class="stats-grid">
        <app-stat-card label="Mis Protocolos" [value]="misProtocolosCount().toString()" icon="folder_special" color="#003366"></app-stat-card>
        <app-stat-card label="En Validación" [value]="pendingCount().toString()" icon="hourglass_empty" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Observados" [value]="observedCount().toString()" icon="error_outline" color="#ef4444"></app-stat-card>
        <app-stat-card label="Aprobados" [value]="approvedCount().toString()" icon="verified" color="#10b981"></app-stat-card>
      </section>

      <!-- Recent Activity / Guidance -->
      <div class="info-layout">
        <main class="activity-section">
          <div class="section-header mb-4">
            <h3>Trámites Recientes</h3>
          </div>
          
          <!-- Recent Procedures List -->
          <div class="recent-list" *ngIf="recentProtocols().length > 0">
            <div class="recent-item p-3 mb-3 rounded-3 d-flex justify-content-between align-items-center animate-slide-up" *ngFor="let p of recentProtocols()">
              <div class="d-flex align-items-center gap-3">
                <div class="status-indicator-bar" [ngClass]="p.estado?.toLowerCase() || 'pendiente'"></div>
                <div class="p-details">
                  <h4 class="p-code">{{ p.codigo || p.code || 'Borrador sin Código' }}</h4>
                  <p class="p-title text-truncate">{{ p.titulo || p.title }}</p>
                  <span class="p-date text-muted small">Última actualización: {{ (p.fechaActualizacion || p.fechaCreacion) | date:'dd/MM/yyyy, h:mm a' }}</span>
                </div>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="p-status-badge" [ngClass]="p.estado?.toLowerCase() || 'pendiente'">
                  {{ getFriendlyStatusLabel(p.estado || p.status) }}
                </span>
                <button mat-icon-button color="primary" [routerLink]="['/dashboard/protocols/detail', p.id]" matTooltip="Ver Detalles">
                  <mat-icon>visibility</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="recentProtocols().length === 0">
            <mat-icon>history</mat-icon>
            <p>No tiene trámites recientes. Inicie uno nuevo para comenzar.</p>
          </div>
        </main>

        <aside class="guidance-section">
          <div class="guidance-card shadow-soft">
            <mat-icon class="info-icon">lightbulb</mat-icon>
            <h4>Guía Rápida CEISH</h4>
            <ul>
              <li>Asegúrese de subir su Hoja de Vida (CV) académica en "Mi Perfil" en formato PDF.</li>
              <li>El Consentimiento debe seguir los lineamientos y anexos oficiales del comité.</li>
              <li>Valide que todos los documentos cargados sean legibles y en formato PDF.</li>
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
        background-color: #003366 !important;
        color: white !important;
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

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .recent-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      &:hover {
        border-color: #cbd5e1;
        background: #f1f5f9;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
    }

    .status-indicator-bar {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      background: #cbd5e1;
      &.requiere_correccion, &.observado { background: #ef4444; }
      &.aprobado_definitivo, &.aprobado_condicionado, &.aprobado { background: #10b981; }
      &.creado, &.pendiente { background: #64748b; }
      &.en_evaluacion, &.en_revision { background: #f59e0b; }
    }

    .p-details {
      display: flex;
      flex-direction: column;
      .p-code {
        font-size: 0.9rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }
      .p-title {
        font-size: 0.85rem;
        color: #475569;
        margin: 2px 0;
        max-width: 420px;
      }
      .p-date {
        font-size: 0.75rem;
      }
    }

    .p-status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #e2e8f0;
      color: #475569;
      
      &.requiere_correccion, &.observado { background: #fef2f2; color: #ef4444; }
      &.aprobado_definitivo, &.aprobado_condicionado, &.aprobado { background: #ecfdf5; color: #10b981; }
      &.creado, &.pendiente { background: #f1f5f9; color: #64748b; }
      &.en_evaluacion, &.en_revision { background: #fffbeb; color: #f59e0b; }
    }

    .guidance-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 2rem;
      border-radius: 20px;
      color: #166534;
      
      .info-icon { margin-bottom: 1rem; color: #10b981; }
      h4 { margin: 0 0 1rem; font-weight: 800; }
      ul { padding-left: 1.25rem; margin-bottom: 1.5rem; }
      li { margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 600; }
      .help-btn { background: white; color: #166534; border-radius: 10px; font-weight: 700; width: 100%; border: 1px solid #cbd5e1; }
    }

    @media (max-width: 1024px) {
      .info-layout { grid-template-columns: 1fr; }
      .welcome-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
    }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-slide-up { animation: slideUp 0.3s ease-out; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InvestigatorHomePage implements OnInit {
  private authFacade = inject(AuthFacade);
  private dashboardFacade = inject(DashboardFacade);

  firstName = computed(() => this.authFacade.currentUser()?.nombre.split(' ')[0] || 'Investigador');
  
  misProtocolosCount = computed(() => this.dashboardFacade.myProtocols()?.length || 0);
  observedCount = computed(() => this.dashboardFacade.myObservedCount());
  approvedCount = computed(() => this.dashboardFacade.myApprovedCount());
  pendingCount = computed(() => {
    const protocols = this.dashboardFacade.myProtocols() || [];
    return protocols.filter((p: any) => !['REQUIERE_CORRECCION', 'APROBADO_DEFINITIVO', 'APROBADO_CONDICIONADO'].includes(p.estado)).length;
  });

  recentProtocols = computed(() => {
    const protocols = this.dashboardFacade.myProtocols() || [];
    return [...protocols]
      .sort((a, b) => {
        const dateA = a.fechaActualizacion ? new Date(a.fechaActualizacion).getTime() : 0;
        const dateB = b.fechaActualizacion ? new Date(b.fechaActualizacion).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  });

  ngOnInit() {
    this.dashboardFacade.loadStats();
  }

  getFriendlyStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'CREADO': 'Borrador',
      'PENDIENTE': 'Pendiente',
      'REQUIERE_CORRECCION': 'Observado',
      'APROBADO_DEFINITIVO': 'Aprobado Definitivo',
      'APROBADO_CONDICIONADO': 'Aprobado Condicionado',
      'EN_EVALUACION': 'En Evaluación',
      'EN_REVISION_SECRETARIA': 'Revisión Técnica',
      'SUBMITTED': 'Sometido'
    };
    return labels[status?.toUpperCase()] || 'Borrador';
  }
}
