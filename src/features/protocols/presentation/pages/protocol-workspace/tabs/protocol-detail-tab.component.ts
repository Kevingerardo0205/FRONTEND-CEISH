import {
  Component,
  DestroyRef,
  inject,
  computed,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import {
  WORKSPACE_ACTION_ROLES,
  WORKSPACE_SECTION_ROLES,
} from '../../../../domain/workspace-tab-roles';
import { resolveEstado } from '@shared/utils/estado.resolver';
import { ProtocolStatusLabelPipe } from '@shared/pipes/protocol-status-label.pipe';
import { ProtocolStatusClassPipe } from '@shared/pipes/protocol-status-class.pipe';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { ProtocolTrailEvent } from '@features/audit/domain/entities/audit.entity';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { RISK_LEVEL_UNSET_LABEL } from '../../../../domain/protocol-header';

/** Textos vacíos de la pestaña Información (F10 D19, decisión de la usuaria del 18/11/2026). */
export const NO_PRINCIPAL_INVESTIGATOR_LABEL = 'Sin investigador principal';
export const NO_STUDY_TYPE_LABEL = 'Sin tipo de estudio';

@Component({
  selector: 'app-protocol-detail-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    RouterModule,
    ProtocolStatusLabelPipe,
    ProtocolStatusClassPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  template: `
    <div class="tab-container animate-fade-in" *ngIf="protocol()">
      <div class="info-card">
        <div class="header-row d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title mb-0">Resumen del Proyecto</h3>
          <button
            *ngIf="isEditable()"
            [routerLink]="['/investigador/protocolo', protocol()?.id, 'editar']"
            class="edit-btn-inline"
          >
            <mat-icon>edit</mat-icon> Completar / Editar Datos
          </button>
        </div>
        <mat-divider class="mb-4"></mat-divider>

        <div class="info-grid">
          <div class="info-item">
            <label>Tipo de Estudio</label>
            <p data-testid="study-type">{{ studyTypeLabel() }}</p>
          </div>
          <div class="info-item">
            <label>Investigador Principal</label>
            <p data-testid="principal-investigator">{{ principalInvestigatorLabel() }}</p>
          </div>
          <div class="info-item full-width">
            <label>Título del Proyecto</label>
            <p class="project-title">{{ protocol()?.title }}</p>
          </div>
          <div class="info-item">
            <label>Nivel de Riesgo</label>
            <p data-testid="risk-level">{{ riskLevelLabel() }}</p>
          </div>
        </div>

        <!-- Campos Diferidos / Opcionales -->
        <h4 class="section-subtitle mt-4 mb-3" *ngIf="hasDeferredData()">
          <mat-icon>info</mat-icon> Detalles Adicionales
        </h4>
        <div class="info-grid mt-2" *ngIf="hasDeferredData()">
          <div class="info-item" *ngIf="protocol()?.geographicCoverage">
            <label>Cobertura Geográfica</label>
            <p>{{ protocol()?.geographicCoverage }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.studyDurationMonths">
            <label>Duración Estimada</label>
            <p>{{ protocol()?.studyDurationMonths }} meses</p>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: CUERPO EVALUADOR (PET 2026) -->
      <div class="evaluators-section mt-4" *ngIf="showEvaluators()">
        <div class="header-row d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title mb-0">Cuerpo Evaluador Asignado</h3>
          <span class="badge-count" *ngIf="!evaluationsError() && !evaluationsLoading()"
            >{{ evaluations().length }} Miembros</span
          >
        </div>

        <!-- F10 D14: un error nunca se muestra como "sin evaluadores" -->
        @if (evaluationsError()) {
          <app-error-state
            message="No pudimos cargar el cuerpo evaluador."
            (retry)="retryEvaluations()"
          ></app-error-state>
        } @else if (evaluationsLoading()) {
          <app-loading-state message="Cargando el cuerpo evaluador…"></app-loading-state>
        } @else {
        <div class="eval-list">
          <div class="eval-card" *ngFor="let ev of evaluations()">
            <div class="eval-identity">
              <div class="avatar">{{ ev.investigator ? ev.investigator[0] : 'E' }}</div>
              <div class="info">
                <span class="name">{{ ev.investigator || 'Evaluador Asignado' }}</span>
                <span class="role-tag">Evaluador Ético</span>
              </div>
            </div>

            <div class="eval-status-pills">
              <span class="status-pill" [ngClass]="ev.status.toLowerCase()">
                {{ ev.status === 'COMPLETED' ? 'Dictamen Enviado' : 'Pendiente' }}
              </span>
            </div>
          </div>
        </div>

        <div class="empty-evals" *ngIf="!evaluationsLoading() && evaluations().length === 0">
          <mat-icon>group_off</mat-icon>
          <p>No se han asignado evaluadores a este protocolo aún.</p>
        </div>
        }
      </div>

      <div class="docs-section mt-4">
        <h3 class="section-title">Documentación Cargada</h3>
        <div class="doc-list">
          <div class="doc-item" *ngFor="let doc of protocol()?.documents">
            <mat-icon>description</mat-icon>
            <div class="doc-info">
              <span class="doc-name">{{ doc.name }}</span>
              <span class="doc-meta">Versión {{ protocol()?.version || '1.0' }} • PDF</span>
            </div>
            <button class="download-btn">
              <mat-icon>download</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: HISTORIAL DE VERSIONES / LÍNEA DE TIEMPO -->
      <div class="history-section mt-4" *ngIf="versions().length > 0">
        <h3 class="section-title mb-3 d-flex align-items-center gap-2">
          <mat-icon style="color: #003366;">history</mat-icon>
          Historial de Versiones del Expediente
        </h3>

        <div class="timeline-scaffold">
          <div class="timeline-item" *ngFor="let ver of versions(); let first = first">
            <div
              class="timeline-marker"
              [class.current]="ver.versionNumber === (protocol()?.version || 1)"
            >
              <div class="marker-dot"></div>
              <div class="marker-line" *ngIf="!first"></div>
            </div>

            <div class="timeline-content-card p-3 border rounded mb-3 bg-white shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="version-info">
                  <span class="version-tag fw-bold">Versión {{ ver.versionNumber }}.0</span>
                  <span
                    class="current-badge ms-2"
                    *ngIf="ver.versionNumber === (protocol()?.version || 1)"
                    >Versión Activa</span
                  >
                </div>
                <span class="status-badge" [ngClass]="ver.status | protocolStatusClass">
                  {{ ver.status | protocolStatusLabel }}
                </span>
              </div>

              <p class="small text-muted mb-1" *ngIf="ver.createdAt">
                <strong>Creada el:</strong> {{ ver.createdAt | date: 'dd MMM, yyyy - HH:mm' }}
              </p>

              <!-- Detalles si fue observada / requiere subsanación -->
              <div
                class="observation-details mt-2 p-3 bg-red-soft rounded border-start border-danger border-3"
                *ngIf="
                  resolveEstado(ver.status)?.code === 'REQUIERE_SUBSANACION_VERSION' ||
                  ver.majorObservations ||
                  ver.minorObservations
                "
              >
                <h5 class="fw-bold small text-danger text-uppercase mb-2">
                  Dictamen de Observaciones Ético-Científicas
                </h5>
                <p class="small mb-2" *ngIf="ver.majorObservations">
                  <strong>Observaciones Mayores:</strong> {{ ver.majorObservations }}
                </p>
                <p class="small mb-2" *ngIf="ver.minorObservations">
                  <strong>Observaciones Menores:</strong> {{ ver.minorObservations }}
                </p>
                <p class="small mb-0" *ngIf="ver.correctionProcedure">
                  <strong>Procedimiento de Subsanación:</strong> {{ ver.correctionProcedure }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- F11 V10 a V13 (EP4): bitácora solo con AUDIT_TRAIL; datos reales o su estado -->
      <div class="audit-section mt-4" *ngIf="showAuditTrail()" data-testid="audit-trail">
        <h3 class="section-title mb-3 d-flex align-items-center gap-2">
          <mat-icon style="color: #003366;">verified</mat-icon>
          Bitácora de Trazabilidad de Auditoría
        </h3>

        @if (auditTrailError()) {
          <app-error-state
            message="No pudimos cargar la bitácora del protocolo."
            (retry)="retryAuditTrail()"
          ></app-error-state>
        } @else if (auditTrailLoading()) {
          <app-loading-state message="Cargando la bitácora…"></app-loading-state>
        } @else if (auditTrail().length === 0) {
          <app-empty-state message="Aún no hay eventos registrados para este protocolo."></app-empty-state>
        } @else {
        <div class="timeline-scaffold">
          <div class="timeline-item" *ngFor="let ev of auditTrail(); let first = first">
            <div class="timeline-marker" [class.current]="first">
              <div class="marker-dot"></div>
              <div class="marker-line" *ngIf="!first"></div>
            </div>

            <div class="timeline-content-card p-3 border rounded mb-3 bg-white shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold text-primary">{{ ev.action }}</span>
                <span
                  class="badge-status-simple text-uppercase"
                  style="font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1;"
                  [ngClass]="ev.status.toLowerCase()"
                >
                  {{ ev.status }}
                </span>
              </div>

              <p class="small mb-1" style="margin: 0; font-size: 0.8rem; color: #334155;">
                <strong>Responsable:</strong> {{ ev.responsible }}
              </p>

              <p class="small text-muted mb-0" style="margin: 0; font-size: 0.75rem;">
                <strong>Fecha/Hora:</strong> {{ ev.date | date: 'dd MMM, yyyy - HH:mm:ss' }}
              </p>
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .tab-container {
        max-width: 950px;
        margin: 0 auto;
      }
      .info-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
      }
      .section-title {
        font-size: 1.15rem;
        color: #0f172a;
        font-weight: 800;
      }
      .section-subtitle {
        font-size: 0.95rem;
        color: #334155;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .info-item {
        label {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }
        p {
          margin: 0;
          color: #1e293b;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .project-title {
          font-weight: 500;
          color: #334155;
          line-height: 1.4;
        }
      }
      .full-width {
        grid-column: span 2;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .badge-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      /* Evaluators Styling */
      .eval-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .eval-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: border-color 0.2s;
        &:hover {
          border-color: #cbd5e1;
        }
      }
      .eval-identity {
        display: flex;
        align-items: center;
        gap: 1rem;
        .avatar {
          width: 36px;
          height: 36px;
          background: #e2e8f0;
          color: #64748b;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
        }
        .info {
          display: flex;
          flex-direction: column;
          .name {
            font-weight: 700;
            color: #1e293b;
            font-size: 0.9rem;
          }
          .role-tag {
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 600;
          }
        }
      }
      .eval-status-pills {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .status-pill {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        &.pending {
          background: #f8fafc;
          color: #64748b;
        }
        &.completed {
          background: #f0fdf4;
          color: #166534;
        }
      }
      .empty-evals {
        padding: 3rem;
        text-align: center;
        color: #94a3b8;
        background: #f8fafc;
        border-radius: 16px;
        border: 1px dashed #e2e8f0;
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          margin-bottom: 0.5rem;
        }
        p {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }
      .doc-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .doc-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        .doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .doc-name {
            font-weight: 600;
            color: #1e293b;
          }
          .doc-meta {
            font-size: 0.75rem;
            color: #94a3b8;
          }
        }
        .download-btn {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
          &:hover {
            background: #eff6ff;
          }
        }
      }

      /* Timeline styles */
      .timeline-scaffold {
        display: flex;
        flex-direction: column-reverse;
        margin-top: 1.5rem;
        position: relative;
      }
      .timeline-item {
        display: flex;
        gap: 1.5rem;
        position: relative;
      }
      .timeline-marker {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        width: 20px;
        .marker-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #cbd5e1;
          border: 2px solid white;
          z-index: 2;
          box-shadow: 0 0 0 2px #cbd5e1;
          margin-top: 6px;
        }
        .marker-line {
          width: 2px;
          position: absolute;
          top: 18px;
          bottom: -18px;
          background: #e2e8f0;
          z-index: 1;
        }
        &.current .marker-dot {
          background: var(--accent, #3b82f6);
          box-shadow:
            0 0 0 2px var(--accent, #3b82f6),
            0 0 8px rgba(59, 130, 246, 0.4);
        }
      }
      .timeline-content-card {
        flex: 1;
        transition: all 0.2s ease;
        border-radius: 12px !important;
        border: 1px solid #e2e8f0;
      }
      .version-tag {
        font-size: 0.9rem;
        color: #1e293b;
      }
      .current-badge {
        font-size: 0.7rem;
        background: #eff6ff;
        color: #1e40af;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .bg-red-soft {
        background: #fff5f5;
      }
      .observation-details {
        border-radius: 8px !important;
      }

      .mt-4 {
        margin-top: 1.5rem;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ProtocolDetailTabPage {
  private workspaceService = inject(ProtocolWorkspaceService);
  private activeRoleFacade = inject(ActiveRoleFacade);
  private auditUseCase = inject(AuditUseCase);
  private destroyRef = inject(DestroyRef);

  resolveEstado = resolveEstado;

  protocol = this.workspaceService.protocol;

  /** F10 D19: el nombre del tipo de estudio (`studyType`), no el código. */
  studyTypeLabel = computed(() => this.protocol()?.studyType || NO_STUDY_TYPE_LABEL);
  /** F10 D19: `principalInvestigator.fullName`; nunca «Cargando...» ni «[object Object]». */
  principalInvestigatorLabel = computed(
    () => this.protocol()?.principalInvestigator || NO_PRINCIPAL_INVESTIGATOR_LABEL,
  );
  /** F10 D19: el nivel de riesgo se muestra siempre; sin fijar (null) → «Sin fijar». */
  riskLevelLabel = computed(() => this.protocol()?.riskLevel || RISK_LEVEL_UNSET_LABEL);
  auditTrail = signal<ProtocolTrailEvent[]>([]);
  auditTrailLoading = signal(false);
  auditTrailError = signal(false);
  private auditTrailSub?: Subscription;

  constructor() {
    // F11 V10 (EP4): la bitácora se pide solo con el rol activo en AUDIT_TRAIL; el INVESTIGADOR
    // (y el EVALUADOR) no la ven ni la piden.
    effect(() => {
      const p = this.protocol();
      if (p?.id && this.showAuditTrail()) {
        untracked(() => this.loadAuditTrail(String(p.id)));
      }
    });
    this.destroyRef.onDestroy(() => this.auditTrailSub?.unsubscribe());

    // F10 D14 (EARS 28): las evaluaciones las pide el Resumen y solo si muestra el cuerpo
    // evaluador. Lee el objeto `protocol`, así que también se vuelven a pedir al recargar
    // el mismo :id (Reintentar, D14).
    effect(() => {
      const p = this.protocol();
      if (p?.id && this.showEvaluators()) {
        untracked(() => this.workspaceService.loadEvaluations(p.id));
      }
    });
  }
  evaluations = this.workspaceService.evaluations;
  evaluationsLoading = this.workspaceService.evaluationsLoading;
  evaluationsError = this.workspaceService.evaluationsError;

  retryEvaluations(): void {
    this.workspaceService.refreshEvaluations();
  }

  /** F11 V10: bitácora solo con el rol activo en `AUDIT_TRAIL` (SECRETARIA y PRESIDENTE). */
  showAuditTrail(): boolean {
    const activeRole = this.activeRoleFacade.activeRole();
    return !!activeRole && WORKSPACE_SECTION_ROLES.AUDIT_TRAIL.includes(activeRole);
  }

  /** F11 V12: «Reintentar» vuelve a pedir la bitácora del protocolo abierto. */
  retryAuditTrail(): void {
    const id = this.protocol()?.id;
    if (id && this.showAuditTrail()) this.loadAuditTrail(String(id));
  }

  /** F11 V11: datos reales o su estado; un error nunca se muestra como vacío. Gana la última. */
  private loadAuditTrail(protocolId: string): void {
    this.auditTrailSub?.unsubscribe();
    this.auditTrailError.set(false);
    this.auditTrailLoading.set(true);
    this.auditTrailSub = this.auditUseCase.getProtocolTrail(protocolId).subscribe({
      next: (trail) => {
        this.auditTrail.set(trail);
        this.auditTrailLoading.set(false);
      },
      error: () => {
        this.auditTrail.set([]);
        this.auditTrailLoading.set(false);
        this.auditTrailError.set(true);
      },
    });
  }

  /** F10 D17 (2): cuerpo evaluador solo con el rol activo en `EVALUATOR_PANEL`. */
  showEvaluators(): boolean {
    const activeRole = this.activeRoleFacade.activeRole();
    return !!activeRole && WORKSPACE_SECTION_ROLES.EVALUATOR_PANEL.includes(activeRole);
  }

  versions = computed(() => {
    const p = this.protocol();
    if (!p) return [];
    if (p.versions && p.versions.length > 0) {
      return p.versions;
    }
    return [
      {
        id: 0,
        versionNumber:
          typeof p.version === 'number' ? p.version : parseInt(p.version as string, 10) || 1,
        status: p.status,
        createdAt: p.submissionDate,
      },
    ];
  });

  isEditable(): boolean {
    const p = this.protocol();
    if (!p) return false;
    // F10 D17 (3): la misma regla de rol que "Completar / Editar" de la cabecera (D12).
    const activeRole = this.activeRoleFacade.activeRole();
    const status = p.status as string;
    const core = resolveEstado(status);
    const code = core?.code || status;
    return (
      !!activeRole &&
      WORKSPACE_ACTION_ROLES.EDIT_PROTOCOL.includes(activeRole) &&
      status?.toUpperCase() !== 'BORRADOR' &&
      (code === 'INICIADO' || code === 'REQUIERE_SUBSANACION_DOC' || code === 'INCOMPLETO')
    );
  }

  hasDeferredData(): boolean {
    const p = this.protocol();
    if (!p) return false;
    return !!(
      p.geographicCoverage ||
      p.studyDurationMonths ||
      p.lugarEjecucion ||
      p.fechaInicioEstimada ||
      p.fechaFinEstimada ||
      p.sponsorRuc ||
      p.sponsorExecutingAgency ||
      p.financingAmount
    );
  }
}
