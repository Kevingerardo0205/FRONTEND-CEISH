import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloResumen } from '../../../domain/dtos/crear-protocolo.dto';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Component({
  selector: 'app-mis-protocolos',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, 
    MatIconModule, RouterModule, MatTooltipModule, 
    MatMenuModule, MatDividerModule, MatProgressBarModule
  ],
  template: `
    <div class="premium-viewport animate-fade-in">
      <!-- 1. Header de Sección Estilizado -->
      <header class="section-header">
        <div class="header-content">
          <div class="badge-accent">INVESTIGADOR</div>
          <h1 class="header-title">Mis Investigaciones</h1>
          <p class="header-subtitle">Monitorea el progreso y ciclo de vida de tus protocolos éticos</p>
        </div>
        <button mat-flat-button color="primary" class="create-btn" routerLink="/dashboard/investigador/nuevo-protocolo">
          <mat-icon>add_circle</mat-icon>
          Nuevo Protocolo
        </button>
      </header>

      <!-- 2. Grid de Gestión: De Tabla a Tarjetas Inteligentes -->
      <div class="management-grid" *ngIf="protocolos().length > 0; else emptyState">
        <div class="protocol-card" *ngFor="let p of protocolos()" [attr.data-status]="p.estado">
          <div class="card-glow"></div>
          
          <div class="card-header">
            <span class="protocol-id">{{ p.codigoCeish || 'TRÁMITE' }}</span>
            <div class="status-chip" [ngClass]="getStatusClass(p.estado)">
              <span class="dot"></span>
              {{ formatStatus(p.estado) }}
            </div>
          </div>

          <!-- BADGE LLAMATIVO DE ACEPTACIÓN DE TIEMPOS -->
          <div class="timeline-warning-badge animate-pulse-amber" *ngIf="p.estado === 'COMPLETO' && !p.isTimelineTermsAccepted">
            <mat-icon>warning</mat-icon>
            <span>Pendiente Aceptación de Tiempos</span>
          </div>

          <div class="card-body">
            <h3 class="protocol-title" [matTooltip]="p.titulo">{{ p.titulo }}</h3>
            <div class="meta-info">
              <div class="meta-item">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ p.fechaCreacion | date:'dd MMM, yyyy' }}</span>
              </div>
              <div class="meta-item">
                <mat-icon>category</mat-icon>
                <span>{{ p.tipoEstudio || 'No definido' }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button mat-flat-button class="workspace-btn" [routerLink]="['/dashboard/protocols/workspace', p.id, 'info']">
              <mat-icon>launch</mat-icon>
              Gestionar
            </button>
            <button mat-icon-button [matMenuTriggerFor]="menu" class="options-btn">
              <mat-icon>more_vert</mat-icon>
            </button>
            
            <mat-menu #menu="matMenu" class="premium-menu">
              <button mat-menu-item *ngIf="p.estado === 'REQUIERE_CORRECCION'">
                <mat-icon>edit_note</mat-icon>
                <span>Subir Correcciones</span>
              </button>
              <button mat-menu-item *ngIf="p.estado === 'APROBADO_DEFINITIVO'">
                <mat-icon>history_edu</mat-icon>
                <span>Solicitar Enmienda</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item>
                <mat-icon>file_download</mat-icon>
                <span>Descargar Acta</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </div>

      <!-- 3. Empty State Premium -->
      <ng-template #emptyState>
        <div class="empty-placeholder">
          <div class="art-container">
            <mat-icon>science</mat-icon>
            <div class="pulse-ring"></div>
          </div>
          <h2>Listo para investigar</h2>
          <p>Aún no has registrado ningún protocolo. Tu trayectoria científica comienza con el primer registro.</p>
          <button mat-stroked-button color="primary" routerLink="/dashboard/investigador/nuevo-protocolo">
            Comenzar Registro
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .premium-viewport { padding: 2.5rem; max-width: 1600px; margin: 0 auto; }

    .section-header { 
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem;
      .badge-accent { font-size: 0.65rem; font-weight: 800; color: #3b82f6; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
      .header-title { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
      .header-subtitle { color: #64748b; margin: 0.5rem 0 0; font-size: 1.1rem; }
      .create-btn { height: 52px; border-radius: 14px; padding: 0 1.75rem; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2); }
    }

    .management-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem;
    }

    .protocol-card {
      background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 1.5rem;
      position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex; flex-direction: column; gap: 1.25rem;
      
      &:hover { 
        transform: translateY(-5px); border-color: #3b82f6; 
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02);
        .card-glow { opacity: 1; }
      }

      .card-glow { 
        position: absolute; top: 0; right: 0; width: 150px; height: 150px; 
        background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);
        opacity: 0; transition: opacity 0.3s ease;
      }
    }

    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      .protocol-id { font-family: 'Fira Code', monospace; font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
      .status-chip { 
        display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 700;
        &.approved { background: #ecfdf5; color: #065f46; .dot { background: #10b981; } }
        &.review { background: #eff6ff; color: #1e40af; .dot { background: #3b82f6; } }
        &.correction { background: #fef2f2; color: #991b1b; .dot { background: #ef4444; } }
        &.pending { background: #f8fafc; color: #64748b; .dot { background: #94a3b8; } }
      }
    }

    .timeline-warning-badge {
      display: flex; align-items: center; gap: 6px; padding: 8px 12px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1.5px solid #f59e0b; border-radius: 12px;
      color: #b45309; font-size: 0.75rem; font-weight: 700;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.05);
      
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #d97706; }
    }

    .animate-pulse-amber {
      animation: pulseAmber 2.5s infinite;
    }

    @keyframes pulseAmber {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3); }
      70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }

    .protocol-title { 
      margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3.1rem;
    }

    .meta-info {
      display: flex; gap: 1rem;
      .meta-item { 
        display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 0.8rem; font-weight: 500;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #cbd5e1; }
      }
    }

    .card-footer {
      display: flex; gap: 0.75rem; margin-top: auto;
      .workspace-btn { 
        flex: 1; height: 44px; border-radius: 10px; background: #f1f5f9; color: #1e293b; font-weight: 700;
        &:hover { background: #0f172a; color: white; }
      }
      .options-btn { color: #94a3b8; }
    }

    .empty-placeholder {
      padding: 6rem 2rem; text-align: center; background: white; border-radius: 32px; border: 2px dashed #e2e8f0;
      .art-container {
        position: relative; width: 100px; height: 100px; background: #f1f5f9; border-radius: 30px;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;
        mat-icon { font-size: 48px; width: 48px; height: 48px; color: #3b82f6; z-index: 2; }
        .pulse-ring { 
          position: absolute; width: 100%; height: 100%; border: 2px solid #3b82f6; border-radius: 30px;
          animation: pulse 2s infinite; 
        }
      }
      h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
      p { color: #64748b; max-width: 400px; margin: 0 auto 2.5rem; line-height: 1.6; }
    }

    @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MisProtocolosPage implements OnInit {
  private readonly protocoloService = inject(ProtocoloService);
  private readonly notificationBroker = inject(NotificationBrokerService);
  
  protocolos = signal<ProtocoloResumen[]>([]);

  ngOnInit(): void {
    this.loadProtocolos();
    this.notificationBroker.on('PROTOCOL_STATUS_UPDATED').subscribe(() => this.loadProtocolos());
  }

  loadProtocolos() {
    this.protocoloService.misProtocolos().subscribe(data => {
      this.protocolos.set(data);
    });
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'APROBADO_DEFINITIVO': case 'APROBADO_CONDICIONADO': return 'approved';
      case 'EN_REVISION_DOCUMENTAL': case 'EN_REVISION_SECRETARIA': case 'EN_EVALUACION': return 'review';
      case 'REQUIERE_CORRECCION': case 'NO_APROBADO': return 'correction';
      case 'COMPLETO': return 'pending';
      default: return 'pending';
    }
  }

  formatStatus(estado: string): string {
    if (!estado) return 'Desconocido';
    if (estado === 'EN_REVISION_SECRETARIA') return 'Revisión Secretaría';
    if (estado === 'COMPLETO') return 'Validado / Pendiente Firma';
    return estado.replace(/_/g, ' ');
  }
}
