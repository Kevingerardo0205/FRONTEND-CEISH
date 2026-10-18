import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import {
  CreatedMeeting,
  CreateMeetingDto,
  Meeting,
  MeetingApiError,
  MeetingContractError,
  MeetingDetail,
  MeetingErrorCode,
  MeetingPlaceOption,
  MeetingSessionType,
  PaginationMeta,
  PendingProtocol,
} from '@domain/entities/meeting.entity';

const PAGE_SIZE = 10;

const ERROR_TEXT: Record<MeetingErrorCode, string> = {
  VERSIONES_DUPLICADAS: 'Hay versiones de protocolo repetidas en la selección.',
  SEGUIMIENTO_NO_DISPONIBLE: 'La inclusión de informes de seguimiento aún no está disponible.',
  VALIDACION: 'Los datos enviados no son válidos.',
  DESCONOCIDO: 'Ocurrió un error inesperado.',
};

/** Mensaje legible para errores del backend de reuniones. */
export function describeMeetingError(err: unknown): string {
  if (err instanceof MeetingApiError) {
    const base = ERROR_TEXT[err.code];
    return err.message && err.message !== err.code ? `${base} Detalle: ${err.message}` : base;
  }
  if (err instanceof MeetingContractError) {
    return 'La respuesta del servidor no tiene el formato esperado.';
  }
  return err instanceof Error && err.message ? err.message : ERROR_TEXT.DESCONOCIDO;
}

