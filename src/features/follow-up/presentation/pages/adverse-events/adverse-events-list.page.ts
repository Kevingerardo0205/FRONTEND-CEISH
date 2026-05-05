import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-adverse-events-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-area">
          <h1>Registro de Eventos Adversos</h1>
          <p>Notificaciones de EAG y RAGI en protocolos activos</p>
        </div>
        <button mat-flat-button color="warn" routerLink="/dashboard/follow-up/adverse-events/new">
          <mat-icon>warning</mat-icon>
          Reportar Evento
        </button>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="events()" class="full-width-table">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo</th>
            <td mat-cell *matCellDef="let ev">
              <div class="bold-text">{{ ev.protocolCode }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha Reporte</th>
            <td mat-cell *matCellDef="let ev">{{ ev.reportDate | date:'shortDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="subject">
            <th mat-header-cell *matHeaderCellDef>Sujeto ID</th>
            <td mat-cell *matCellDef="let ev">{{ ev.subjectId }}</td>
          </ng-container>

          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef>Gravedad</th>
            <td mat-cell *matCellDef="let ev">
              <mat-chip [ngClass]="ev.severity.toLowerCase()">{{ ev.severity }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let ev">
              <mat-chip [ngClass]="ev.status.toLowerCase()">
                <mat-icon *ngIf="ev.status === 'CRITICAL'" class="chip-icon">notification_important</mat-icon>
                {{ ev.status }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let ev">
              <button mat-icon-button color="primary" matTooltip="Ver Detalles">
                <mat-icon>visibility</mat-icon>
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
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.8rem; color: #003366; }
      p { margin: 0.5rem 0 0; color: #64748b; }
    }
    .table-card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
    .full-width-table { width: 100%; }
    .bold-text { font-weight: 700; color: #1e293b; }
    
    .leve { background: #e2e8f0 !important; color: #475569 !important; }
    .moderado { background: #fef9c3 !important; color: #854d0e !important; }
    .grave { background: #fee2e2 !important; color: #991b1b !important; }
    
    .critical { background: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fca5a5; font-weight: 700 !important; }
    .pending { background: #fef08a !important; color: #ca8a04 !important; }
    .notified { background: #dcfce7 !important; color: #166534 !important; }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
  `]
})
export class AdverseEventsListPage implements OnInit {
  displayedColumns = ['protocol', 'date', 'subject', 'severity', 'status', 'actions'];
  
  events = signal<any[]>([
    { id: '1', protocolCode: '2026-EC-002', reportDate: new Date(), subjectId: 'SUB-045', severity: 'Grave', status: 'CRITICAL' },
    { id: '2', protocolCode: '2026-IO-001', reportDate: new Date(Date.now() - 86400000), subjectId: 'SUB-102', severity: 'Leve', status: 'NOTIFIED' }
  ]);

  ngOnInit() {}
}
