import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { AuditLog } from '@features/audit/domain/entities/audit.entity';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  template: `
    <div class="audit-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Visor de Auditoría</h1>
          <p class="subtitle">Registros inmutables de todas las acciones del sistema</p>
        </div>
        <button mat-stroked-button color="primary" (click)="exportToCSV()">
          <mat-icon>download</mat-icon> Exportar CSV
        </button>
      </header>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-grid">
            <mat-form-field appearance="outline">
              <mat-label>Búsqueda rápida</mat-label>
              <input matInput placeholder="ID, Usuario, IP..." [(ngModel)]="filters.search" (keyup.enter)="loadLogs()">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Acción</mat-label>
              <mat-select [(ngModel)]="filters.action" multiple (selectionChange)="loadLogs()">
                <mat-option value="CREATE">CREAR</mat-option>
                <mat-option value="UPDATE">MODIFICAR</mat-option>
                <mat-option value="DELETE">ELIMINAR</mat-option>
                <mat-option value="APPROVE">APROBAR</mat-option>
                <mat-option value="REJECT">RECHAZAR</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Entidad</mat-label>
              <mat-select [(ngModel)]="filters.entity" multiple (selectionChange)="loadLogs()">
                <mat-option value="Protocol">Protocolo</mat-option>
                <mat-option value="User">Usuario</mat-option>
                <mat-option value="Evaluation">Evaluación</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rango de Fechas</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input matStartDate placeholder="Inicio" [(ngModel)]="filters.startDate">
                <input matEndDate placeholder="Fin" [(ngModel)]="filters.endDate" (dateChange)="loadLogs()">
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <div class="table-container">
          <table mat-table [dataSource]="logs" matSort>
            <!-- Fecha -->
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha/Hora</th>
              <td mat-cell *matCellDef="let log">{{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
            </ng-container>

            <!-- Usuario -->
            <ng-container matColumnDef="userName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Usuario</th>
              <td mat-cell *matCellDef="let log">
                <div class="user-cell">
                  <strong>{{ log.userName }}</strong>
                  <span class="role-badge">{{ log.userRole }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Acción -->
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Acción</th>
              <td mat-cell *matCellDef="let log">
                <span class="action-badge" [ngClass]="log.action">{{ log.action }}</span>
              </td>
            </ng-container>

            <!-- Entidad -->
            <ng-container matColumnDef="entity">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Entidad</th>
              <td mat-cell *matCellDef="let log">{{ log.entity }}</td>
            </ng-container>

            <!-- ID Registro -->
            <ng-container matColumnDef="recordId">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID Registro</th>
              <td mat-cell *matCellDef="let log">{{ log.recordId }}</td>
            </ng-container>

            <!-- IP -->
            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>IP Origen</th>
              <td mat-cell *matCellDef="let log">{{ log.ipAddress }}</td>
            </ng-container>

            <!-- Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let log">
                <button mat-icon-button [matTooltip]="'Ver cambios'" *ngIf="log.changes" (click)="toggleChanges(log)">
                  <mat-icon>difference</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons></mat-paginator>
        </div>
      </mat-card>

      <!-- Panel de Cambios (JSON Diff Mockup) -->
      <div class="changes-overlay" *ngIf="selectedLog" (click)="selectedLog = null">
        <mat-card class="changes-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>Detalle de Cambios - {{ selectedLog.recordId }}</mat-card-title>
            <button mat-icon-button (click)="selectedLog = null"><mat-icon>close</mat-icon></button>
          </mat-card-header>
          <mat-card-content>
            <div class="diff-container">
              <div class="diff-box before">
                <h4>Antes</h4>
                <pre>{{ selectedLog.changes.before | json }}</pre>
              </div>
              <div class="diff-box after">
                <h4>Después</h4>
                <pre>{{ selectedLog.changes.after | json }}</pre>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .audit-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; position: relative; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }

    .filter-card { border-radius: 12px; margin-bottom: 1.5rem; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }

    .user-cell { display: flex; flex-direction: column; }
    .role-badge { font-size: 0.75rem; color: #666; font-weight: 500; }

    .action-badge {
      padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
      &.CREATE { background: #e3f2fd; color: #1976d2; }
      &.UPDATE { background: #fff3e0; color: #f57c00; }
      &.DELETE { background: #ffebee; color: #d32f2f; }
      &.APPROVE { background: #e8f5e9; color: #388e3c; }
      &.REJECT { background: #fbe9e7; color: #d84315; }
    }

    .changes-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; justify-content: center; align-items: center;
    }
    .changes-card { width: 80%; max-width: 900px; max-height: 80vh; overflow-y: auto; }
    .diff-container { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .diff-box { background: #f1f3f4; padding: 1rem; border-radius: 8px; pre { font-size: 0.8rem; overflow-x: auto; } }
  `]
})
export class AuditLogsPage implements OnInit {
  private readonly auditUseCase = inject(AuditUseCase);

  logs: AuditLog[] = [];
  displayedColumns = ['timestamp', 'userName', 'action', 'entity', 'recordId', 'ipAddress', 'actions'];
  filters = {
    search: '',
    action: [],
    entity: [],
    startDate: null,
    endDate: null
  };

  selectedLog: any = null;

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditUseCase.getLogs(this.filters).subscribe((logs: AuditLog[]) => this.logs = logs);
  }

  toggleChanges(log: AuditLog) {
    this.selectedLog = log;
  }

  exportToCSV() {
    const headers = ['Fecha', 'Usuario', 'Rol', 'Acción', 'Entidad', 'Registro', 'IP'];
    const data = this.logs.map(log => [
      log.timestamp.toISOString(),
      log.userName,
      log.userRole,
      log.action,
      log.entity,
      log.recordId,
      log.ipAddress
    ]);

    const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
