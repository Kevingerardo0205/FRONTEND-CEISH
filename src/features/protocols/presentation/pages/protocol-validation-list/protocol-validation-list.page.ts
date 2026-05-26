import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Component({
  selector: 'app-protocol-validation-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatTabsModule,
    RouterModule, 
    StatCardComponent
  ],
  template: `
    <div class="premium-viewport animate-fade-in">
      <!-- 1. Header de Gestión con Estadísticas de Alto Nivel -->
      <header class="page-header">
        <div class="header-main">
          <div class="identity">
            <div class="badge-chip">SECRETARÍA CEISH</div>
            <h1 class="page-title">Validación Documental</h1>
            <p class="page-subtitle">Revisión técnica de requisitos según normativa PET 2023</p>
          </div>
          
          <div class="quick-stats">
            <app-stat-card label="Por Validar" [value]="pendingCount()" icon="pending_actions" color="#f59e0b"></app-stat-card>
            <app-stat-card label="Observados" [value]="observedCount()" icon="assignment_late" color="#ef4444"></app-stat-card>
          </div>
        </div>
      </header>

      <!-- 2. Orquestador de Bandejas (Tabs) -->
      <div class="tabs-scaffold">
        <mat-tab-group class="premium-tabs" animationDuration="0ms">
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">fact_check</mat-icon>
              <span>Pendientes ({{ pendingCount() }})</span>
            </ng-template>
            <ng-template matTabContent>
              <div class="protocol-grid">
                <ng-container *ngFor="let p of pendingProtocols()">
                  <ng-container *ngTemplateOutlet="protocolCard; context: { $implicit: p }"></ng-container>
                </ng-container>
                <div *ngIf="pendingProtocols().length === 0" class="empty-tray">
                  <mat-icon>task</mat-icon>
                  <p>Bandeja de entrada vacía. No hay trámites pendientes de revisión inicial.</p>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">feedback</mat-icon>
              <span>Observados ({{ observedCount() }})</span>
            </ng-template>
            <ng-template matTabContent>
              <div class="protocol-grid">
                <ng-container *ngFor="let p of observedProtocols()">
                  <ng-container *ngTemplateOutlet="protocolCard; context: { $implicit: p }"></ng-container>
                </ng-container>
                <div *ngIf="observedProtocols().length === 0" class="empty-tray">
                  <mat-icon>rule_folder</mat-icon>
                  <p>No se encontraron protocolos con observaciones pendientes.</p>
                </div>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- 3. Template de Tarjeta de Protocolo -->
      <ng-template #protocolCard let-p>
        <div class="p-card" [attr.data-status]="p.status">
          <div class="p-card-header">
            <span class="p-id">{{ p.code || 'SIN CÓDIGO' }}</span>
            <span class="p-date">{{ p.submissionDate | date:'dd MMM, yyyy' }}</span>
          </div>
          
          <div class="p-card-body">
            <h3 class="p-title" [matTooltip]="p.title">{{ p.title }}</h3>
            <div class="p-owner">
              <mat-icon>person</mat-icon>
              <span>{{ p.principalInvestigator || 'Investigador Principal' }}</span>
            </div>
            <div class="p-meta">
              <span class="type-tag" [ngClass]="p.studyTypeCode?.toLowerCase() || p.type?.toLowerCase()">
                {{ p.studyTypeCode || p.type }}
              </span>
              <span class="status-tag" [ngClass]="p.status?.toLowerCase()">
                {{ p.status }}
              </span>
            </div>
          </div>

          <div class="p-card-actions">
            <button mat-stroked-button class="btn-workspace" [routerLink]="['/dashboard/protocols/workspace', p.id, 'info']">
              <mat-icon>visibility</mat-icon>
              Ver Info
            </button>
            <button mat-flat-button color="primary" class="btn-validate" [routerLink]="['/dashboard/protocols/workspace', p.id, 'validation']">
              <mat-icon>verified_user</mat-icon>
              Validar
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .premium-viewport { padding: 2rem 2.5rem; max-width: 1600px; margin: 0 auto; }

    .page-header { margin-bottom: 2.5rem; }
    .header-main { display: flex; justify-content: space-between; align-items: center; }
    .badge-chip { font-size: 0.65rem; font-weight: 800; color: #f59e0b; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { color: #64748b; margin: 0.25rem 0 0; font-size: 1rem; }
    .quick-stats { display: flex; gap: 1.5rem; }

    .tabs-scaffold { background: white; border-radius: 24px; padding: 1rem; border: 1px solid #e2e8f0; min-height: 60vh; }
    .premium-tabs {
      ::ng-deep .mat-mdc-tab-label-container { border-bottom: 1px solid #f1f5f9; margin-bottom: 2rem; }
      .tab-icon { margin-right: 8px; font-size: 20px; width: 20px; height: 20px; }
    }

    .protocol-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; padding: 0.5rem; }

    .p-card {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1.25rem; transition: all 0.2s ease;
      &:hover { background: white; transform: translateY(-3px); border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    }

    .p-card-header { display: flex; justify-content: space-between; .p-id { font-weight: 800; color: #003366; font-size: 0.75rem; } .p-date { font-size: 0.75rem; color: #94a3b8; } }
    .p-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e293b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.9rem; }
    .p-owner { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.8rem; mat-icon { font-size: 16px; width: 16px; height: 16px; color: #cbd5e1; } }
    .p-meta { display: flex; gap: 0.75rem; 
      .type-tag { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; background: #e2e8f0; color: #475569; }
      .status-tag { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; background: #fff7ed; color: #c2410c; }
    }

    .p-card-actions { display: flex; gap: 0.75rem; 
      .btn-workspace { flex: 1; border-radius: 12px; font-weight: 700; color: #64748b; }
      .btn-validate { flex: 1.5; border-radius: 12px; font-weight: 700; }
    }

    .empty-tray { grid-column: 1 / -1; padding: 5rem; text-align: center; color: #94a3b8; mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; } }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationListPage implements OnInit {
  private protocolRepo = inject(IProtocolRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  pendingProtocols = signal<ProtocolEntity[]>([]);
  observedProtocols = signal<ProtocolEntity[]>([]);
  
  pendingCount = computed(() => this.pendingProtocols().length);
  observedCount = computed(() => this.observedProtocols().length);

  ngOnInit() {
    this.loadProtocols();
    this.notificationBroker.on('PROTOCOL_STATUS_UPDATED').subscribe(() => this.loadProtocols());
  }

  loadProtocols() {
    this.protocolRepo.getReceptionProtocols().subscribe({
      next: (res) => {
        const protocols = Array.isArray(res) ? res : [];
        this.pendingProtocols.set(protocols.filter(p => ['SUBMITTED', 'PRESENTADO', 'PENDIENTE', 'EN_REVISION_SECRETARIA'].includes(String(p.status).toUpperCase())));
        this.observedProtocols.set(protocols.filter(p => ['INCOMPLETO', 'PENDIENTE_SUBSANACION', 'OBSERVADO'].includes(String(p.status).toUpperCase())));
      }
    });
  }
}
