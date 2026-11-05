import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { SecretariatDashboardService } from './application/services/secretariat-dashboard.service';
import { WorkflowTableComponent } from '../../components/workflow-table/workflow-table.component';
import { PeerRiskPendingTableComponent } from '../../components/peer-risk-pending-table/peer-risk-pending-table.component';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '@features/evaluations/application/load-pending-peer-assignment-protocols.use-case';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { ActivatedRoute } from '@angular/router';
import { toPendingPeerProtocols } from '../../utils/pending-peer-protocol.util';

@Component({
  selector: 'app-dashboard-secretaria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecretariatDashboardService],
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatIconModule,
    WorkflowTableComponent,
    PeerRiskPendingTableComponent,
  ],
  template: `
    <div class="ops-center animate-fade-in">
      <!-- Loading bar -->
      <mat-progress-bar
        *ngIf="isLoading()"
        mode="indeterminate"
        class="global-progress"
      ></mat-progress-bar>

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
            (input)="onSearchInput($event)"
          />
        </div>
      </header>

      <!-- 3. Contenedor Principal (Grid Asimétrico) -->
      <div class="ops-grid">
        <main class="ops-main-col">
          <!-- View Switcher -->
          <div class="view-selector">
            <button
              class="selector-btn"
              [class.active]="activeTab() === 'WORKFLOW'"
              (click)="activeTab.set('WORKFLOW')"
            >
              <mat-icon>assignment</mat-icon>
              Trámites Activos
            </button>
            <button
              class="selector-btn"
              [class.active]="activeTab() === 'PEERS'"
              (click)="activeTab.set('PEERS')"
            >
              <mat-icon>supervised_user_circle</mat-icon>
              Estratificación de Riesgo
            </button>
          </div>

          <!-- Bandeja Workflow (Corazón del Sistema) -->
          <app-workflow-table
            *ngIf="activeTab() === 'WORKFLOW'"
            [protocols]="filteredProtocols()"
            (filterChanged)="onStatusFilterChanged($event)"
          >
          </app-workflow-table>

          <!-- Bandeja de Estratificación de Riesgo por Pares -->
          <app-peer-risk-pending-table
            *ngIf="activeTab() === 'PEERS'"
            [protocols]="peerPendingProtocols()"
            (assignmentCompleted)="refreshData()"
          >
          </app-peer-risk-pending-table>
        </main>
        <!-- Radar de plazos, KPI y auditoría retirados en F00-T01b (componentes se borran en F08) -->
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-secretaria.page.scss'],
})
export class DashboardSecretariaPage implements OnInit {
  private stateService = inject(SecretariatDashboardService);
  private loadPendingPeerProtocolsUC = inject(LoadPendingPeerAssignmentProtocolsUseCase);
  private route = inject(ActivatedRoute);

  isLoading = this.stateService.isLoading;
  searchQuery = this.stateService.searchQuery;
  metrics = this.stateService.metrics;
  protocols = this.stateService.protocols;
  filteredProtocols = this.stateService.filteredProtocols;

  activeTab = signal<'WORKFLOW' | 'PEERS'>('WORKFLOW');

  // Signal para almacenar la respuesta real de la bandeja de asignación del backend
  peerPendingProtocolsSignal = signal<any[]>([]);

  // Formatos anidados o planos de /pending-peer-assignment (F01 T01-0: conversión extraída
  // a pending-peer-protocol.util.ts, que también usa /estratificacion-riesgo)
  peerPendingProtocols = computed<PendingPeerAssignmentProtocol[]>(() =>
    toPendingPeerProtocols(this.peerPendingProtocolsSignal()),
  );

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'peers') {
        this.activeTab.set('PEERS');
      }
    });
    this.refreshData();
  }

  refreshData() {
    this.stateService.loadDashboardData().subscribe();
    this.loadPendingPeerProtocolsUC.execute().subscribe({
      next: (list) => {
        this.peerPendingProtocolsSignal.set(Array.isArray(list) ? list : []);
      },
      error: (err) => {
        console.error(
          '[Secretaría] Error al obtener protocolos listos para evaluadores desde el endpoint del backend:',
          err,
        );
      },
    });
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.stateService.updateSearch(input.value);
  }

  onStatusFilterChanged(status: string) {
    this.stateService.updateFilter(status);
  }
}
