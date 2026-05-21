import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Component({
  selector: 'app-protocol-validation-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatTabsModule,
    RouterModule, 
    StatCardComponent
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Secretaría / Validación Documental</div>
          <h1 class="page-title">Validación Documental</h1>
          <p class="page-subtitle">Gestión y revisión técnica de protocolos ingresados al sistema</p>
        </div>
      </div>

      <div class="stats-grid mb-4">
        <app-stat-card label="Por Validar" [value]="pendingCount()" icon="pending_actions" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Observados" [value]="observedCount()" icon="assignment_late" color="#ef4444"></app-stat-card>
        <app-stat-card label="Validados Hoy" [value]="5" icon="task_alt" color="#10b981"></app-stat-card>
      </div>

      <div class="content-card shadow-soft">
        <mat-tab-group class="modern-tabs">
          <mat-tab label="Por Validar">
            <ng-template matTabContent>
              <div class="table-container">
                <ng-container *ngTemplateOutlet="protocolTable; context: { $implicit: pendingProtocols(), emptyMsg: 'No hay protocolos pendientes de revisión inicial.' }"></ng-container>
              </div>
            </ng-template>
          </mat-tab>
          <mat-tab label="Observados">
            <ng-template matTabContent>
              <div class="table-container">
                <ng-container *ngTemplateOutlet="protocolTable; context: { $implicit: observedProtocols(), emptyMsg: 'No se encontraron protocolos observados.' }"></ng-container>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>

    <ng-template #protocolTable let-data let-emptyMsg="emptyMsg">
      <div class="table-responsive">
        <table mat-table [dataSource]="data" class="modern-table">
          
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fecha Envío </th>
            <td mat-cell *matCellDef="let p"> 
              {{ p.submissionDate | date:'dd/MM/yyyy' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef> Información del Proyecto </th>
            <td mat-cell *matCellDef="let p"> 
              <div class="project-cell">
                <span class="technical-code">{{ p.code || 'POR ASIGNAR' }}</span>
                <span class="main-title" [matTooltip]="p.title">{{ p.title }}</span>
                <span class="investigator-info">{{ p.principalInvestigator || 'Investigador Principal' }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let p"> 
              <span class="type-badge" [ngClass]="p.studyTypeCode?.toLowerCase() || p.type?.toLowerCase()">
                {{ p.studyTypeCode || p.type }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let p"> 
              <span class="status-badge" [ngClass]="p.status?.toLowerCase()">
                {{ p.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-end"> Gestión </th>
            <td mat-cell *matCellDef="let p" class="text-end">
              <div class="d-flex justify-content-end gap-2">
                <button mat-stroked-button color="primary" class="review-btn" 
                        [routerLink]="['/dashboard/protocols/detail', p.id]"
                        matTooltip="Ver información detallada del protocolo">
                  <mat-icon>visibility</mat-icon>
                  Ver
                </button>
                <button mat-flat-button color="primary" class="review-btn" 
                        [routerLink]="['/dashboard/protocols/validation/detail', p.id]"
                        matTooltip="Iniciar validación de documentos técnicos">
                  <mat-icon>assignment_turned_in</mat-icon>
                  Validar
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center p-4" colspan="5">{{ emptyMsg }}</td>
          </tr>
        </table>
      </div>
    </ng-template>
  `,
  styles: [`
    .dashboard-page { padding: 1rem; }
    .breadcrumb-chip { background: rgba(0, 51, 102, 0.05); color: #003366; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: inline-block; margin-bottom: 0.5rem; }
    .page-title { font-size: 1.85rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 0.95rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
    .content-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
    .modern-tabs {
      ::ng-deep .mat-mdc-tab-header {
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
      }
    }
    .table-container { padding: 0; }
    .modern-table { width: 100%; th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 1.25rem 1rem; } td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; } }
    .project-cell { 
      display: flex; 
      flex-direction: column; 
      max-width: 450px;
      .technical-code { 
        font-size: 0.65rem; 
        font-weight: 800; 
        color: #003366; 
        background: rgba(0, 51, 102, 0.05); 
        padding: 2px 6px; 
        border-radius: 4px; 
        width: fit-content;
        margin-bottom: 4px;
      }
      .main-title { 
        font-weight: 700; 
        color: #1e293b; 
        font-size: 0.9rem; 
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      } 
      .investigator-info { color: #94a3b8; font-size: 0.75rem; } 
    }
    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      &.pendiente, &.submitted, &.presentado, &.en_revision_secretaria { background: #fff7ed; color: #f59e0b; }
      &.incompleto, &.pendiente_subsanacion, &.observado { background: #fef2f2; color: #ef4444; }
      &.completo, &.validado { background: #f0fdf4; color: #16a34a; }
    }
    .type-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; &.io { background: #eff6ff; color: #2563eb; } &.ec { background: #fff7ed; color: #f59e0b; } &.ei { background: #f0fdf4; color: #16a34a; } }
    .review-btn { border-radius: 10px; font-weight: 700; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationListPage implements OnInit {
  private protocolRepo = inject(IProtocolRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  displayedColumns = ['fecha', 'titulo', 'tipo', 'estado', 'acciones'];
  
  pendingProtocols = signal<ProtocolEntity[]>([]);
  observedProtocols = signal<ProtocolEntity[]>([]);
  
  pendingCount = signal(0);
  observedCount = signal(0);

  ngOnInit() {
    this.loadProtocols();

    this.notificationBroker.on('PROTOCOL_STATUS_UPDATED').subscribe(() => {
      this.loadProtocols();
    });
  }

  loadProtocols() {
    this.protocolRepo.getReceptionProtocols().subscribe({
      next: (res) => {
        console.log('[ProtocolValidationListPage] Datos recibidos del backend:', res);
        
        const protocols = Array.isArray(res) ? res : [];

        // Filtrar protocolos pendientes de revisión inicial (Incluye todos los estados iniciales)
        const pending = protocols.filter(p => {
          const s = String(p.status).toUpperCase();
          return s === 'EN_REVISION_SECRETARIA' || 
                 s === 'SUBMITTED' || 
                 s === 'PRESENTADO' || 
                 s === 'PENDIENTE' || 
                 s === 'DRAFT' || 
                 s === 'BORRADOR';
        });
        this.pendingProtocols.set(pending);
        this.pendingCount.set(pending.length);

        // Filtrar protocolos observados (Requieren corrección)
        const observed = protocols.filter(p => {
          const s = String(p.status).toUpperCase();
          return s === 'INCOMPLETO' || 
                 s === 'PENDIENTE_SUBSANACION' || 
                 s === 'OBSERVADO';
        });
        this.observedProtocols.set(observed);
        this.observedCount.set(observed.length);
      },
      error: (err) => {
        console.error('[ProtocolValidationListPage] Error cargando protocolos:', err);
        this.pendingProtocols.set([]);
        this.observedProtocols.set([]);
        this.pendingCount.set(0);
        this.observedCount.set(0);
      }
    });
  }
}
