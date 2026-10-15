import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ReportsUseCase } from '@features/reports/application/use-cases/reports.use-case';
import { SummaryStats, ProtocolStats, StatusStats, EvaluationTimeStats, WorkloadStats } from '@features/reports/domain/entities/report.entity';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    NgChartsModule
  ],
  template: `
    <div class="stats-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Dashboard Estadístico</h1>
          <p class="subtitle">Visualización en tiempo real del estado de los protocolos</p>
        </div>
        
        <mat-form-field appearance="outline" class="date-filter">
          <mat-label>Rango de Fechas</mat-label>
          <mat-date-range-input [rangePicker]="picker">
            <input matStartDate placeholder="Desde" [(ngModel)]="startDate" (dateChange)="onDateChange()">
            <input matEndDate placeholder="Hasta" [(ngModel)]="endDate" (dateChange)="onDateChange()">
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>
      </header>

      <!-- Métricas Rápidas -->
      <div class="metrics-grid" *ngIf="summaryStats">
        <mat-card class="metric-card primary">
          <mat-card-content>
            <div class="metric-icon"><mat-icon>description</mat-icon></div>
            <div class="metric-info">
              <span class="value">{{ summaryStats.totalProtocols }}</span>
              <span class="label">Protocolos Totales</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card success">
          <mat-card-content>
            <div class="metric-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="metric-info">
              <span class="value">{{ summaryStats.approvalRate }}%</span>
              <span class="label">Tasa de Aprobación</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card warning">
          <mat-card-content>
            <div class="metric-icon"><mat-icon>timer</mat-icon></div>
            <div class="metric-info">
              <span class="value">{{ summaryStats.avgEvaluationDays }}</span>
              <span class="label">Días Promedio Eval.</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card accent">
          <mat-card-content>
            <div class="metric-icon"><mat-icon>update</mat-icon></div>
            <div class="metric-info">
              <span class="value">{{ summaryStats.pendingRenewals }}</span>
              <span class="label">Renovaciones Pend.</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Gráficos -->
      <div class="charts-grid">
        <!-- Protocolos por Tipo -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Protocolos por Tipo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="doughnutChartData"
                [options]="doughnutChartOptions"
                [type]="'doughnut'">
              </canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Estado Actual -->
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Estado de Protocolos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="barChartData"
                [options]="barChartOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tiempos de Evaluación -->
        <mat-card class="chart-card full-width">
          <mat-card-header>
            <mat-card-title>Evolución de Tiempos de Evaluación (Días)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper line-chart">
              <canvas baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Carga por Evaluador -->
        <mat-card class="chart-card full-width">
          <mat-card-header>
            <mat-card-title>Carga de Trabajo por Evaluador</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper bar-chart">
              <canvas baseChart
                [data]="workloadChartData"
                [options]="horizontalBarOptions"
                [type]="'bar'">
              </canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }
    .date-filter { width: 300px; }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .metric-card {
      border-radius: 12px;
      transition: transform 0.3s ease;
      mat-card-content { display: flex; align-items: center; padding: 1.5rem !important; }
      &:hover { transform: translateY(-5px); }
    }
    .metric-icon { 
      background: rgba(0, 0, 0, 0.05); 
      padding: 1rem; border-radius: 50%; 
      margin-right: 1rem; 
      mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
    }
    .metric-info {
      display: flex; flex-direction: column;
      .value { font-size: 1.75rem; font-weight: 700; color: #333; }
      .label { font-size: 0.875rem; color: #666; font-weight: 500; }
    }

    .metric-card.primary .metric-icon { color: #003366; background: rgba(0, 51, 102, 0.1); }
    .metric-card.success .metric-icon { color: #28a745; background: rgba(40, 167, 69, 0.1); }
    .metric-card.warning .metric-icon { color: #ffc107; background: rgba(255, 193, 7, 0.1); }
    .metric-card.accent .metric-icon { color: #e91e63; background: rgba(233, 30, 99, 0.1); }

    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .chart-card { border-radius: 12px; }
    .full-width { grid-column: span 2; }
    .chart-wrapper { height: 300px; position: relative; }
    .line-chart, .bar-chart { height: 400px; }

    @media (max-width: 1024px) {
      .charts-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
    }
  `]
})
export class StatsDashboardPage implements OnInit {
  private readonly reportsUseCase = inject(ReportsUseCase);

  startDate: Date | null = null;
  endDate: Date | null = null;
  summaryStats?: SummaryStats;

  // Doughnut Chart: Protocols by Type
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#003366', '#007bff', '#17a2b8'] }]
  };
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // Bar Chart: Status
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Protocolos', backgroundColor: '#28a745' }]
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  };

  // Line Chart: Evaluation Times
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Días Promedio', 
        borderColor: '#003366', 
        backgroundColor: 'rgba(0, 51, 102, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  // Workload Chart
  public workloadChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Asignados', backgroundColor: '#6c757d' },
      { data: [], label: 'Completados', backgroundColor: '#003366' }
    ]
  };
  public horizontalBarOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true } }
  };

  ngOnInit() {
    this.loadAllData();
  }

  onDateChange() {
    if (this.startDate && this.endDate) {
      this.loadAllData();
    }
  }

  private loadAllData() {
    this.reportsUseCase.getSummaryStats(this.startDate || undefined, this.endDate || undefined)
      .subscribe((stats: SummaryStats) => this.summaryStats = stats);

    this.reportsUseCase.getProtocolsByType(this.startDate || undefined, this.endDate || undefined)
      .subscribe((data: ProtocolStats[]) => {
        this.doughnutChartData.labels = data.map((d: ProtocolStats) => d.type);
        this.doughnutChartData.datasets[0].data = data.map((d: ProtocolStats) => d.count);
      });

    this.reportsUseCase.getProtocolsByStatus(this.startDate || undefined, this.endDate || undefined)
      .subscribe((data: StatusStats[]) => {
        this.barChartData.labels = data.map((d: StatusStats) => d.status);
        this.barChartData.datasets[0].data = data.map((d: StatusStats) => d.count);
      });

    this.reportsUseCase.getEvaluationTimes(this.startDate || undefined, this.endDate || undefined)
      .subscribe((data: EvaluationTimeStats[]) => {
        this.lineChartData.labels = data.map((d: EvaluationTimeStats) => d.month);
        this.lineChartData.datasets[0].data = data.map((d: EvaluationTimeStats) => d.avgDays);
      });

    this.reportsUseCase.getWorkloadByEvaluator(this.startDate || undefined, this.endDate || undefined)
      .subscribe((data: WorkloadStats[]) => {
        this.workloadChartData.labels = data.map((d: WorkloadStats) => d.evaluator);
        this.workloadChartData.datasets[0].data = data.map((d: WorkloadStats) => d.assignedCount);
        this.workloadChartData.datasets[1].data = data.map((d: WorkloadStats) => d.completedCount);
      });
  }
}
