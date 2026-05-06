import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportsUseCase } from '@features/reports/application/use-cases/reports.use-case';
import { MSPReportData } from '@features/reports/domain/entities/report.entity';

// Dynamically import libraries to avoid build-time missing module errors if they are not installed
// and use common patterns. 
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-msp-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule
  ],
  template: `
    <div class="msp-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Reportes Oficiales MSP</h1>
          <p class="subtitle">Generación de informes de gestión para el Ministerio de Salud Pública</p>
        </div>
      </header>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-grid">
            <mat-form-field appearance="outline">
              <mat-label>Tipo de Reporte</mat-label>
              <mat-select [(ngModel)]="period">
                <mat-option value="monthly">Mensual (PET 5.1)</mat-option>
                <mat-option value="annual">Anual</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Año</mat-label>
              <mat-select [(ngModel)]="year">
                <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="period === 'monthly'">
              <mat-label>Mes</mat-label>
              <mat-select [(ngModel)]="month">
                <mat-option *ngFor="let m of months; let i = index" [value]="i + 1">
                  {{ m }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="loadReport()" class="generate-btn">
              <mat-icon>analytics</mat-icon>
              Generar Vista Previa
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="report-preview" *ngIf="reportData">
        <div class="actions-bar">
          <h3>Vista Previa del Informe</h3>
          <div class="export-buttons">
            <button mat-stroked-button color="primary" (click)="exportToExcel()">
              <mat-icon>table_view</mat-icon> Exportar Excel
            </button>
            <button mat-stroked-button color="warn" (click)="exportToPDF()">
              <mat-icon>picture_as_pdf</mat-icon> Exportar PDF
            </button>
            <button mat-stroked-button (click)="copyToClipboard()">
              <mat-icon>content_copy</mat-icon> Copiar para Correo
            </button>
          </div>
        </div>

        <div class="preview-grid">
          <!-- Sesiones y Asistencia -->
          <mat-card>
            <mat-card-header><mat-card-title>Sesiones y Asistencia</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="summary-item">
                <span>Ordinarias:</span> <strong>{{ reportData.sessions.ordinary }}</strong>
              </div>
              <div class="summary-item">
                <span>Extraordinarias:</span> <strong>{{ reportData.sessions.extraordinary }}</strong>
              </div>
              <table mat-table [dataSource]="reportData.attendance" class="preview-table">
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>Miembro</th>
                  <td mat-cell *matCellDef="let element">{{ element.member }}</td>
                </ng-container>
                <ng-container matColumnDef="percentage">
                  <th mat-header-cell *matHeaderCellDef>% Asistencia</th>
                  <td mat-cell *matCellDef="let element">{{ element.percentage }}%</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Modalidades y Resoluciones -->
          <mat-card>
            <mat-card-header><mat-card-title>Evaluaciones y Resoluciones</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="section-title">Modalidades:</div>
              <div class="summary-item"><span>Exento:</span> <strong>{{ reportData.modalities.exempt }}</strong></div>
              <div class="summary-item"><span>Expedita:</span> <strong>{{ reportData.modalities.expedited }}</strong></div>
              <div class="summary-item"><span>Pleno:</span> <strong>{{ reportData.modalities.full }}</strong></div>
              
              <div class="section-title">Resoluciones:</div>
              <div class="summary-item"><span>Aprobados:</span> <strong>{{ reportData.resolutions.approved }}</strong></div>
              <div class="summary-item"><span>Condicionados:</span> <strong>{{ reportData.resolutions.conditioned }}</strong></div>
              <div class="summary-item"><span>No Aprobados:</span> <strong>{{ reportData.resolutions.notApproved }}</strong></div>
            </mat-card-content>
          </mat-card>

          <!-- Otros Datos PET 5.1 -->
          <mat-card class="full-width">
            <mat-card-header><mat-card-title>Muestras Biológicas y Poblaciones Vulnerables</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="preview-row">
                <div class="data-group">
                  <div class="section-title">Uso de Muestras Biológicas:</div>
                  <div class="summary-item"><span>Sí:</span> <strong>{{ reportData.biologicalSamples.yes }}</strong></div>
                  <div class="summary-item"><span>No:</span> <strong>{{ reportData.biologicalSamples.no }}</strong></div>
                </div>
                <div class="data-group">
                  <div class="section-title">Poblaciones Vulnerables:</div>
                  <div class="vulnerable-list">
                    <div *ngFor="let pop of reportData.vulnerablePopulations" class="summary-item">
                      <span>{{ pop.type }}:</span> <strong>{{ pop.count }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .msp-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }

    .filter-card { border-radius: 12px; margin-bottom: 2rem; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: center; }
    .generate-btn { height: 56px; }

    .actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .export-buttons { display: flex; gap: 0.5rem; }

    .preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .full-width { grid-column: span 2; }
    .summary-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .section-title { font-weight: 600; margin: 1rem 0 0.5rem; color: #003366; }
    .preview-table { width: 100%; margin-top: 1rem; }
    
    .preview-row { display: flex; gap: 3rem; }
    .data-group { flex: 1; }

    @media (max-width: 768px) {
      .preview-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
      .preview-row { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class MSPReportsPage {
  private readonly reportsUseCase = inject(ReportsUseCase);
  private readonly snackBar = inject(MatSnackBar);

  period: 'monthly' | 'annual' = 'monthly';
  year: number = new Date().getFullYear();
  month: number = new Date().getMonth() + 1;
  years = [2024, 2025, 2026];
  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  reportData?: MSPReportData;
  displayedColumns = ['member', 'percentage'];

  loadReport() {
    this.reportsUseCase.getMSPReport(this.period, this.year, this.month)
      .subscribe((data: MSPReportData) => this.reportData = data);
  }

  exportToExcel() {
    if (!this.reportData) return;

    const wb = XLSX.utils.book_new();
    
    // Resumen General
    const summaryData = [
      ['Reporte CEISH-ESPOCH', this.period === 'monthly' ? `Mes: ${this.months[this.month-1]} ${this.year}` : `Año: ${this.year}`],
      [],
      ['Sesiones Ordinarias', this.reportData.sessions.ordinary],
      ['Sesiones Extraordinarias', this.reportData.sessions.extraordinary],
      [],
      ['Modalidad de Evaluación'],
      ['Exento', this.reportData.modalities.exempt],
      ['Expedita', this.reportData.modalities.expedited],
      ['Pleno', this.reportData.modalities.full],
      [],
      ['Resoluciones'],
      ['Aprobados', this.reportData.resolutions.approved],
      ['Condicionados', this.reportData.resolutions.conditioned],
      ['No Aprobados', this.reportData.resolutions.notApproved]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Asistencia
    const wsAttendance = XLSX.utils.json_to_sheet(this.reportData.attendance);
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Asistencia');

    XLSX.writeFile(wb, `Reporte_MSP_${this.year}_${this.month}.xlsx`);
    this.snackBar.open('Excel exportado correctamente', 'Cerrar', { duration: 3000 });
  }

  exportToPDF() {
    if (!this.reportData) return;

    const doc = new jsPDF();
    const title = `REPORTE DE GESTIÓN CEISH-ESPOCH - ${this.period.toUpperCase()}`;
    const subtitle = this.period === 'monthly' ? `${this.months[this.month-1]} ${this.year}` : `Año ${this.year}`;

    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(subtitle, 105, 30, { align: 'center' });

    doc.text('1. SESIONES REALIZADAS', 20, 45);
    autoTable(doc, {
      startY: 50,
      head: [['Tipo de Sesión', 'Cantidad']],
      body: [
        ['Ordinarias', this.reportData.sessions.ordinary],
        ['Extraordinarias', this.reportData.sessions.extraordinary]
      ]
    });

    doc.text('2. MODALIDADES DE EVALUACIÓN', 20, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Modalidad', 'Protocolos']],
      body: [
        ['Exento', this.reportData.modalities.exempt],
        ['Expedita', this.reportData.modalities.expedited],
        ['Pleno', this.reportData.modalities.full]
      ]
    });

    doc.save(`Reporte_MSP_${this.year}_${this.month}.pdf`);
    this.snackBar.open('PDF exportado correctamente', 'Cerrar', { duration: 3000 });
  }

  copyToClipboard() {
    if (!this.reportData) return;
    
    const text = `
Resumen de Gestión CEISH-ESPOCH (${this.months[this.month-1]} ${this.year}):
- Sesiones Ordinarias: ${this.reportData.sessions.ordinary}
- Sesiones Extraordinarias: ${this.reportData.sessions.extraordinary}
- Protocolos Evaluados: ${this.reportData.modalities.exempt + this.reportData.modalities.expedited + this.reportData.modalities.full}
- Resoluciones Emitidas: ${this.reportData.resolutions.approved} Aprobados, ${this.reportData.resolutions.conditioned} Condicionados.
    `;
    
    navigator.clipboard.writeText(text);
    this.snackBar.open('Texto copiado al portapapeles', 'Cerrar', { duration: 3000 });
  }
}
