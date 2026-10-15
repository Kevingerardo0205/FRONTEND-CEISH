import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { AssignPeersModalComponent } from '../assign-peers-modal/assign-peers-modal.component';

@Component({
  selector: 'app-peer-risk-pending-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="table-card shadow-soft">
      <div class="table-responsive">
        <table mat-table [dataSource]="protocols()" class="ops-table">
          
          <!-- Código Column -->
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>CÓDIGO CEISH</th>
            <td mat-cell *matCellDef="let p">
              <span class="code-badge">{{ p.ceishCode || 'S/C' }}</span>
            </td>
          </ng-container>

          <!-- Título / Investigador Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>PROYECTO / INVESTIGADOR</th>
            <td mat-cell *matCellDef="let p">
              <div class="project-cell">
                <span class="title" [matTooltip]="p.title">{{ p.title }}</span>
                <span class="investigator">
                  <mat-icon>person</mat-icon>
                  {{ p.principalInvestigatorRecord?.fullName || 'No asignado' }}
                </span>
              </div>
            </td>
          </ng-container>

          <!-- Tipo de Estudio Column -->
          <ng-container matColumnDef="studyType">
            <th mat-header-cell *matHeaderCellDef>TIPO DE ESTUDIO</th>
            <td mat-cell *matCellDef="let p">
              <span class="type-badge">{{ p.studyType?.nombre || 'General' }}</span>
            </td>
          </ng-container>

          <!-- Fecha Recepción Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>FECHA DE RECEPCIÓN</th>
            <td mat-cell *matCellDef="let p">
              <div class="date-cell">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Gestión Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right">GESTIÓN</th>
            <td mat-cell *matCellDef="let p" class="text-right">
              <button 
                mat-flat-button 
                color="accent" 
                class="assign-btn"
                (click)="openAssignModal(p)">
                <mat-icon>supervised_user_circle</mat-icon>
                Asignar Pares
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
        </table>
        
        <div class="empty-state" *ngIf="protocols().length === 0">
          <mat-icon>check_circle</mat-icon>
          <p>No existen protocolos pendientes de estratificación de riesgo por pares.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .ops-table {
      width: 100%;
      border-collapse: collapse;
      
      th {
        background: #f8fafc;
        color: #64748b;
        font-weight: 700;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        font-size: 0.85rem;
      }
    }

    .table-row {
      transition: background-color 0.2s ease;
      &:hover {
        background-color: #f8fafc;
      }
    }

    .code-badge {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .project-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 400px;

      .title {
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .investigator {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: #64748b;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    .type-badge {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #475569;
      font-size: 0.8rem;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
        color: #94a3b8;
      }
    }

    .text-right {
      text-align: right;
    }

    .assign-btn {
      font-size: 0.8rem;
      font-weight: 700;
      border-radius: 8px;
      padding: 0 12px;
      height: 36px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: #64748b;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #10b981;
        margin-bottom: 0.75rem;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
      }
    }
  `]
})
export class PeerRiskPendingTableComponent {
  private dialog = inject(MatDialog);

  protocols = input.required<PendingPeerAssignmentProtocol[]>();
  assignmentCompleted = output<void>();

  displayedColumns = ['code', 'title', 'studyType', 'createdAt', 'actions'];

  openAssignModal(protocol: PendingPeerAssignmentProtocol) {
    const dialogRef = this.dialog.open(AssignPeersModalComponent, {
      width: '600px',
      data: { protocol },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((assigned: boolean) => {
      if (assigned) {
        this.assignmentCompleted.emit();
      }
    });
  }
}
