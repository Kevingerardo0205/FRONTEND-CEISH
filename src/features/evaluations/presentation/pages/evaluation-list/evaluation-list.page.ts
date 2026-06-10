import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { GetMyAssignmentsUseCase } from '../../../application/get-my-assignments.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PeerAssignmentEntity } from '@domain/entities/peer-evaluation.entity';

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
    MatSnackBarModule,
    ProtocolCodePipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-layout animate-fade-in">
      <header class="view-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="view-title">Gestión de Evaluaciones</h1>
            <p class="view-description">Administre sus dictámenes éticos y análisis de riesgo asignados.</p>
          </div>
          <div class="dashboard-stats">
            <div class="stat-box">
              <span class="stat-label">Pendientes</span>
              <span class="stat-value">{{ items().length }}</span>
            </div>
            <div class="stat-box accent" [class.pulse]="urgentCount() > 0">
              <span class="stat-label">Urgentes</span>
              <span class="stat-value">{{ urgentCount() }}</span>
            </div>
          </div>
        </div>
      </header>

      <main class="view-body">
        <!-- Section 1: Traditional Evaluation Assignments -->
        <section class="assignment-card shadow-sm">
          <div class="card-header">
            <div class="section-badge primary">
              <mat-icon>gavel</mat-icon>
              <span>Dictámenes Éticos</span>
            </div>
          </div>

          <div class="table-container">
            <table mat-table [dataSource]="items()" class="pro-table">
              
              <ng-container matColumnDef="protocol">
                <th mat-header-cell *matHeaderCellDef> Protocolo / Investigador </th>
                <td mat-cell *matCellDef="let item">
                  <div class="protocol-cell">
                    <span class="ceish-tag">{{ item.protocolCode | protocolCode }}</span>
                    <span class="protocol-name" [matTooltip]="item.protocolTitle">{{ item.protocolTitle }}</span>
                    <span class="investigator-name">
                      <mat-icon>person</mat-icon> {{ item.investigator }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="annex">
                <th mat-header-cell *matHeaderCellDef> Instrumento </th>
                <td mat-cell *matCellDef="let item">
                  <span class="instrument-badge" 
                        [class.type-9]="item.annexToUse === 'ANEXO_9'"
                        [class.type-10]="item.annexToUse === 'ANEXO_10'"
                        [class.type-11]="item.annexToUse === 'ANEXO_11'">
                    {{ item.annexToUse?.replace('_', ' ') || 'ANEXO' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="deadline">
                <th mat-header-cell *matHeaderCellDef> Plazo </th>
                <td mat-cell *matCellDef="let item">
                  <div class="date-chip" [class.urgent]="item.isUrgent">
                    <span class="date">{{ item.deadline | date:'dd MMM, yyyy' }}</span>
                    @if (item.daysRemaining !== undefined) {
                      <span class="badge-mini">
                        <mat-icon>{{ item.isUrgent ? 'alarm' : 'schedule' }}</mat-icon>
                        {{ item.daysRemaining }}d
                      </span>
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="text-end"> </th>
                <td mat-cell *matCellDef="let item" class="text-end">
                  <button mat-flat-button color="primary" class="pro-btn" [routerLink]="['/dashboard/evaluations/evaluate', item.id]" [aria-label]="'Realizar dictamen ético del protocolo ' + item.protocolCode">
                    <mat-icon>edit_note</mat-icon> Evaluar
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.urgent-row]="row.isUrgent"></tr>
            </table>
            
            @if (items().length === 0) {
              <div class="empty-placeholder">
                <mat-icon>inbox</mat-icon>
                <p>No tiene evaluaciones de dictamen asignadas.</p>
              </div>
            }
          </div>
        </section>

        <!-- Section 2: Peer Risk Assignments (PET 4.2.1) -->
        @if (peerRiskAssignments().length > 0) {
          <section class="assignment-card shadow-sm risk-section">
            <div class="card-header">
              <div class="section-badge accent">
                <mat-icon>security</mat-icon>
                <span>Análisis de Riesgo (PET 4.2.1)</span>
              </div>
            </div>

            <div class="table-container">
              <table mat-table [dataSource]="peerRiskAssignments()" class="pro-table">
                
                <ng-container matColumnDef="protocol">
                  <th mat-header-cell *matHeaderCellDef> Protocolo / Investigador </th>
                  <td mat-cell *matCellDef="let item">
                    <div class="protocol-cell">
                      <span class="ceish-tag risk">{{ item.protocol.ceishCode || 'S/C' }}</span>
                      <span class="protocol-name" [matTooltip]="item.protocol.title">{{ item.protocol.title }}</span>
                      <span class="investigator-name">
                        <mat-icon>person</mat-icon>
                        {{ item.protocol.principalInvestigatorRecord?.fullName || item.protocol.principalInvestigator?.fullName }}
                      </span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="studyType">
                  <th mat-header-cell *matHeaderCellDef> Tipo de Estudio </th>
                  <td mat-cell *matCellDef="let item">
                    <span class="study-pill">
                      {{ item.protocol.studyType?.nombre || item.protocol.studyType?.name }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="assignedAt">
                  <th mat-header-cell *matHeaderCellDef> Asignado </th>
                  <td mat-cell *matCellDef="let item">
                    <div class="date-chip">
                      <span class="date">{{ item.assignedAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="text-end"> </th>
                  <td mat-cell *matCellDef="let item" class="text-end">
                    <button mat-flat-button color="accent" class="pro-btn" [routerLink]="['/dashboard/evaluations/evaluate-risk', item.id]" [aria-label]="'Realizar análisis de riesgo del protocolo ' + item.protocol.ceishCode">
                      <mat-icon>security</mat-icon> Analizar
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="riskDisplayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: riskDisplayedColumns;"></tr>
              </table>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: `
    :host { 
      display: block; 
      --primary: #003366; 
      --accent: #ea580c; 
      --bg-light: #f8fafc;
      --border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }

    .page-layout { padding: 2rem; max-width: 1400px; margin: 0 auto; }

    /* Header Styles */
    .view-header { margin-bottom: 2.5rem; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; }
    .view-title { font-size: 2rem; font-weight: 900; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
    .view-description { color: var(--text-muted); font-size: 1rem; margin-top: 0.5rem; font-weight: 500; }

    .dashboard-stats { display: flex; gap: 1rem; }
    .stat-box { 
      background: white; border: 1px solid var(--border); border-radius: 16px; padding: 1rem 1.5rem;
      display: flex; flex-direction: column; align-items: center; min-width: 130px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
      
      .stat-label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .stat-value { font-size: 1.75rem; font-weight: 900; color: var(--text-main); margin-top: 0.25rem; }

      &.accent { 
        background: #fff7ed; border-color: #ffedd5; 
        .stat-label { color: var(--accent); }
        .stat-value { color: #c2410c; }
      }
    }

    /* Cards & Sections */
    .view-body { display: flex; flex-direction: column; gap: 2.5rem; }
    
    .assignment-card { 
      background: white; border-radius: 24px; border: 1px solid var(--border); overflow: hidden;
      &.risk-section { border-color: #ffedd5; background: #fffcf9; }
    }

    .card-header { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); }
    .section-badge {
      display: flex; align-items: center; gap: 0.75rem; width: fit-content;
      padding: 6px 16px; border-radius: 10px; font-weight: 800; font-size: 0.85rem;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      
      &.primary { background: #e0f2fe; color: #0369a1; }
      &.accent { background: #fff7ed; color: #ea580c; }
    }

    /* Table Improvements */
    .table-container { position: relative; }
    .pro-table { 
      width: 100%; background: transparent;
      
      th { 
        background: var(--bg-light); color: var(--text-muted); font-weight: 800; 
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
        padding: 1rem 2rem; border-bottom: 2px solid var(--border);
      }
      
      td { padding: 1.25rem 2rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      
      tr { transition: all 0.2s ease; &:hover { background-color: rgba(248, 250, 252, 0.8); } }
    }

    .protocol-cell {
      display: flex; flex-direction: column; gap: 0.35rem; max-width: 600px;
      
      .ceish-tag { 
        font-weight: 800; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; width: fit-content;
        background: #e0f2fe; color: #0369a1; letter-spacing: 0.05em;
        &.risk { background: #ffedd5; color: #ea580c; }
      }
      
      .protocol-name { 
        font-size: 0.9rem; font-weight: 700; color: var(--text-main); 
        line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
      }
      
      .investigator-name { 
        font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600;
        mat-icon { font-size: 15px; width: 15px; height: 15px; opacity: 0.7; }
      }
    }

    .instrument-badge {
      font-weight: 800; font-size: 0.7rem; padding: 4px 12px; border-radius: 8px; text-transform: uppercase;
      &.type-9 { background: #f1f5f9; color: #475569; }
      &.type-10 { background: var(--primary); color: white; }
      &.type-11 { background: #fef08a; color: #854d0e; }
    }

    .date-chip {
      display: flex; flex-direction: column; gap: 0.25rem;
      .date { font-weight: 700; color: var(--text-main); font-size: 0.85rem; }
      .badge-mini { 
        display: flex; align-items: center; gap: 3px; font-size: 0.65rem; font-weight: 800; color: var(--text-muted);
        mat-icon { font-size: 13px; width: 13px; height: 13px; }
      }
      &.urgent { .date, .badge-mini { color: #dc2626; } }
    }

    .study-pill {
      background: #f8fafc; border: 1px solid var(--border); color: #475569;
      padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    }

    .pro-btn { 
      font-weight: 800; border-radius: 12px; padding: 0 1.5rem; height: 40px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .empty-placeholder {
      padding: 5rem; display: flex; flex-direction: column; align-items: center; color: var(--text-muted);
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.3; }
      p { font-weight: 700; font-size: 0.9rem; }
    }

    .pulse { animation: pulseAnim 2s infinite ease-in-out; }
    @keyframes pulseAnim { 
      0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.2); } 
      50% { box-shadow: 0 0 0 8px rgba(234, 88, 12, 0); } 
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .text-end { text-align: right; }
  `
})
export class EvaluationListPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private getMyAssignmentsUC = inject(GetMyAssignmentsUseCase);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  items = signal<any[]>([]);
  peerRiskAssignments = signal<PeerAssignmentEntity[]>([]);
  
  displayedColumns = ['protocol', 'annex', 'deadline', 'actions'];
  riskDisplayedColumns = ['protocol', 'studyType', 'assignedAt', 'actions'];
  
  urgentCount = computed(() => this.items().filter(i => i.isUrgent).length);

  ngOnInit() {
    this.loadData();
    this.loadPeerRiskData();
  }

  loadData() {
    this.getMyAssignmentsUC.execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.items.set(data));
  }

  loadPeerRiskData() {
    this.evaluationRepo.getMyPendingPeerAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.peerRiskAssignments.set(data || []);
        },
        error: (err) => {
          console.error('Error cargando asignaciones de riesgo:', err);
          this.peerRiskAssignments.set([]);
          this.snackBar.open('No se pudieron cargar las tareas de riesgo.', 'Cerrar', { duration: 4000 });
        }
      });
  }
}
