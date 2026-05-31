import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { SecretariatDashboardService } from './application/services/secretariat-dashboard.service';
import { KpiPanelComponent } from './components/kpi-panel/kpi-panel.component';
import { WorkflowTableComponent } from '../../components/workflow-table/workflow-table.component';
import { PeerRiskPendingTableComponent } from '../../components/peer-risk-pending-table/peer-risk-pending-table.component';
import { DeadlinesRadarComponent } from './components/deadlines-radar/deadlines-radar.component';
import { AuditFeedComponent } from './components/audit-feed/audit-feed.component';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';

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
    PeerRiskPendingTableComponent,
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
          <!-- View Switcher -->
          <div class="view-selector">
            <button 
              class="selector-btn" 
              [class.active]="activeTab() === 'WORKFLOW'" 
              (click)="activeTab.set('WORKFLOW')">
              <mat-icon>assignment</mat-icon>
              Trámites Activos
            </button>
            <button 
              class="selector-btn" 
              [class.active]="activeTab() === 'PEERS'" 
              (click)="activeTab.set('PEERS')">
              <mat-icon>supervised_user_circle</mat-icon>
              Estratificación de Riesgo
            </button>
          </div>

          <!-- Bandeja Workflow (Corazón del Sistema) -->
          <app-workflow-table 
            *ngIf="activeTab() === 'WORKFLOW'"
            [protocols]="filteredProtocols()"
            (filterChanged)="onStatusFilterChanged($event)">
          </app-workflow-table>

          <!-- Bandeja de Estratificación de Riesgo por Pares -->
          <app-peer-risk-pending-table
            *ngIf="activeTab() === 'PEERS'"
            [protocols]="peerPendingProtocols()"
            (assignmentCompleted)="refreshData()">
          </app-peer-risk-pending-table>
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
  private evaluationRepo = inject(IEvaluationRepositoryPort);

  isLoading = this.stateService.isLoading;
  searchQuery = this.stateService.searchQuery;
  metrics = this.stateService.metrics;
  protocols = this.stateService.protocols;
  filteredProtocols = this.stateService.filteredProtocols;

  activeTab = signal<'WORKFLOW' | 'PEERS'>('WORKFLOW');

  // Reactivo: Filtra y mapea dinámicamente los protocolos reales cargados del backend
  peerPendingProtocols = computed<PendingPeerAssignmentProtocol[]>(() => {
    const list = this.protocols();
    return list
      .filter(p => {
        const s = p.status?.toUpperCase();
        // Cargar protocolos con recepción completa (COMPLETO o VALIDADO)
        return (s === 'COMPLETO' || s === 'VALIDATED' || s === 'VALIDADO') && 
               (!!p.code && p.code !== 'S/C' && p.code.trim() !== '');
      })
      .map(p => ({
        id: Number(p.id) || 0,
        ceishCode: p.code || '',
        title: p.title || 'Sin título',
        receptionStatus: p.status || '',
        isRiskLevelDesignated: false,
        createdAt: p.submissionDate ? new Date(p.submissionDate).toISOString() : new Date().toISOString(),
        studyType: {
          id: 0,
          codigo: p.studyTypeCode || '',
          nombre: p.type || 'General'
        },
        principalInvestigatorRecord: {
          id: 0,
          fullName: p.principalInvestigator || 'Investigador Principal',
          email: ''
        }
      }));
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
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
