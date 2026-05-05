import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Bandeja de Evaluaciones</h1>
        <p>Protocolos asignados para su revisión técnica y ética</p>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="evaluations()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo</th>
            <td mat-cell *matCellDef="let ev">
              <div class="protocol-info">
                <span class="code">{{ ev.protocolCode | protocolCode }}</span>
                <span class="title">{{ ev.protocolTitle }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="deadline">
            <th mat-header-cell *matHeaderCellDef>Fecha Límite</th>
            <td mat-cell *matCellDef="let ev" [class.overdue]="isOverdue(ev.deadline)">
              {{ ev.deadline | date:'mediumDate' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let ev">
              <mat-chip [ngClass]="ev.status.toLowerCase()">{{ ev.status }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let ev">
              <button mat-flat-button color="primary" [routerLink]="['/evaluations/form', ev.id]">
                <mat-icon>edit_note</mat-icon>
                Evaluar
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .table-card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .protocol-info {
      display: flex;
      flex-direction: column;
      .code { font-weight: 700; color: #003366; font-size: 0.8rem; }
      .title { font-size: 0.9rem; color: #475569; }
    }
    .overdue { color: #dc2626; font-weight: 700; }
    table { width: 100%; }
    th { padding: 1rem; }
    td { padding: 1rem; }
    
    .pending { background: #fef9c3 !important; color: #854d0e !important; }
    .completed { background: #dcfce7 !important; color: #166534 !important; }
  `]
})
export class EvaluationListPage implements OnInit {
  displayedColumns = ['protocol', 'deadline', 'status', 'actions'];
  
  evaluations = signal<any[]>([
    { id: 'ev1', protocolCode: '2026-IO-001', protocolTitle: 'Estudio de prevalencia de diabetes', deadline: new Date(2026, 5, 20), status: 'PENDING' },
    { id: 'ev2', protocolCode: '2026-EC-002', protocolTitle: 'Ensayo clínico Vacuna X', deadline: new Date(2026, 4, 15), status: 'PENDING' }
  ]);

  ngOnInit() {}

  isOverdue(deadline: Date): boolean {
    return deadline < new Date();
  }
}
