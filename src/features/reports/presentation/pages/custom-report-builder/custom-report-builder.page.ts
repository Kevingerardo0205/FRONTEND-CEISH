import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-custom-report-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule
  ],
  template: `
    <div class="builder-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Constructor de Reportes Custom</h1>
          <p class="subtitle">Diseñe sus propios reportes seleccionando filtros y columnas</p>
        </div>
      </header>

      <div class="builder-layout">
        <!-- Panel de Filtros -->
        <mat-card class="sidebar-card">
          <mat-card-header><mat-card-title>1. Filtros</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="filter-options">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tipo de Protocolo</mat-label>
                <mat-select multiple [(ngModel)]="selectedTypes">
                  <mat-option value="IO">Observacional (IO)</mat-option>
                  <mat-option value="EI">Intervención (EI)</mat-option>
                  <mat-option value="EC">Ensayo Clínico (EC)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Estado</mat-label>
                <mat-select multiple [(ngModel)]="selectedStatus">
                  <mat-option value="APPROVED">Aprobado</mat-option>
                  <mat-option value="PENDING">Pendiente</mat-option>
                  <mat-option value="REJECTED">Rechazado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Panel de Columnas -->
        <mat-card class="sidebar-card">
          <mat-card-header><mat-card-title>2. Columnas</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-selection-list [(ngModel)]="selectedColumns" (selectionChange)="onColumnsChange()">
              <mat-list-option *ngFor="let col of availableColumns" [value]="col.id">
                {{ col.label }}
              </mat-list-option>
            </mat-selection-list>
          </mat-card-content>
        </mat-card>

        <!-- Vista Previa -->
        <mat-card class="preview-card">
          <mat-card-header>
            <mat-card-title>3. Vista Previa</mat-card-title>
            <div class="actions">
              <button mat-stroked-button color="primary" (click)="exportReport()">
                <mat-icon>download</mat-icon> Exportar Datos
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="previewData">
                <ng-container *ngFor="let col of selectedColumns" [matColumnDef]="col">
                  <th mat-header-cell *matHeaderCellDef>{{ getColumnLabel(col) }}</th>
                  <td mat-cell *matCellDef="let element">{{ element[col] }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="selectedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: selectedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .builder-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }

    .builder-layout { display: grid; grid-template-columns: 250px 250px 1fr; gap: 1.5rem; align-items: start; }
    .sidebar-card { border-radius: 12px; }
    .full-width { width: 100%; }
    .filter-options { margin-top: 1rem; }

    .preview-card { border-radius: 12px; min-height: 600px; }
    .actions { margin-left: auto; }
    
    .table-container { overflow-x: auto; margin-top: 1.5rem; }
    table { width: 100%; }

    @media (max-width: 1200px) {
      .builder-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomReportBuilderPage {
  private readonly snackBar = inject(MatSnackBar);

  selectedTypes: string[] = [];
  selectedStatus: string[] = [];
  
  availableColumns = [
    { id: 'code', label: 'Código' },
    { id: 'title', label: 'Título' },
    { id: 'investigator', label: 'Investigador' },
    { id: 'type', label: 'Tipo' },
    { id: 'status', label: 'Estado' },
    { id: 'date', label: 'Fecha Recepción' },
    { id: 'institution', label: 'Institución' }
  ];

  selectedColumns: string[] = ['code', 'title', 'status'];

  previewData = [
    { code: 'PRT-2024-001', title: 'Estudio de Prevalencia de Diabetes', investigator: 'Dr. John Doe', type: 'IO', status: 'Aprobado', date: '2024-01-15', institution: 'ESPOCH' },
    { code: 'PRT-2024-002', title: 'Ensayo Clínico Fase III Vacuna', investigator: 'Dra. Jane Smith', type: 'EC', status: 'Pendiente', date: '2024-02-10', institution: 'HGO' },
    { code: 'PRT-2024-003', title: 'Impacto de la Nutrición en Infantes', investigator: 'Dr. Carlos Ruiz', type: 'EI', status: 'Aprobado', date: '2024-03-05', institution: 'ESPOCH' }
  ];

  onColumnsChange() {
    // Angular Material table requires re-rendering if columns change
  }

  getColumnLabel(id: string): string {
    return this.availableColumns.find(c => c.id === id)?.label || id;
  }

  exportReport() {
    this.snackBar.open('Generando exportación de datos...', 'Cerrar', { duration: 3000 });
  }
}
