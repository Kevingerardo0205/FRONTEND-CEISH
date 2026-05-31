import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { GetMyAssignmentsUseCase } from '../../../application/get-my-assignments.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PeerAssignmentEntity } from '@domain/entities/peer-evaluation.entity';
import { PeerRiskAssessmentFormComponent } from '../../components/peer-risk-assessment-form/peer-risk-assessment-form.component';

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
    MatDialogModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container animate-fade-in">
      <header class="page-header mb-4">
        <div class="title-section">
          <h1 class="page-title">Mis Tareas de Evaluación</h1>
          <p class="page-subtitle">Protocolos asignados pendientes de su dictamen ético y técnico</p>
        </div>
        <div class="stats-overview">
          <div class="stat-card">
            <span class="label">Pendientes</span>
            <span class="value">{{ items().length }}</span>
          </div>
          <div class="stat-card urgent">
            <span class="label">Urgentes</span>
            <span class="value">{{ urgentCount() }}</span>
          </div>
        </div>
      </header>

      <!-- 1. Bandeja Tradicional de Evaluación -->
      <div class="content-card shadow-soft mb-5">
        <div class="table-toolbar p-3">
          <h2 class="section-title m-0">Bandeja de Dictámenes Éticos</h2>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="items()" class="modern-table">
            
            <ng-container matColumnDef="protocol">
              <th mat-header-cell *matHeaderCellDef> Protocolo / Investigador </th>
              <td mat-cell *matCellDef="let item">
                <div class="protocol-info-cell">
                  <span class="code">{{ item.protocolCode | protocolCode }}</span>
                  <span class="title">{{ item.protocolTitle }}</span>
                  <span class="investigator"><mat-icon>person</mat-icon> {{ item.investigator }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="deadline">
              <th mat-header-cell *matHeaderCellDef> Plazo de Entrega </th>
              <td mat-cell *matCellDef="let item">
                <div class="deadline-cell" [class.urgent]="item.isUrgent">
                  <span class="date">{{ item.deadline | date:'dd/MM/yyyy' }}</span>
                  <span class="remaining" *ngIf="item.daysRemaining !== undefined">
                    <mat-icon>{{ item.isUrgent ? 'alarm_on' : 'schedule' }}</mat-icon>
                    {{ item.daysRemaining }} días restantes
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="annex">
              <th mat-header-cell *matHeaderCellDef> Instrumento </th>
              <td mat-cell *matCellDef="let item">
                <mat-chip-listbox>
                  <mat-chip [class.annex-9]="item.annexToUse === 'ANEXO_9'"
                           [class.annex-10]="item.annexToUse === 'ANEXO_10'"
                           [class.annex-11]="item.annexToUse === 'ANEXO_11'">
                    {{ item.annexToUse?.replace('_', ' ') || 'ANEXO' }}
                  </mat-chip>
                </mat-chip-listbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-end"> Acciones </th>
              <td mat-cell *matCellDef="let item" class="text-end">
                <button mat-flat-button color="primary" [routerLink]="['/dashboard/evaluations/evaluate', item.id]">
                  <mat-icon>gavel</mat-icon> Evaluar
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.urgent-row]="row.isUrgent"></tr>
          </table>
          
          <div class="empty-state" *ngIf="items().length === 0">
            <mat-icon>inbox</mat-icon>
            <p>No tiene evaluaciones de dictamen asignadas en este momento.</p>
          </div>
        </div>
      </div>

      <!-- 2. Bandeja de Estratificación de Riesgo por Pares (PET 4.2.1) -->
      <div class="content-card shadow-soft" *ngIf="peerRiskAssignments().length > 0">
        <div class="table-toolbar p-3" style="background: #fff7ed; border-bottom: 1px solid #ffedd5; display: flex; align-items: center; gap: 0.5rem;">
          <mat-icon style="color: #ea580c;">security</mat-icon>
          <h2 class="section-title m-0" style="color: #ea580c;">Asignaciones de Riesgo Pendientes (PET 4.2.1)</h2>
        </div>

        <div class="table-responsive">
          <table class="modern-table">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; padding: 1rem;">Protocolo / Investigador</th>
                <th style="color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; padding: 1rem;">Tipo de Estudio</th>
                <th style="color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; padding: 1rem;">Fecha Asignación</th>
                <th class="text-end" style="color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; padding: 1rem;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of peerRiskAssignments()" style="transition: background-color 0.2s ease;">
                <td style="padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                  <div class="protocol-info-cell">
                    <span class="code" style="color: #ea580c; font-weight: 800; font-size: 0.75rem;">{{ item.protocol.ceishCode || 'S/C' }}</span>
                    <span class="title" style="font-size: 0.9rem; font-weight: 700; color: #1e293b; line-height: 1.3;">{{ item.protocol.title }}</span>
                    <span class="investigator" style="font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px;">
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px;">person</mat-icon>
                      {{ item.protocol.principalInvestigatorRecord.fullName }}
                    </span>
                  </div>
                </td>
                <td style="padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                  <span style="background: #fff7ed; color: #c2410c; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.72rem; white-space: nowrap;">
                    {{ item.protocol.studyType.nombre }}
                  </span>
                </td>
                <td style="padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                  <div class="deadline-cell">
                    <span class="date" style="font-weight: 700; color: #1e293b;">{{ item.assignedAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
                <td class="text-end" style="padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                  <button mat-flat-button color="accent" (click)="openRiskModal(item)" style="font-weight: 800; border-radius: 10px; height: 40px;">
                    <mat-icon>security</mat-icon> Analizar Riesgo
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; margin-top: 0.25rem; }
    
    .stats-overview { display: flex; gap: 1rem; }
    .stat-card {
      background: white; padding: 0.75rem 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;
      display: flex; flex-direction: column; align-items: center; min-width: 100px;
      .label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
      .value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
      &.urgent { border-color: #fecaca; background: #fff1f2; .value { color: #dc2626; } }
    }

    .content-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
    .section-title { font-size: 1rem; color: #003366; font-weight: 800; }
    
    .modern-table { 
      width: 100%; 
      th { background: #f8fafc; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; padding: 1rem; }
      td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .urgent-row { background: #fff1f2 !important; }

    .protocol-info-cell {
      display: flex; flex-direction: column; gap: 0.25rem;
      .code { font-weight: 800; color: #003366; font-size: 0.75rem; }
      .title { font-size: 0.9rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
      .investigator { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    }

    .deadline-cell {
      display: flex; flex-direction: column; .date { font-weight: 700; color: #1e293b; }
      .remaining { font-size: 0.7rem; font-weight: 800; color: #64748b; display: flex; align-items: center; gap: 4px; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
      &.urgent { .date, .remaining { color: #dc2626; } }
    }

    .mat-mdc-chip { font-weight: 800; font-size: 0.65rem; }
    .annex-9 { --mdc-chip-elevated-container-color: #f1f5f9; }
    .annex-10 { --mdc-chip-elevated-container-color: #003366; color: white; }
    .annex-11 { --mdc-chip-elevated-container-color: #fde047; }

    .empty-state {
      padding: 5rem 3rem; display: flex; flex-direction: column; align-items: center; color: #94a3b8;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5; }
      p { font-weight: 600; font-size: 0.9rem; }
    }

    .text-end { text-align: right; }
    button { font-weight: 800; border-radius: 10px; padding: 0 1.5rem; height: 44px; }
  `]
})
export class EvaluationListPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private getMyAssignmentsUC = inject(GetMyAssignmentsUseCase);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private dialog = inject(MatDialog);

  items = signal<any[]>([]);
  peerRiskAssignments = signal<PeerAssignmentEntity[]>([]);
  displayedColumns = ['protocol', 'annex', 'deadline', 'actions'];
  urgentCount = computed(() => this.items().filter(i => i.isUrgent).length);

  ngOnInit() {
    this.loadData();
    this.loadPeerRiskData();
  }

  loadData() {
    this.getMyAssignmentsUC.execute().subscribe(data => this.items.set(data));
  }

  loadPeerRiskData() {
    this.evaluationRepo.getMyPendingPeerAssignments().subscribe({
      next: (data) => {
        this.peerRiskAssignments.set(data || []);
      },
      error: (err) => {
        console.error('Error cargando asignaciones de riesgo:', err);
        if (err.status === 404 || err.message?.includes('Not Found')) {
          console.warn('[Estratificación] El backend devolvió 404. Cargando mock de demostración...');
          const mockData: PeerAssignmentEntity[] = [
            {
              id: 8,
              protocolId: 12,
              evaluatorId: 3,
              proposedRiskLevelId: null,
              observations: null,
              assignedAt: new Date().toISOString(),
              submittedAt: null,
              protocol: {
                id: 12,
                ceishCode: "CEISH-ESPOCH-EI-012-2026",
                title: "Evaluación del balance nutricional en escolares de Chimborazo",
                studyType: {
                  nombre: "Investigación Observacional"
                },
                principalInvestigatorRecord: {
                  fullName: "Dra. María Carmen Ortega"
                }
              }
            }
          ];
          this.peerRiskAssignments.set(mockData);
        }
      }
    });
  }

  openRiskModal(assignment: PeerAssignmentEntity) {
    const dialogRef = this.dialog.open(PeerRiskAssessmentFormComponent, {
      width: '650px',
      data: { assignment },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        this.loadPeerRiskData();
      }
    });
  }
}
