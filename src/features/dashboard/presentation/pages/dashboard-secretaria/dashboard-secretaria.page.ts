import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { SecretariatDashboardService } from './application/services/secretariat-dashboard.service';
import { KpiPanelComponent } from './components/kpi-panel/kpi-panel.component';
import { WorkflowTableComponent } from '../../components/workflow-table/workflow-table.component';
import { DeadlinesRadarComponent } from './components/deadlines-radar/deadlines-radar.component';
import { AuditFeedComponent } from './components/audit-feed/audit-feed.component';

@Component({
  selector: 'app-dashboard-secretaria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecretariatDashboardService],
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatIconModule,
    KpiPanelComponent,
    WorkflowTableComponent,
    DeadlinesRadarComponent,
    AuditFeedComponent
  ],
  template: `
    <div class="ops-center animate-fade-in">
      <!-- Loading bar -->
      <mat-progress-bar *ngIf="isLoading()" mode="indeterminate" class="global-progress"></mat-progress-bar>

      <!-- 1. Header Dinámico -->
      <header class="ops-header">
        <div class="user-greeting">
          <div class="breadcrumb">COMITÉ DE ÉTICA CEISH</div>
          <h1>Centro de Operaciones de Secretaría</h1>
          <p>Supervisión y control del flujo documental y cumplimiento de plazos SLA</p>
        </div>
        <div class="search-bar">
          <mat-icon>search</mat-icon>
          <input 
            type="text" 
            placeholder="Buscar por código, título, investigador..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)">
        </div>
      </header>

      <!-- 2. Panel KPI Superior -->
      <app-kpi-panel [metrics]="metrics()"></app-kpi-panel>

      <!-- 3. Contenedor Principal (Grid Asimétrico) -->
      <div class="ops-grid">
        <main class="ops-main-col">
          <!-- Bandeja Workflow (Corazón del Sistema) -->
          <app-workflow-table 
            [protocols]="filteredProtocols()"
            (filterChanged)="onStatusFilterChanged($event)">
          </app-workflow-table>
        </main>
        
        <aside class="ops-side-col">
          <!-- Radar de Urgencias y Auditoría -->
          <app-deadlines-radar [protocols]="protocols()"></app-deadlines-radar>
          <app-audit-feed></app-audit-feed>
        </aside>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-secretaria.page.scss']
})
export class DashboardSecretariaPage implements OnInit {
  private stateService = inject(SecretariatDashboardService);

  isLoading = this.stateService.isLoading;
  searchQuery = this.stateService.searchQuery;
  metrics = this.stateService.metrics;
  protocols = this.stateService.protocols;
  filteredProtocols = this.stateService.filteredProtocols;

  ngOnInit() {
    this.stateService.loadDashboardData().subscribe();
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.stateService.updateSearch(input.value);
  }

  onStatusFilterChanged(status: string) {
    this.stateService.updateFilter(status);
  }
}
