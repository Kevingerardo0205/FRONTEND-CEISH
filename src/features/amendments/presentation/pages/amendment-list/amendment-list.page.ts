import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  AmendmentItem, 
  AmendmentStatus, 
  AmendmentSeverity, 
  AmendmentType 
} from '../../../domain/entities/amendment.entity';
import { LoadAmendmentsUseCase } from '../../../application/load-amendments.use-case';
import { ReviewAmendmentUseCase } from '../../../application/review-amendment.use-case';
import { AmendmentReviewDialogComponent } from '../../components/amendment-review-dialog.component';

@Component({
  selector: 'app-amendment-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amendments-page-layout animate-fade-in">
      <!-- HEADER DE GESTIÓN -->
      <header class="page-top-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div class="header-titles">
          <div class="badge-chip d-inline-flex align-items-center gap-1 mb-1">
            <mat-icon class="badge-icon small-icon">history_edu</mat-icon>
            <span>SEGUIMIENTO BIOÉTICO</span>
          </div>
          <h1 class="page-title m-0">Gestión de Enmiendas a Protocolos</h1>
          <p class="subtitle text-muted m-0">
            Supervisión, evaluación y dictamen de modificaciones a investigaciones aprobadas (Anexos 23/24).
          </p>
        </div>

        <div class="header-actions">
          <button 
            mat-flat-button 
            class="btn-new-amendment"
            (click)="navigateToRequest()">
            <mat-icon>add_circle_outline</mat-icon>
            Nueva Solicitud de Enmienda
          </button>
        </div>
      </header>

      <!-- KPI METRICS SUMMARY -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper total">
            <mat-icon>library_books</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalCount() }}</span>
            <span class="kpi-label">Total Enmiendas</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper pending">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ pendingCount() }}</span>
            <span class="kpi-label">En Revisión</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper approved">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ approvedCount() }}</span>
            <span class="kpi-label">Aprobadas</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper observed">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">{{ observedCount() }}</span>
            <span class="kpi-label">Observadas / Subsanación</span>
          </div>
        </div>
      </div>

      <!-- FILTROS DE ESTADO -->
      <div class="filter-bar d-flex align-items-center gap-2 flex-wrap">
        <span class="filter-label small fw-bold text-muted">Filtrar por estado:</span>
        <button 
          type="button" 
          class="filter-chip-btn" 
          [class.active]="selectedStatusFilter() === 'ALL'"
          (click)="setStatusFilter('ALL')">
          Todas ({{ totalCount() }})
        </button>
        <button 
          type="button" 
          class="filter-chip-btn" 
          [class.active]="selectedStatusFilter() === AmendmentStatus.UNDER_REVIEW || selectedStatusFilter() === AmendmentStatus.SUBMITTED"
          (click)="setStatusFilter(AmendmentStatus.UNDER_REVIEW)">
          Pendientes ({{ pendingCount() }})
        </button>
        <button 
          type="button" 
          class="filter-chip-btn" 
          [class.active]="selectedStatusFilter() === AmendmentStatus.APPROVED"
          (click)="setStatusFilter(AmendmentStatus.APPROVED)">
          Aprobadas ({{ approvedCount() }})
        </button>
        <button 
          type="button" 
          class="filter-chip-btn" 
          [class.active]="selectedStatusFilter() === AmendmentStatus.OBSERVED"
          (click)="setStatusFilter(AmendmentStatus.OBSERVED)">
          Observadas ({{ observedCount() }})
        </button>
      </div>

      <!-- LISTADO DE ENMIENDAS -->
      @if (loading()) {
        <div class="loading-container d-flex flex-column align-items-center justify-content-center p-5">
          <mat-spinner diameter="44"></mat-spinner>
          <span class="text-muted mt-3">Cargando solicitudes de enmiendas...</span>
        </div>
      } @else if (filteredAmendments().length === 0) {
        <div class="empty-state-card text-center p-5 rounded-4 border bg-white">
          <mat-icon class="empty-icon text-muted">content_paste_off</mat-icon>
          <h3 class="mt-3 mb-1 fw-bold text-dark">No se encontraron enmiendas</h3>
          <p class="text-muted small mb-4">No hay registros de enmiendas que coincidan con los filtros seleccionados.</p>
          <button mat-flat-button color="primary" (click)="navigateToRequest()">
            <mat-icon>add</mat-icon>
            Registrar Primera Enmienda
          </button>
        </div>
      } @else {
        <div class="amendments-grid">
          @for (amendment of filteredAmendments(); track amendment.id) {
            <div class="amendment-card rounded-4 p-4 border bg-white shadow-sm">
              <div class="card-header d-flex justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="protocol-code fw-bold">{{ amendment.protocolCode }}</span>
                    <span class="version-tag">Versión {{ amendment.versionNumber }}</span>
                  </div>
                  <h3 class="protocol-title m-0">{{ amendment.protocolTitle }}</h3>
                </div>

                <div class="status-badge" [ngClass]="getStatusBadgeClass(amendment.status)">
                  <mat-icon class="status-icon">{{ getStatusIcon(amendment.status) }}</mat-icon>
                  <span>{{ getStatusLabel(amendment.status) }}</span>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="chip-tag severity" [ngClass]="amendment.severity === 'SUBSTANTIAL' ? 'substantial' : 'minor'">
                  <mat-icon class="tiny-icon">{{ amendment.severity === 'SUBSTANTIAL' ? 'warning' : 'info' }}</mat-icon>
                  {{ amendment.severity === 'SUBSTANTIAL' ? 'Modificación Sustancial' : 'Modificación Menor' }}
                </span>
                <span class="chip-tag type">
                  {{ getTypeLabel(amendment.type) }}
                </span>
                <span class="chip-tag investigator">
                  <mat-icon class="tiny-icon">person</mat-icon>
                  {{ amendment.investigatorName }}
                </span>
              </div>

              <div class="card-body-content mb-3">
                <div class="info-block mb-2">
                  <span class="label text-muted small fw-bold">Justificación:</span>
                  <p class="text-dark small m-0">{{ amendment.justification }}</p>
                </div>
                <div class="info-block mb-2">
                  <span class="label text-muted small fw-bold">Impacto Bioético:</span>
                  <p class="text-secondary small m-0">{{ amendment.ethicalImpactDescription }}</p>
                </div>

                @if (amendment.reviewNotes) {
                  <div class="review-feedback-box p-3 rounded-3 mt-2" [ngClass]="amendment.status === 'APPROVED' ? 'approved-box' : 'observed-box'">
                    <span class="feedback-title fw-bold small d-block">
                      <mat-icon class="tiny-icon">rate_review</mat-icon>
                      Dictamen del Comité ({{ amendment.reviewedBy || 'CEISH' }}):
                    </span>
                    <p class="small m-0 mt-1">{{ amendment.reviewNotes }}</p>
                  </div>
                }
              </div>

              <!-- DOCUMENTOS ADJUNTOS -->
              <div class="documents-bar p-2 rounded-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div class="d-flex align-items-center gap-2">
                  <mat-icon class="text-primary small-icon">attach_file</mat-icon>
                  <span class="small fw-bold text-secondary">Documentos Adjuntos ({{ amendment.documents.length }}):</span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  @for (doc of amendment.documents; track doc.name) {
                    <span class="doc-pill small" [matTooltip]="doc.name">
                      <mat-icon class="tiny-icon">description</mat-icon>
                      {{ doc.name }}
                    </span>
                  }
                </div>
              </div>

              <!-- ACCIONES DE LA TARJETA -->
              <div class="card-actions d-flex justify-content-between align-items-center pt-2 border-top">
                <span class="date-text text-muted small">
                  Enviado el {{ amendment.submittedAt | date:'dd/MM/yyyy HH:mm' }}
                </span>

                <div class="action-buttons d-flex gap-2">
                  <button 
                    mat-stroked-button 
                    color="primary"
                    (click)="openReviewDialog(amendment)">
                    <mat-icon>rate_review</mat-icon>
                    Emitir Dictamen
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .amendments-page-layout {
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .badge-chip {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #003366;
    }

    .btn-new-amendment {
      background-color: #003366 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 700;
      padding: 0 20px;
      height: 48px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }

    .kpi-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 24px; }
      &.total { background: #eff6ff; color: #2563eb; }
      &.pending { background: #fffbeb; color: #d97706; }
      &.approved { background: #f0fdf4; color: #16a34a; }
      &.observed { background: #fef2f2; color: #dc2626; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      .kpi-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
      .kpi-label { font-size: 0.8rem; color: #64748b; font-weight: 600; }
    }

    .filter-chip-btn {
      border: 1px solid #cbd5e1;
      background: white;
      color: #475569;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: #f1f5f9; }
      &.active { background: #003366; color: white; border-color: #003366; }
    }

    .amendments-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .amendment-card {
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important; }
    }

    .protocol-code { color: #003366; font-size: 0.95rem; }
    .version-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .protocol-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      .status-icon { font-size: 16px; width: 16px; height: 16px; }
      &.badge-submitted, &.badge-under-review { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      &.badge-approved { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
      &.badge-observed { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
      &.badge-rejected { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
    }

    .chip-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      &.substantial { background: #fee2e2; color: #991b1b; }
      &.minor { background: #e0f2fe; color: #075985; }
      &.type { background: #f3e8ff; color: #6b21a8; }
      &.investigator { background: #f1f5f9; color: #334155; }
    }

    .tiny-icon { font-size: 14px; width: 14px; height: 14px; }
    .small-icon { font-size: 18px; width: 18px; height: 18px; }

    .review-feedback-box {
      border: 1px solid transparent;
      &.approved-box { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
      &.observed-box { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    }

    .doc-pill {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #334155;
    }
  `]
})
export class AmendmentListPage implements OnInit {
  private readonly loadAmendmentsUseCase = inject(LoadAmendmentsUseCase);
  private readonly reviewAmendmentUseCase = inject(ReviewAmendmentUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly AmendmentStatus = AmendmentStatus;
  readonly loading = signal<boolean>(true);
  readonly amendments = signal<AmendmentItem[]>([]);
  readonly selectedStatusFilter = signal<string>('ALL');

  readonly totalCount = computed(() => this.amendments().length);
  readonly pendingCount = computed(() => 
    this.amendments().filter(a => a.status === AmendmentStatus.UNDER_REVIEW || a.status === AmendmentStatus.SUBMITTED).length
  );
  readonly approvedCount = computed(() => 
    this.amendments().filter(a => a.status === AmendmentStatus.APPROVED).length
  );
  readonly observedCount = computed(() => 
    this.amendments().filter(a => a.status === AmendmentStatus.OBSERVED).length
  );

  readonly filteredAmendments = computed(() => {
    const filter = this.selectedStatusFilter();
    const list = this.amendments();
    if (filter === 'ALL') return list;
    if (filter === AmendmentStatus.UNDER_REVIEW) {
      return list.filter(a => a.status === AmendmentStatus.UNDER_REVIEW || a.status === AmendmentStatus.SUBMITTED);
    }
    return list.filter(a => a.status === filter);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadAmendmentsUseCase.execute().subscribe({
      next: (data) => {
        this.amendments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar la lista de enmiendas', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
  }

  navigateToRequest(): void {
    this.router.navigate(['/amendments/request']);
  }

  openReviewDialog(amendment: AmendmentItem): void {
    const ref = this.dialog.open(AmendmentReviewDialogComponent, {
      width: '600px',
      data: { amendment }
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.reviewAmendmentUseCase.execute(res).subscribe({
          next: () => {
            this.snackBar.open('Dictamen de enmienda emitido exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: () => {
            this.snackBar.open('Error al guardar el dictamen de enmienda', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  getStatusLabel(status: AmendmentStatus): string {
    switch (status) {
      case AmendmentStatus.SUBMITTED: return 'Enviada';
      case AmendmentStatus.UNDER_REVIEW: return 'En Revisión';
      case AmendmentStatus.APPROVED: return 'Aprobada';
      case AmendmentStatus.OBSERVED: return 'Observada';
      case AmendmentStatus.REJECTED: return 'Rechazada';
      default: return status;
    }
  }

  getStatusBadgeClass(status: AmendmentStatus): string {
    switch (status) {
      case AmendmentStatus.SUBMITTED: return 'badge-submitted';
      case AmendmentStatus.UNDER_REVIEW: return 'badge-under-review';
      case AmendmentStatus.APPROVED: return 'badge-approved';
      case AmendmentStatus.OBSERVED: return 'badge-observed';
      case AmendmentStatus.REJECTED: return 'badge-rejected';
      default: return '';
    }
  }

  getStatusIcon(status: AmendmentStatus): string {
    switch (status) {
      case AmendmentStatus.SUBMITTED: return 'send';
      case AmendmentStatus.UNDER_REVIEW: return 'schedule';
      case AmendmentStatus.APPROVED: return 'check_circle';
      case AmendmentStatus.OBSERVED: return 'warning';
      case AmendmentStatus.REJECTED: return 'cancel';
      default: return 'help';
    }
  }

  getTypeLabel(type: AmendmentType): string {
    switch (type) {
      case AmendmentType.METHODOLOGY: return 'Metodología';
      case AmendmentType.INFORMED_CONSENT: return 'Consentimiento Informado';
      case AmendmentType.INVESTIGATION_TEAM: return 'Equipo Investigador';
      case AmendmentType.SCHEDULE: return 'Cronograma';
      case AmendmentType.BUDGET: return 'Presupuesto';
      case AmendmentType.SAMPLE_SIZE: return 'Muestra y Criterios';
      case AmendmentType.OTHER: return 'Otros Cambios';
      default: return type;
    }
  }
}
