import { Component, input, output, ChangeDetectionStrategy, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';

@Component({
  selector: 'app-workflow-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="workflow-card shadow-soft">
      <div class="card-header">
        <div class="header-title">
          <mat-icon color="primary">assignment</mat-icon>
          <h2>Bandeja de Trámites Activos</h2>
        </div>
        <div class="filter-group">
          <button 
            *ngFor="let option of filterOptions" 
            class="filter-btn" 
            [class.active]="selectedFilter() === option.id"
            (click)="onFilterClick(option.id)">
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table mat-table [dataSource]="paginatedProtocols()" class="ops-table">
          
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>CÓDIGO CEISH</th>
            <td mat-cell *matCellDef="let p">
              <span class="code-badge">{{ p.code | protocolCode }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>PROYECTO / INVESTIGADOR</th>
            <td mat-cell *matCellDef="let p">
              <div class="project-cell">
                <span class="title" [matTooltip]="p.title">{{ p.title }}</span>
                <span class="investigator">
                  <mat-icon>person</mat-icon>
                  {{ p.principalInvestigator || 'Investigador Principal' }}
                </span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>ESTADO WORKFLOW</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-badge" [attr.data-status]="p.status?.toUpperCase()">
                {{ getFriendlyStatus(p.status) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="sla">
            <th mat-header-cell *matHeaderCellDef>PLAZO SLA</th>
            <td mat-cell *matCellDef="let p">
              <div class="sla-cell" [class.urgent]="isOverdue(p)">
                <mat-icon>{{ isOverdue(p) ? 'report_problem' : 'schedule' }}</mat-icon>
                <span>{{ getSlaText(p) }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right">GESTIÓN</th>
            <td mat-cell *matCellDef="let p" class="text-right">
              <button 
                mat-flat-button 
                color="primary" 
                class="quick-action-btn"
                [routerLink]="['/dashboard/protocols/workspace', p.id]">
                <mat-icon>arrow_right_alt</mat-icon>
                Workspace
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
        </table>
        
        <div class="empty-state" *ngIf="protocols().length === 0">
          <mat-icon>check_circle</mat-icon>
          <p>¡Gran trabajo! No tienes trámites pendientes en este filtro.</p>
        </div>
      </div>

      <mat-paginator 
        *ngIf="protocols().length > 0"
        [length]="protocols().length" 
        [pageSize]="pageSize()" 
        [pageIndex]="currentPageIndex()"
        [pageSizeOptions]="[10, 25, 50]" 
        (page)="onPageChange($event)" 
        class="premium-paginator">
      </mat-paginator>
    </div>
  `,
  styleUrls: ['./workflow-table.component.scss']
})
export class WorkflowTableComponent {
  protocols = input.required<ProtocolEntity[]>();
  filterChanged = output<string>();

  displayedColumns = ['code', 'title', 'status', 'sla', 'actions'];
  selectedFilter = signal<string>('ALL');

  filterOptions = [
    { id: 'ALL', label: 'Todos' },
    { id: 'SUBMITTED', label: 'Pendientes' },
    { id: 'EN_REVISION_DOCUMENTAL', label: 'Incompletos' },
    { id: 'VALIDATED', label: 'Validados' }
  ];

  currentPageIndex = signal<number>(0);
  pageSize = signal<number>(10);

  paginatedProtocols = computed(() => {
    const list = this.protocols();
    const index = this.currentPageIndex();
    const size = this.pageSize();
    return list.slice(index * size, (index + 1) * size);
  });

  constructor() {
    effect(() => {
      // Reiniciar índice de página a 0 cuando cambien los protocolos (filtro/búsqueda)
      this.protocols();
      untracked(() => {
        this.currentPageIndex.set(0);
      });
    });
  }

  onFilterClick(id: string) {
    this.selectedFilter.set(id);
    this.filterChanged.emit(id);
  }

  onPageChange(event: PageEvent) {
    this.currentPageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  isOverdue(protocol: ProtocolEntity): boolean {
    if (!protocol.deadline) return false;
    return new Date(protocol.deadline) < new Date();
  }

  getSlaText(protocol: ProtocolEntity): string {
    if (!protocol.deadline) return 'Sin límite';
    const now = new Date();
    const deadline = new Date(protocol.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Vencido hace ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Vence hoy';
    return `${diffDays} días restantes`;
  }

  getFriendlyStatus(status: string): string {
    if (!status) return 'DESCONOCIDO';
    const s = status.toUpperCase();
    if (s === 'SUBMITTED' || s === 'PRESENTADO') return 'INCOMPLETO';
    if (s === 'DRAFT' || s === 'BORRADOR') return 'BORRADOR';
    if (s === 'EN_REVISION_DOCUMENTAL' || s === 'EN_REVISION_SECRETARIA' || s === 'OBSERVADO' || s === 'OBSERVED' || s === 'INICIADO') return 'PENDIENTE';
    if (s === 'PENDIENTE_SUBSANACION' || s === 'PENDIENTE') return 'PENDIENTE';
    if (s === 'VALIDATED' || s === 'VALIDADO' || s === 'COMPLETO') return 'VALIDADO';
    if (s === 'INCOMPLETO') return 'INCOMPLETO';
    if (s === 'EN_EVALUACION') return 'EN EVALUACIÓN';
    if (s === 'DISCREPANCIA_RIESGO' || s === 'DISCREPANCIA_DE_RIESGO' || s === 'DISCREPANCIA DE RIESGO') return 'DISCREPANCIA DE RIESGO';
    if (s === 'APPROVED' || s === 'APROBADO') return 'APROBADO';
    if (s === 'ARCHIVADO' || s === 'ARCHIVADO_VENCIMIENTO') return 'ARCHIVADO';
    return status;
  }
}