/** ISO 8601 → valor de <input type="datetime-local"> en hora local. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-calls-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="minimal-page animate-fade-in">
      <!-- HEADER MINIMALISTA -->
      <header class="page-header border-bottom pb-4 mb-4">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <div class="breadcrumb-text">CEISH / Secretaría / Convocatorias</div>
            <h1 class="title-minimal">Convocatorias y Actas</h1>
            <p class="subtitle-minimal">
              Agendamiento de sesiones ordinarias y extraordinarias del Pleno del CEISH
            </p>
          </div>
          <div>
            <button
              mat-flat-button
              class="btn-minimal-primary"
              (click)="toggleCreateForm(!showCreateForm())"
            >
              <mat-icon>{{ showCreateForm() ? 'close' : 'add' }}</mat-icon>
              <span>{{ showCreateForm() ? 'Cerrar' : 'Nueva Convocatoria' }}</span>
            </button>
          </div>
        </div>
      </header>

      <div
        *ngIf="errorMessage()"
        class="minimal-alert alert-error mb-4"
        role="alert"
        data-testid="meeting-error"
      >
        <mat-icon>error_outline</mat-icon>
        <span>{{ errorMessage() }}</span>
      </div>

      <div
        *ngIf="lastCreated() as created"
        class="minimal-alert alert-success mb-4"
        data-testid="meeting-created"
      >
        <mat-icon>check_circle</mat-icon>
        <span
          >Convocatoria <strong>{{ created.meetingNumber }}</strong> registrada.</span
        >
        <button mat-button type="button" (click)="onDownloadPdf(created)">
          <mat-icon>picture_as_pdf</mat-icon> Descargar agenda (PDF)
        </button>
      </div>

      <!-- MÉTRICAS EN LÍNEA (SUBTILES Y MINIMALISTAS) -->
      <section class="minimal-stats-strip mb-4">
        <div class="stat-item">
          <span class="stat-num">{{ meta().total }}</span>
          <span class="stat-lbl">Convocatorias</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num text-primary">{{ pendingProtocols().length }}</span>
          <span class="stat-lbl">Protocolos Listos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num" data-testid="next-session">{{ nextSessionLabel() }}</span>
          <span class="stat-lbl">Próxima Sesión</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ places().length }}</span>
          <span class="stat-lbl">Lugares Activos</span>
        </div>
      </section>

      <!-- FORMULARIO DE AGENDAMIENTO (SLIDING PANEL MINIMALISTA) -->
      <section *ngIf="showCreateForm()" class="minimal-panel mb-5 animate-fade-in">
        <div class="row g-4">
          <!-- FORMULARIO E INVENTARIO PROTOCOLOS -->
          <div class="col-lg-7">
            <form [formGroup]="callForm" (ngSubmit)="onSubmitCall()">
              <div class="panel-section-title">1. Parámetros de la Convocatoria</div>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="minimal-label">Número de Convocatoria</label>
                  <div class="minimal-readonly">Lo asigna el sistema al guardar</div>
                </div>

                <div class="col-md-6">
                  <label class="minimal-label">Tipo de Sesión *</label>
                  <div class="minimal-segmented">
                    <button
                      type="button"
                      class="segmented-btn"
                      [class.selected]="callForm.get('sessionType')?.value === 'ORDINARIA'"
                      (click)="setSessionType('ORDINARIA')"
                    >
                      Ordinaria
                    </button>
                    <button
                      type="button"
                      class="segmented-btn"
                      [class.selected]="callForm.get('sessionType')?.value === 'EXTRAORDINARIA'"
                      (click)="setSessionType('EXTRAORDINARIA')"
                    >
                      Extraordinaria
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="minimal-label" for="meetingDate">Fecha y Hora *</label>
                  <input
                    id="meetingDate"
                    type="datetime-local"
                    class="minimal-input"
                    formControlName="meetingDate"
                  />
                </div>

                <div class="col-md-6">
                  <label class="minimal-label" for="evalSubmissionDeadline"
                    >Fecha límite de evaluación</label
                  >
                  <input
                    id="evalSubmissionDeadline"
                    type="datetime-local"
                    class="minimal-input"
                    formControlName="evalSubmissionDeadline"
                  />
                  <small class="text-muted" *ngIf="isCalculatingEvalDate()"
                    >Calculando fecha sugerida...</small
                  >
                  <small class="text-muted" *ngIf="!isCalculatingEvalDate() && evalDateSuggested()">
                    Sugerida por el sistema; puede editarla.
                  </small>
                </div>

                <div class="col-md-12">
                  <label class="minimal-label" for="locationId">Lugar de Sesión</label>
                  <div
                    *ngIf="places().length === 0"
                    class="minimal-alert alert-warning"
                    data-testid="no-places"
                  >
                    <mat-icon>warning_amber</mat-icon>
                    <span>No hay lugares activos configurados</span>
                  </div>
                  <select
                    *ngIf="places().length > 0"
                    id="locationId"
                    class="minimal-input"
                    formControlName="locationId"
                  >
                    <option value="">— Sin lugar asignado —</option>
                    <option *ngFor="let place of places()" [value]="place.id">
                      {{ place.name }}{{ place.address ? ' — ' + place.address : '' }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="panel-section-title m-0">
                  2. Expedientes Validados ({{ selectedVersionIds().length }} seleccionados)
                </div>
              </div>

              <div class="minimal-search mb-3">
                <input
                  type="text"
                  class="minimal-input"
                  placeholder="Filtrar por código, título o investigador..."
                  [ngModel]="searchTerm()"
                  (ngModelChange)="searchTerm.set($event)"
                  [ngModelOptions]="{ standalone: true }"
                />
              </div>

              <div class="minimal-protocol-list">
                <div
                  *ngIf="filteredPendingProtocols().length === 0"
                  class="p-4 text-center text-muted small"
                >
                  No hay protocolos pendientes de agendamiento.
                </div>

                <div
                  *ngFor="let p of filteredPendingProtocols()"
                  class="minimal-protocol-row"
                  [class.active]="isProtocolSelected(p.versionId)"
                  (click)="onToggleProtocol(p.versionId)"
                >
                  <mat-checkbox
                    [checked]="isProtocolSelected(p.versionId)"
                    (click)="$event.stopPropagation()"
                    (change)="onToggleProtocol(p.versionId)"
                    color="primary"
                  >
                  </mat-checkbox>
                  <div class="flex-grow-1 ms-2">
                    <div class="fw-bold text-dark fs-6">
                      {{ p.ceishCode || 'Sin código' }} — {{ p.title || 'Sin título' }}
                      <span class="text-muted small" *ngIf="p.versionNumber !== null"
                        >(v{{ p.versionNumber }})</span
                      >
                    </div>
                    <div class="text-muted small">
                      IP: {{ p.investigatorName || 'No registrado' }}
                      <span *ngIf="p.deadline">
                        · Plazo: {{ p.deadline | date: 'dd/MM/yyyy' }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  mat-button
                  class="btn-minimal-secondary"
                  (click)="toggleCreateForm(false)"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  mat-flat-button
                  class="btn-minimal-primary"
                  [disabled]="
                    callForm.invalid || isSubmitting() || selectedVersionIds().length === 0
                  "
                >
                  {{ isSubmitting() ? 'Agendando...' : 'Agendar y Notificar' }}
                </button>
              </div>
            </form>
          </div>

          <!-- HOJA OFICIAL MINIMALISTA -->
          <div class="col-lg-5">
            <div class="minimal-paper">
              <div class="paper-header-text">ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</div>
              <div class="paper-sub-text">COMITÉ DE ÉTICA EN INVESTIGACIÓN EN SERES HUMANOS</div>

              <div class="paper-divider"></div>

              <div class="paper-title">CONVOCATORIA (número asignado al guardar)</div>

              <p class="paper-paragraph">
                Sesión <strong>{{ callForm.get('sessionType')?.value }}</strong> el
                <strong>{{
                  callForm.get('meetingDate')?.value
                    ? (callForm.get('meetingDate')?.value | date: 'medium')
                    : '___'
                }}</strong>
                en <strong>{{ selectedPlaceName() || 'lugar por definir' }}</strong
                >.
              </p>

              <div class="paper-agenda-heading">PROTOCOLOS SELECCIONADOS</div>
              <ul class="paper-sub-ul">
                <li *ngFor="let title of selectedProtocolTitles()">{{ title }}</li>
                <li *ngIf="selectedProtocolTitles().length === 0" class="text-muted fst-italic">
                  (Seleccione protocolos a la izquierda)
                </li>
              </ul>
              <p class="paper-paragraph text-muted small mt-3">
                El orden del día oficial se genera en el PDF de agenda al registrar la convocatoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- DETALLE DE CONVOCATORIA -->
      <section
        *ngIf="selectedMeeting() as detail"
        class="minimal-panel mb-4"
        data-testid="meeting-detail"
      >
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="panel-section-title m-0">Convocatoria {{ detail.meetingNumber }}</div>
          <button
            mat-icon-button
            class="minimal-icon-btn"
            matTooltip="Cerrar detalle"
            (click)="selectedMeeting.set(null)"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="paper-paragraph">
          {{ detail.sessionType }} ·
          {{ detail.meetingDate ? (detail.meetingDate | date: 'dd/MM/yyyy HH:mm') : 'Sin fecha' }} ·
          {{ detail.place?.name || 'Sin lugar asignado' }} · Estado: {{ detail.status }}
          <span *ngIf="detail.evalSubmissionDeadline">
            · Entrega de evaluaciones:
            {{ detail.evalSubmissionDeadline | date: 'dd/MM/yyyy HH:mm' }}</span
          >
        </p>
        <table class="minimal-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Código</th>
              <th>Título</th>
              <th>Investigador</th>
              <th>Plazo normativo</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of detail.protocols">
              <td>{{ p.order }}</td>
              <td>{{ p.ceishCode || '—' }}</td>
              <td>{{ p.title || '—' }}</td>
              <td>{{ p.investigatorName || '—' }}</td>
              <td>{{ p.normativeDeadline ? (p.normativeDeadline | date: 'dd/MM/yyyy') : '—' }}</td>
            </tr>
            <tr *ngIf="detail.protocols.length === 0">
              <td colspan="5" class="text-center text-muted">Sin protocolos agendados.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- TABLA MINIMALISTA DE CONVOCATORIAS -->
      <main class="minimal-table-wrapper">
        <table class="minimal-table">
          <thead>
            <tr>
              <th>Convocatoria</th>
              <th>Tipo</th>
              <th>Fecha y Hora</th>
              <th>Lugar</th>
              <th>Estado</th>
              <th class="text-center">Expedientes</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of meetings()">
              <td class="fw-bold text-dark">{{ c.meetingNumber }}</td>
              <td>
                <span class="minimal-badge" [class.badge-ord]="c.sessionType === 'ORDINARIA'">
                  {{ c.sessionType }}
                </span>
              </td>
              <td>
                {{ c.meetingDate ? (c.meetingDate | date: 'dd/MM/yyyy HH:mm') : 'Sin fecha' }}
              </td>
              <td class="text-secondary">{{ c.place?.name || 'Sin lugar asignado' }}</td>
              <td>{{ c.status }}</td>
              <td class="text-center">
                <span class="count-pill">{{ c.protocolCount }}</span>
              </td>
              <td class="text-end">
                <button
                  mat-icon-button
                  class="minimal-icon-btn"
                  matTooltip="Ver detalle"
                  (click)="onViewCall(c)"
                >
                  <mat-icon>visibility</mat-icon>
                </button>
                <button
                  mat-icon-button
                  class="minimal-icon-btn"
                  matTooltip="Descargar agenda (PDF)"
                  (click)="onDownloadPdf(c)"
                >
                  <mat-icon>picture_as_pdf</mat-icon>
                </button>
                <button
                  mat-icon-button
                  class="minimal-icon-btn"
                  matTooltip="Enviar recordatorio"
                  (click)="onNotifyCall(c)"
                >
                  <mat-icon>mail</mat-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="meetings().length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                No hay convocatorias agendadas. Haga clic en "Nueva Convocatoria" para registrar
                una.
              </td>
            </tr>
          </tbody>
        </table>
      </main>

      <nav *ngIf="totalPages() > 1" class="minimal-pagination mt-3" data-testid="pagination">
        <button
          mat-button
          type="button"
          [disabled]="meta().page <= 1"
          (click)="goToPage(meta().page - 1)"
        >
          Anterior
        </button>
        <span
          >Página {{ meta().page }} de {{ totalPages() }} · {{ meta().total }} convocatorias</span
        >
        <button
          mat-button
          type="button"
          [disabled]="meta().page >= totalPages()"
          (click)="goToPage(meta().page + 1)"
        >
          Siguiente
        </button>
      </nav>
    </div>
  `,
  styles: [
    `
      .minimal-page {
        padding: 2rem 3rem;
        max-width: 1300px;
        margin: 0 auto;
        background-color: #ffffff;
        color: #0f172a;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      .breadcrumb-text {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .title-minimal {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 2px 0;
        color: #0f172a;
      }
      .subtitle-minimal {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
      }

      /* BOTONES MINIMALISTAS */
      .btn-minimal-primary {
        background-color: #0f172a !important;
        color: #ffffff !important;
        border-radius: 8px !important;
        padding: 0.5rem 1.25rem !important;
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        box-shadow: none !important;
        transition: background 0.2s ease !important;
        &:hover {
          background-color: #334155 !important;
        }
      }
      .btn-minimal-secondary {
        color: #475569 !important;
        font-weight: 600 !important;
      }

      /* STATS STRIP MINIMALISTA */
      .minimal-stats-strip {
        display: flex;
        align-items: center;
        gap: 2rem;
        background: #f8fafc;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .stat-item {
        display: flex;
        flex-direction: column;
      }
      .stat-num {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;
      }
      .stat-lbl {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-divider {
        width: 1px;
        height: 28px;
        background: #cbd5e1;
      }

      /* PANEL MINIMALISTA DE CREACIÓN */
      .minimal-panel {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      }
      .panel-section-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 1rem;
      }

      .minimal-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 4px;
        display: block;
      }
      .minimal-input {
        width: 100%;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        font-size: 0.88rem;
        outline: none;
        background: #ffffff;
        transition: border-color 0.2s ease;
        &:focus {
          border-color: #0f172a;
        }
      }

      /* SEGMENTED TOGGLE */
      .minimal-segmented {
        display: flex;
        background: #f1f5f9;
        padding: 3px;
        border-radius: 8px;
      }
      .segmented-btn {
        flex: 1;
        border: none;
        background: transparent;
        padding: 6px 12px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #64748b;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        &.selected {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }

      /* PROTOCOL LIST */
      .minimal-protocol-list {
        max-height: 240px;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      .minimal-protocol-row {
        display: flex;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.15s ease;
        &:last-child {
          border-bottom: none;
        }
        &:hover {
          background: #f8fafc;
        }
        &.active {
          background: #f1f5f9;
        }
      }

      /* HOJA DE PREVISUALIZACIÓN */
      .minimal-paper {
        background: #fafbfc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.75rem;
        font-size: 0.85rem;
        color: #334155;
      }
      .paper-header-text {
        font-size: 0.75rem;
        font-weight: 800;
        color: #0f172a;
        text-align: center;
      }
      .paper-sub-text {
        font-size: 0.65rem;
        color: #64748b;
        text-align: center;
        margin-top: 2px;
      }
      .paper-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 12px 0;
      }
      .paper-title {
        font-weight: 800;
        text-align: center;
        margin-bottom: 12px;
        color: #0f172a;
      }
      .paper-paragraph {
        margin-bottom: 12px;
        line-height: 1.5;
      }
      .paper-agenda-heading {
        font-weight: 700;
        font-size: 0.8rem;
        margin-top: 12px;
        color: #0f172a;
      }
      .paper-agenda-ol {
        padding-left: 16px;
        margin-top: 4px;
      }
      .paper-sub-ul {
        padding-left: 14px;
        margin-top: 4px;
      }

      /* TABLA MINIMALISTA */
      .minimal-table-wrapper {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }
      .minimal-table {
        width: 100%;
        border-collapse: collapse;
        th {
          background: #f8fafc;
          padding: 12px 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }
        td {
          padding: 16px 20px;
          font-size: 0.88rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        tr:last-child td {
          border-bottom: none;
        }
        tr:hover td {
          background: #fafbfc;
        }
      }

      .minimal-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        background: #f1f5f9;
        color: #475569;
        &.badge-ord {
          background: #e0f2fe;
          color: #0369a1;
        }
      }
      .count-pill {
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 100px;
        font-size: 0.78rem;
      }
      .minimal-icon-btn {
        color: #64748b !important;
        &:hover {
          color: #0f172a !important;
        }
      }

      .minimal-readonly {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px dashed #cbd5e1;
        font-size: 0.85rem;
        color: #64748b;
        background: #f8fafc;
      }
      .minimal-alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.88rem;
        &.alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        &.alert-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        &.alert-warning {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
        }
      }
      .minimal-pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        font-size: 0.85rem;
        color: #475569;
      }
    `,
  ],
})
export class CallsManagementPage implements OnInit {
  private meetingRepo = inject(IMeetingRepositoryPort);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  showCreateForm = signal(false);
  isSubmitting = signal(false);
  isCalculatingEvalDate = signal(false);
  evalDateSuggested = signal(false);
  errorMessage = signal<string | null>(null);
  lastCreated = signal<CreatedMeeting | null>(null);
  selectedMeeting = signal<MeetingDetail | null>(null);

  meetings = signal<Meeting[]>([]);
  meta = signal<PaginationMeta>({ total: 0, page: 1, limit: PAGE_SIZE });
  pendingProtocols = signal<PendingProtocol[]>([]);
  places = signal<MeetingPlaceOption[]>([]);
  selectedVersionIds = signal<number[]>([]);
  searchTerm = signal('');

  callForm: FormGroup = this.fb.group({
    sessionType: ['ORDINARIA' as MeetingSessionType, [Validators.required]],
    meetingDate: ['', [Validators.required]],
    evalSubmissionDeadline: [''],
    locationId: [''],
  });

  totalPages = computed(() => {
    const { total, limit } = this.meta();
    return limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  });

  /** Reunión con meetingDate futura más cercana (el backend ordena DESC; se calcula el mínimo). */
  nextSession = computed<Meeting | null>(() => {
    const now = Date.now();
    let best: Meeting | null = null;
    let bestTime = Infinity;
    for (const m of this.meetings()) {
      if (m.meetingDate === null) continue;
      const t = new Date(m.meetingDate).getTime();
      if (Number.isNaN(t) || t < now) continue;
      if (t < bestTime) {
        best = m;
        bestTime = t;
      }
    }
    return best;
  });

  nextSessionLabel = computed(() => {
    if (this.meetings().length === 0) return 'Sin agendar';
    const next = this.nextSession();
    if (!next || next.meetingDate === null) return 'Ninguna próxima';
    return new Date(next.meetingDate).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
    });
  });

  filteredPendingProtocols = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.pendingProtocols();
    return this.pendingProtocols().filter((p) =>
      [p.title, p.ceishCode, p.investigatorName].some(
        (v) => v !== null && v.toLowerCase().includes(term),
      ),
    );
  });

  selectedProtocolTitles = computed(() => {
    const ids = this.selectedVersionIds();
    return this.pendingProtocols()
      .filter((p) => ids.includes(p.versionId))
      .map((p) => `${p.ceishCode || 'Sin código'}: ${p.title || 'Sin título'}`);
  });

  ngOnInit() {
    this.loadMeetings(1);
    this.loadPendingProtocols();
    this.loadPlaces();

    this.callForm.controls['meetingDate'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string) => this.suggestEvalDate(value));
  }

  loadMeetings(page: number) {
    this.meetingRepo.list({ page, limit: PAGE_SIZE }).subscribe({
      next: ({ items, meta }) => {
        this.meetings.set(items);
        this.meta.set(meta);
      },
      error: (err) => this.showError(err),
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.loadMeetings(page);
  }

  loadPendingProtocols() {
    this.meetingRepo.getPendingProtocols().subscribe({
      next: (list) => this.pendingProtocols.set(list),
      error: (err) => this.showError(err),
    });
  }

  loadPlaces() {
    this.meetingRepo.getPlaces().subscribe({
      next: (list) => this.places.set(list),
      error: (err) => this.showError(err),
    });
  }

  selectedPlaceName(): string | null {
    const id = this.callForm.get('locationId')?.value;
    return this.places().find((p) => p.id === id)?.name ?? null;
  }

  /** Sugiere la fecha límite salvo que el usuario ya la haya editado manualmente. */
  suggestEvalDate(localValue: string) {
    const deadlineCtrl = this.callForm.controls['evalSubmissionDeadline'];
    if (!localValue || deadlineCtrl.dirty) return;
    const date = new Date(localValue);
    if (Number.isNaN(date.getTime())) return;

    this.isCalculatingEvalDate.set(true);
    this.meetingRepo.calculateEvalDate(date.toISOString()).subscribe({
      next: (suggested) => {
        this.isCalculatingEvalDate.set(false);
        if (deadlineCtrl.dirty) return;
        deadlineCtrl.setValue(isoToLocalInput(suggested));
        this.evalDateSuggested.set(true);
      },
      error: (err) => {
        this.isCalculatingEvalDate.set(false);
        this.showError(err);
      },
    });
  }

  toggleCreateForm(show: boolean) {
    this.showCreateForm.set(show);
    if (!show) {
      this.callForm.reset({
        sessionType: 'ORDINARIA',
        meetingDate: '',
        evalSubmissionDeadline: '',
        locationId: '',
      });
      this.selectedVersionIds.set([]);
      this.searchTerm.set('');
      this.evalDateSuggested.set(false);
    }
  }

  setSessionType(type: MeetingSessionType) {
    this.callForm.patchValue({ sessionType: type });
  }

  isProtocolSelected(versionId: number): boolean {
    return this.selectedVersionIds().includes(versionId);
  }

  onToggleProtocol(versionId: number) {
    this.selectedVersionIds.update((ids) =>
      ids.includes(versionId) ? ids.filter((id) => id !== versionId) : [...ids, versionId],
    );
  }

  onSubmitCall() {
    if (this.callForm.invalid) return;

    if (this.selectedVersionIds().length === 0) {
      this.snackBar.open(
        '⚠️ Debe seleccionar al menos un protocolo para incluir en la convocatoria.',
        'Cerrar',
        { duration: 4000 },
      );
      return;
    }

    const formVal = this.callForm.value;
    const dto: CreateMeetingDto = {
      sessionType: formVal.sessionType as MeetingSessionType,
      meetingDate: new Date(formVal.meetingDate).toISOString(),
      protocolVersionIds: [...this.selectedVersionIds()],
    };
    if (formVal.evalSubmissionDeadline) {
      dto.evalSubmissionDeadline = new Date(formVal.evalSubmissionDeadline).toISOString();
    }
    if (formVal.locationId) dto.locationId = formVal.locationId;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.meetingRepo.create(dto).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.lastCreated.set(created);
        this.snackBar.open(
          `✅ Convocatoria ${created.meetingNumber} agendada con éxito.`,
          'Cerrar',
          { duration: 4000 },
        );
        this.toggleCreateForm(false);
        this.loadMeetings(1);
        this.loadPendingProtocols();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.showError(err);
      },
    });
  }

  onViewCall(meeting: Meeting) {
    this.meetingRepo.getById(meeting.id).subscribe({
      next: (detail) => this.selectedMeeting.set(detail),
      error: (err) => this.showError(err),
    });
  }

  onDownloadPdf(meeting: { id: string; meetingNumber: string }) {
    this.meetingRepo.downloadPdf(meeting.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `convocatoria-${meeting.meetingNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.showError(err),
    });
  }

  onNotifyCall(meeting: Meeting) {
    this.snackBar.open(
      `Recordatorio enviado para Convocatoria ${meeting.meetingNumber}`,
      'Cerrar',
      { duration: 3000 },
    );
  }

  private showError(err: unknown) {
    const text = describeMeetingError(err);
    console.error('[Convocatorias]', err);
    this.errorMessage.set(text);
    this.snackBar.open(`❌ ${text}`, 'Cerrar', { duration: 6000 });
  }
}
