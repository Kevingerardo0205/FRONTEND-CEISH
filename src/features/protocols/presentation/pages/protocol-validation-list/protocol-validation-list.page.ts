import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Component({
  selector: 'app-protocol-validation-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterModule, StatCardComponent],
  template: `
    <div class="dashboard-page animate-fade-in">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Secretaría / Validación</div>
          <h1 class="page-title">Validación Documental</h1>
          <p class="page-subtitle">Revise y valide la integridad de los protocolos ingresados (PET 2023)</p>
        </div>
      </div>

      <div class="stats-grid mb-4">
        <app-stat-card label="Pendientes" [value]="pendingCount()" icon="pending_actions" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Observados" [value]="1" icon="assignment_late" color="#ef4444"></app-stat-card>
        <app-stat-card label="Validados Hoy" [value]="5" icon="task_alt" color="#10b981"></app-stat-card>
      </div>

      <div class="content-card shadow-soft">
        <div class="table-toolbar p-3">
          <h2 class="section-title m-0">Protocolos por Validar</h2>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="protocols()" class="modern-table">
            
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef> Fecha Envío </th>
              <td mat-cell *matCellDef="let p"> 
                {{ p.submissionDate | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="titulo">
              <th mat-header-cell *matHeaderCellDef> Información del Proyecto </th>
              <td mat-cell *matCellDef="let p"> 
                <div class="project-cell">
                  <span class="main-title">{{ p.title }}</span>
                  <span class="investigator-info">{{ p.investigator || 'Investigador Principal' }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef> Tipo </th>
              <td mat-cell *matCellDef="let p"> 
                <span class="type-badge" [ngClass]="p.type?.toLowerCase()">{{ p.type }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-end"> Gestión </th>
              <td mat-cell *matCellDef="let p" class="text-end">
                <button mat-flat-button color="primary" class="review-btn" [routerLink]="['/dashboard/protocols/validation/detail', p.id]">
                  <mat-icon>verified</mat-icon>
                  Validar
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1rem; }
    .breadcrumb-chip { background: rgba(0, 51, 102, 0.05); color: #003366; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: inline-block; margin-bottom: 0.5rem; }
    .page-title { font-size: 1.85rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 0.95rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
    .content-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
    .table-toolbar { border-bottom: 1px solid #f1f5f9; }
    .modern-table { width: 100%; th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 1.25rem 1rem; } td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; } }
    .project-cell { display: flex; flex-direction: column; .main-title { font-weight: 700; color: #1e293b; font-size: 0.9rem; } .investigator-info { color: #94a3b8; font-size: 0.75rem; } }
    .type-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; &.io { background: #eff6ff; color: #2563eb; } &.ec { background: #fff7ed; color: #f59e0b; } &.ei { background: #f0fdf4; color: #16a34a; } }
    .review-btn { border-radius: 10px; font-weight: 700; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationListPage implements OnInit {
  private protocolRepo = inject(IProtocolRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  displayedColumns = ['fecha', 'titulo', 'tipo', 'acciones'];
  
  protocols = signal<ProtocolEntity[]>([]);
  pendingCount = signal(0);

  ngOnInit() {
    this.loadProtocols();

    this.notificationBroker.on('PROTOCOL_STATUS_UPDATED').subscribe(() => {
      this.loadProtocols();
    });
  }

  loadProtocols() {
    this.protocolRepo.getAll().subscribe(data => {
      this.protocols.set(data);
      this.pendingCount.set(data.length);
    });
  }
}
