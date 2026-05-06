import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    ProtocolCodePipe,
    StatCardComponent
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Header Seccion -->
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Evaluador / Mis Evaluaciones</div>
          <h1 class="page-title">Bandeja de Evaluaciones</h1>
          <p class="page-subtitle">Gestione los protocolos asignados para su revisión técnica y ética</p>
        </div>
        <div class="header-actions">
           <button mat-stroked-button color="primary" class="refresh-btn shadow-sm" (click)="loadEvaluations()">
             <mat-icon>refresh</mat-icon>
             Actualizar Bandeja
           </button>
        </div>
      </div>

      <!-- Métricas Rápidas -->
      <div class="stats-grid mb-4">
        <app-stat-card label="Pendientes" [value]="pendingCount()" icon="rate_review" color="#2563eb"></app-stat-card>
        <app-stat-card label="Por Vencer (Alertas)" [value]="urgentCount()" icon="timer" color="#ef4444"></app-stat-card>
        <app-stat-card label="Completadas" [value]="12" icon="task_alt" color="#10b981"></app-stat-card>
        <app-stat-card label="Promedio Resolución" value="8 días" icon="speed" color="#6366f1"></app-stat-card>
      </div>

      <!-- Alerta Crítica si hay plazos por vencer -->
      <div class="alert-banner critical mb-4 animate-shake" *ngIf="urgentCount() > 0">
        <mat-icon>warning</mat-icon>
        <div class="alert-content">
          <strong>¡ATENCIÓN EVALUADOR!</strong>
          <span>Tiene {{ urgentCount() }} protocolos con el plazo por vencer (menos de 2 días). Priorice estas revisiones.</span>
        </div>
      </div>

      <!-- Lista de Evaluaciones -->
      <div class="content-card shadow-soft">
        <div class="table-toolbar p-3 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <h2 class="section-title m-0">Protocolos por Evaluar</h2>
            <span class="badge-count">{{ evaluations().length }}</span>
          </div>
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Buscar por título, código o investigador...">
          </div>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="evaluations()" class="modern-table">
            
            <ng-container matColumnDef="protocol">
              <th mat-header-cell *matHeaderCellDef> Información del Protocolo </th>
              <td mat-cell *matCellDef="let ev">
                <div class="protocol-info-cell">
                  <div class="code-wrapper">
                    <span class="code">{{ ev.protocolCode | protocolCode }}</span>
                    <span class="type-tag" [ngClass]="ev.protocolType?.toLowerCase()">{{ ev.protocolType }}</span>
                  </div>
                  <span class="title" [matTooltip]="ev.protocolTitle">{{ ev.protocolTitle }}</span>
                  <div class="investigator-info">
                    <mat-icon>person</mat-icon>
                    <span>PI: {{ ev.investigator }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="deadline">
              <th mat-header-cell *matHeaderCellDef> Tiempo Restante </th>
              <td mat-cell *matCellDef="let ev">
                <div class="sla-cell" [ngClass]="getSLAStatus(ev.deadline)">
                  <div class="days-remaining">
                    <span class="value">{{ getDaysLeft(ev.deadline) }}</span>
                    <span class="label">días</span>
                  </div>
                  <div class="deadline-detail">
                    <mat-icon>{{ getSLAIcon(ev.deadline) }}</mat-icon>
                    <span>{{ ev.deadline | date:'dd MMM, yyyy' }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let ev">
                <div class="status-indicator" [ngClass]="ev.status.toLowerCase()">
                  <span class="dot"></span>
                  <span class="text">{{ ev.status === 'PENDING' ? 'Pendiente' : 'En Proceso' }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-end"> Acciones </th>
              <td mat-cell *matCellDef="let ev" class="text-end">
                <div class="actions-wrapper">
                  <button mat-flat-button color="primary" class="eval-btn shadow-sm" [routerLink]="['/dashboard/evaluations/form', ev.id]">
                    <mat-icon>gavel</mat-icon>
                    Iniciar Informe
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1.5rem; }

    .breadcrumb-chip {
      background: rgba(0, 51, 102, 0.05);
      color: #003366;
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: inline-block;
      margin-bottom: 0.75rem;
    }

    .page-title { font-size: 2.25rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }
    .page-subtitle { color: #64748b; font-size: 1.1rem; margin-top: 4px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px;
      &.critical { background: #fee2e2; border: 1.5px solid #ef4444; color: #b91c1c; 
        mat-icon { color: #ef4444; font-size: 32px; width: 32px; height: 32px; }
      }
      .alert-content { display: flex; flex-direction: column; strong { font-size: 1rem; } span { font-size: 0.9rem; font-weight: 500; } }
    }

    .content-card {
      background: white; border-radius: 28px; border: 1px solid #f1f5f9; overflow: hidden; transition: all 0.3s ease;
    }

    .table-toolbar {
      border-bottom: 1px solid #f1f5f9; background: #ffffff; padding: 1.5rem !important;
      .section-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
      .badge-count { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; }
    }

    .search-box {
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 8px 16px; display: flex; align-items: center; gap: 12px; width: 350px;
      input { border: none; background: transparent; outline: none; font-size: 0.9rem; width: 100%; color: #1e293b; font-weight: 500; }
    }

    .modern-table {
      width: 100%;
      th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 1.25rem 1.5rem; }
      td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .protocol-info-cell {
      display: flex; flex-direction: column; gap: 6px; max-width: 500px;
      .code-wrapper { display: flex; align-items: center; gap: 8px; .code { font-weight: 800; color: #003366; font-size: 0.8rem; }
        .type-tag { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;
          &.ei { background: #fee2e2; color: #b91c1c; } &.ec { background: #dcfce7; color: #15803d; } &.io { background: #e0f2fe; color: #0369a1; }
        }
      }
      .title { font-weight: 700; color: #1e293b; font-size: 0.95rem; line-height: 1.4; }
      .investigator-info { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.8rem; }
    }

    .sla-cell {
      display: flex; flex-direction: column; gap: 4px;
      .days-remaining { display: flex; align-items: baseline; gap: 2px; .value { font-size: 1.25rem; font-weight: 800; } .label { font-size: 0.7rem; font-weight: 700; } }
      &.critical { color: #ef4444; } &.warning { color: #f59e0b; } &.safe { color: #10b981; }
    }

    .status-indicator {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;
      &.pending { background: #eff6ff; color: #1e40af; .dot { background: #3b82f6; } }
      &.in_progress { background: #fff7ed; color: #9a3412; .dot { background: #f59e0b; } }
      .dot { width: 8px; height: 8px; border-radius: 50%; }
    }

    .eval-btn { border-radius: 14px; font-weight: 700; padding: 0 20px; height: 44px; }

    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
    .animate-shake { animation: shake 0.5s ease-in-out; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EvaluationListPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private evaluationRepo = inject(IEvaluationRepositoryPort);

  displayedColumns = ['protocol', 'deadline', 'status', 'actions'];
  evaluations = signal<any[]>([]);
  
  pendingCount = computed(() => this.evaluations().filter(e => e.status === 'PENDING').length);
  urgentCount = computed(() => this.evaluations().filter(e => this.getDaysLeft(e.deadline) <= 2).length);

  ngOnInit() {
    this.loadEvaluations();
  }

  loadEvaluations() {
    const user = this.authFacade.currentUser();
    if (!user) return;

    // Usamos el ID del evaluador (en mock será eval-123 para las pruebas)
    this.evaluationRepo.getByEvaluatorId('eval-123').subscribe(data => {
      this.evaluations.set(data);
    });
  }

  getDaysLeft(deadline: Date): number {
    const today = new Date();
    const diff = new Date(deadline).getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getSLAStatus(deadline: Date): string {
    const days = this.getDaysLeft(deadline);
    if (days <= 2) return 'critical';
    if (days <= 5) return 'warning';
    return 'safe';
  }

  getSLAIcon(deadline: Date): string {
    const days = this.getDaysLeft(deadline);
    if (days <= 2) return 'priority_high';
    if (days <= 5) return 'history';
    return 'event_available';
  }
}
