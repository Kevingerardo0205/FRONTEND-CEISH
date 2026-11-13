import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  PendingPeerAssignmentProtocol,
  AssignEvaluatorsResponse,
  PEER_ASSIGNMENT_QUOTA,
} from '@domain/entities/peer-evaluation.entity';
import { ErrorStateComponent } from '@shared/ui/states/states.component';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import {
  NO_PROFILE_LABEL,
  formatDeadlineDate,
  peerEvaluatorProfileLabel,
} from '@features/evaluations/presentation/utils/active-assignment-view.util';

/** "a, b, c y d" (F10 D15). */
function joinSpanish(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

const QUOTA_TOTAL = PEER_ASSIGNMENT_QUOTA.total;

/** Textos del modal armados desde PEER_ASSIGNMENT_QUOTA (F10 D15): nada escrito a mano. */
export const PEER_QUOTA_TEXT = {
  instruction:
    `Seleccione exactamente ${QUOTA_TOTAL} evaluadores, ` +
    `${PEER_ASSIGNMENT_QUOTA.perProfile === 1 ? 'uno' : PEER_ASSIGNMENT_QUOTA.perProfile} por cada perfil: ` +
    `${joinSpanish(PEER_ASSIGNMENT_QUOTA.profiles.map((p) => peerEvaluatorProfileLabel(p)))}. ` +
    `El sistema elegirá al azar a ${PEER_ASSIGNMENT_QUOTA.riskPeers}, sin contar ` +
    `${peerEvaluatorProfileLabel(PEER_ASSIGNMENT_QUOTA.riskExcludedProfile)}, para la estratificación de riesgo.`,
  selectLabel: `Evaluadores (exactamente ${QUOTA_TOTAL})`,
  tooMany: `Seleccione solo ${QUOTA_TOTAL} evaluadores.`,
} as const;

export const NO_DEADLINE_TEXT =
  'La fecha límite del dictamen se fija cuando el protocolo entre en una convocatoria.';

@Component({
  selector: 'app-assign-peers-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ErrorStateComponent,
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="title-area">
          <mat-icon color="primary">people</mat-icon>
          <h2>Asignación de Cuerpo Evaluador</h2>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn" [disabled]="isSubmitting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <!-- F10 D15: solo los datos que existen, sin rellenos -->
        <div class="protocol-card">
          @if (data.protocol.ceishCode) {
            <span class="code">{{ data.protocol.ceishCode }}</span>
          }
          <h3 class="title">{{ data.protocol.title }}</h3>
          <div class="metadata">
            @if (getInvestigatorName(); as investigator) {
              <span class="meta-investigator"><strong>Investigador:</strong> {{ investigator }}</span>
            }
            @if (data.protocol.studyType.nombre; as studyType) {
              <span class="meta-type"><strong>Tipo:</strong> {{ studyType }}</span>
            }
          </div>
        </div>

        <div class="instruction-box">
          <mat-icon>info</mat-icon>
          <div class="text">
            <p class="quota-instruction">{{ quotaText.instruction }}</p>
          </div>
        </div>

        @if (loadError()) {
          <app-error-state
            message="No pudimos cargar la lista de evaluadores."
            (retry)="loadEvaluators()"
          ></app-error-state>
        }

        <form class="assign-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ quotaText.selectLabel }}</mat-label>
            <mat-select
              [formControl]="evaluatorsControl"
              multiple
              placeholder="Busque y seleccione evaluadores"
            >
              <mat-select-trigger>
                {{ getSelectedUniqueCount() }} evaluadores seleccionados
              </mat-select-trigger>
              <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                <div class="eval-option">
                  <div class="eval-main">
                    <span class="name">{{ ev.nombre }}</span>
                    <span class="badge-perfil">{{ ev.perfil }}</span>
                  </div>
                  <span class="workload" [ngClass]="getWorkloadClass(ev.cargaActiva)">
                    Carga: {{ ev.cargaActiva }} (Mes: {{ ev.completadasMes }})
                  </span>
                </div>
              </mat-option>
            </mat-select>
            <mat-hint align="end">{{ getSelectedUniqueCount() }} seleccionados</mat-hint>
          </mat-form-field>

          <div class="selection-summary" *ngIf="getSelectedUniqueCount() > 0">
            <div class="summary-chip" *ngFor="let id of evaluatorsControl.value">
              {{ getEvaluatorName(id) }}
              <mat-icon (click)="removeEvaluator(id)">cancel</mat-icon>
            </div>
          </div>

          @if (getSelectedUniqueCount() > quota.total) {
            <div class="error-banner animate-fade-in quota-too-many" role="alert">
              <mat-icon>warning</mat-icon>
              <span>{{ quotaText.tooMany }}</span>
            </div>
          }
        </form>

        <!-- Feedback de éxito detallado -->
        <div class="success-result animate-fade-in" *ngIf="successData()">
          <div class="result-header">
            <mat-icon>check_circle</mat-icon>
            <h3>Asignación Exitosa</h3>
          </div>
          <div class="result-body">
            <!-- F10 D15: lo que devolvió el backend, sin datos inventados -->
            <p class="success-count">Se asignaron {{ successData()?.assignments?.length }} evaluadores.</p>

            <div class="all-evaluators-box mt-3">
              <div class="eval-list-small">
                @for (a of successData()?.assignments; track a.evaluatorId) {
                  <div class="eval-item-small" [class.is-risk-peer]="a.isRiskPeer">
                    <div class="eval-info-row">
                      <span class="name">{{ getEvaluatorName(a.evaluatorId) }}</span>
                      <span class="assignment-profile">{{ profileLabel(a.profile) }}</span>
                      @if (a.assignmentId !== null) {
                        <span class="assignment-id">Asignación: #{{ a.assignmentId }}</span>
                      }
                    </div>
                    @if (a.isRiskPeer) {
                      <span class="risk-badge"><mat-icon>security</mat-icon> Par de riesgo</span>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="deadline-info mt-3">
              <mat-icon>event</mat-icon>
              <span class="deadline-text">{{ deadlineText() }}</span>
            </div>
          </div>
          <button mat-flat-button color="primary" class="w-100 mt-3" (click)="close(true)">
            Entendido
          </button>
        </div>
      </div>

      <div mat-dialog-actions class="modal-actions" *ngIf="!successData()">
        <button mat-stroked-button (click)="close()" [disabled]="isSubmitting()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="getSelectedUniqueCount() !== quota.total || isSubmitting()"
          (click)="onSubmit()"
        >
          <mat-icon>{{ isSubmitting() ? 'hourglass_empty' : 'how_to_reg' }}</mat-icon>
          Finalizar Asignación
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 600px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.75rem;
        .title-area {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
          }
        }
      }
      .protocol-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        .code {
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.7rem;
          align-self: flex-start;
        }
        .title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.3;
        }
        .metadata {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #64748b;
        }
      }
      .instruction-box {
        display: flex;
        gap: 12px;
        background: #fffbeb;
        border: 1px solid #fef3c7;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        mat-icon {
          color: #d97706;
        }
        .text {
          p {
            margin: 0 0 0.5rem;
            font-size: 0.85rem;
            color: #92400e;
          }
          ul {
            margin: 0;
            padding-left: 1.2rem;
            font-size: 0.8rem;
            color: #b45309;
          }
        }
      }
      .full-width {
        width: 100%;
      }
      .eval-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        .eval-main {
          display: flex;
          flex-direction: column;
        }
        .name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .badge-perfil {
          font-size: 0.65rem;
          background: #e0f2fe;
          color: #075985;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
          margin-top: 2px;
        }
        .workload {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          &.low {
            background: #f0fdf4;
            color: #16a34a;
          }
          &.med {
            background: #fffbeb;
            color: #d97706;
          }
          &.high {
            background: #fef2f2;
            color: #dc2626;
          }
        }
      }
      .selection-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 1rem;
        margin-bottom: 1rem;
        .summary-chip {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e2e8f0;
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            cursor: pointer;
            &:hover {
              color: #ef4444;
            }
          }
        }
      }
      .error-banner {
        background: #fef2f2;
        color: #dc2626;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-weight: 700;
        margin-top: 0.5rem;
        mat-icon {
          font-size: 18px;
        }
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
        margin-top: 1rem;
      }

      /* Estilos de éxito */
      .success-result {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        margin-top: 1rem;
        .result-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #22c55e;
          }
          h3 {
            margin: 0;
            font-weight: 800;
            color: #14532d;
          }
        }
        .result-body {
          p {
            font-size: 0.9rem;
            color: #166534;
            margin-bottom: 1.5rem;
          }
        }
        .risk-random-box {
          background: white;
          border: 1px dashed #22c55e;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: left;
          .label {
            font-size: 0.75rem;
            font-weight: 800;
            color: #15803d;
            display: block;
            margin-bottom: 0.5rem;
          }
          .names {
            display: flex;
            flex-direction: column;
            gap: 4px;
            .risk-name {
              font-weight: 700;
              color: #1e293b;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 8px;
              &::before {
                content: '•';
                color: #22c55e;
                font-size: 1.5rem;
                line-height: 0;
              }
            }
          }
        }
        .all-evaluators-box {
          background: white;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: left;
          .label-all {
            font-size: 0.75rem;
            font-weight: 800;
            color: #166534;
            display: block;
            margin-bottom: 0.5rem;
          }
          .eval-list-small {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .eval-item-small {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            &.is-risk-peer {
              border-color: #bbf7d0;
              background: #f0fdf4;
            }
            .eval-info-row {
              display: flex;
              flex-direction: column;
              .name {
                font-weight: 700;
                color: #1e293b;
                font-size: 0.85rem;
              }
              .assignment-id {
                font-size: 0.7rem;
                color: #64748b;
                font-weight: 600;
              }
            }
            .risk-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 0.65rem;
              font-weight: 800;
              color: #16a34a;
              background: #dcfce7;
              padding: 2px 8px;
              border-radius: 6px;
              mat-icon {
                font-size: 12px;
                width: 12px;
                height: 12px;
                color: #16a34a;
              }
            }
          }
        }
        .deadline-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #166534;
          font-size: 0.85rem;
          mat-icon {
            font-size: 18px;
          }
        }
      }
      .w-100 {
        width: 100%;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class AssignPeersModalComponent implements OnInit {
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private snack = inject(MatSnackBar);

  evaluatorsControl = new FormControl<string[]>([], { nonNullable: true });
  evaluators = signal<
    {
      id: string;
      nombre: string;
      email: string;
      perfil: string;
      cargaActiva: number;
      completadasMes: number;
    }[]
  >([]);
  isSubmitting = signal<boolean>(false);
  successData = signal<AssignEvaluatorsResponse | null>(null);
  loadError = signal<boolean>(false);

  readonly quota = PEER_ASSIGNMENT_QUOTA;
  readonly quotaText = PEER_QUOTA_TEXT;

  constructor(
    public dialogRef: MatDialogRef<AssignPeersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { protocol: PendingPeerAssignmentProtocol },
  ) {}

  ngOnInit() {
    this.loadEvaluators();
  }

  /** Nombre del investigador o '' si no viene (F10 D15: sin "Investigador Principal" inventado). */
  getInvestigatorName(): string {
    const inv = this.data?.protocol?.principalInvestigatorRecord as any;
    if (!inv) return '';
    if (typeof inv === 'string') return inv;
    return inv.fullName || inv.nombre || inv.principalInvestigatorRecord?.fullName || '';
  }

  profileLabel(profile: string): string {
    return peerEvaluatorProfileLabel(profile);
  }

  /** Fecha límite del dictamen, o el texto de la convocatoria si el backend no la envía (D15). */
  deadlineText(): string {
    const deadline = this.successData()?.assignments.find((a) => a.deadlineDate)?.deadlineDate;
    return deadline ? `Fecha límite del dictamen: ${formatDeadlineDate(deadline)}` : NO_DEADLINE_TEXT;
  }

  getSelectedUniqueCount(): number {
    const vals = this.evaluatorsControl.value || [];
    return new Set(vals).size;
  }

  getEvaluatorName(id: string | number): string {
    const ev = this.evaluators().find((e) => e.id === id.toString());
    return ev ? ev.nombre : 'Evaluador desconocido';
  }

  removeEvaluator(id: string | number) {
    const currentValues = this.evaluatorsControl.value;
    this.evaluatorsControl.setValue(currentValues.filter((val) => val !== id.toString()));
  }

  getWorkloadClass(carga: number): string {
    if (carga <= 2) return 'low';
    if (carga <= 4) return 'med';
    return 'high';
  }

  loadEvaluators() {
    this.loadError.set(false);
    this.evaluationRepo.getEvaluatorsDashboard().subscribe({
      next: (data) => {
        const rawList = Array.isArray(data.evaluators) ? data.evaluators : [];

        // Map y deduplicar por ID único de evaluador
        const evaluatorsMap = new Map<
          string,
          {
            id: string;
            nombre: string;
            email: string;
            perfil: string;
            cargaActiva: number;
            completadasMes: number;
          }
        >();

        rawList.forEach((u: any) => {
          const id = String(u.evaluatorId || u.id);
          if (id && !evaluatorsMap.has(id)) {
            evaluatorsMap.set(id, {
              id,
              nombre: u.fullName || u.nombre || 'Evaluador',
              email: u.email || '',
              // F10 D15: todos sus perfiles; sin perfil, "Sin perfil" (no "Evaluador").
              perfil:
                Array.isArray(u.profiles) && u.profiles.length
                  ? u.profiles.map((p: { name: string }) => p.name).join(', ')
                  : u.perfil || NO_PROFILE_LABEL,
              cargaActiva: u.currentLoad ?? u.assignedCount ?? 0,
              completadasMes: u.completedThisMonth ?? u.completedCount ?? 0,
            });
          }
        });

        const mapped = Array.from(evaluatorsMap.values()).sort(
          (a, b) => a.cargaActiva - b.cargaActiva,
        );
        this.evaluators.set(mapped);
      },
      error: () => this.loadError.set(true),
    });
  }

  close(refresh: boolean = false) {
    this.dialogRef.close(refresh);
  }

  onSubmit() {
    const rawValues = this.evaluatorsControl.value || [];
    const uniqueEvaluatorIds = Array.from(new Set(rawValues.map((id) => Number(id))));

    if (uniqueEvaluatorIds.length !== this.quota.total) return;

    this.isSubmitting.set(true);

    this.evaluationRepo
      .assignPeerEvaluators(this.data.protocol.id.toString(), uniqueEvaluatorIds)
      .subscribe({
        next: (res) => {
          this.successData.set(res);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error asignando evaluadores:', err);
          // F10 D15: el mensaje del backend (el interceptor lo deja en err.message).
          const msg = extractApiErrorMessage(err, 'No se pudieron asignar los evaluadores.');
          this.snack.open(msg, 'Cerrar', { duration: 5000 });
          this.isSubmitting.set(false);
        },
      });
  }
}
