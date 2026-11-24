import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import {
  ProtocolHeaderComponent,
  ProtocolHeaderFact,
} from '@shared/ui/protocol-header/protocol-header.component';
import { protocolStatusTone } from '@shared/utils/protocol-status-tone';
import { ProtocolUI } from '@shared/utils/protocol-ui.util';
import { ErrorStateComponent, LoadingStateComponent } from '@shared/ui/states/states.component';
import { RoleHome } from '@infrastructure/guards/role-home.guard';
import { WORKSPACE_ACTION_ROLES, WORKSPACE_TAB_ROLES } from '../../../domain/workspace-tab-roles';
import { StageCode } from '@domain/value-objects/stage.vo';
import { deriveStageStates, isStageNotApplicable, isStageNotReached } from '../../../domain/workspace-stage-state';
import { stageClosedMessage, stageNotReachedMessage } from '../../../domain/workspace-stage-messages';
import { NotificationService } from '@infrastructure/services/notification.service';
import { Stage } from '@domain/value-objects/stage.vo';
import {
  isAssignmentStatus,
  workspaceStatusCode,
  workspaceStatusLabel,
} from '../../../domain/workspace-status';
import { protocolVersionLabel, riskLevelFactValue } from '../../../domain/protocol-header';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimelineAcceptanceModalComponent } from '../../components/timeline-acceptance-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TERMS_NOT_ACCEPTED_REASON } from '@domain/entities/peer-assignment-composition';

import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';

type AssignmentOrigin = 'assignment-list' | 'assignment-form';

function toAssignmentOrigin(value: string | null): AssignmentOrigin | null {
  return value === 'assignment-list' || value === 'assignment-form' ? value : null;
}

const STAGE_PATHS: Readonly<Record<StageCode, string>> = {
  RECEPCION: 'reception',
  ASIGNACION: 'assignment-history',
  EVALUACION: 'evaluation',
  RESOLUCION: 'resolution',
  SEGUIMIENTO: 'follow-up',
  RENOVACION: 'renewal',
};

@Component({
  selector: 'app-protocol-workspace',
  standalone: true,
  providers: [ProtocolWorkspaceService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    TimelineAcceptanceModalComponent,
    MatDialogModule,
    ProtocolHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <!-- Carga y errores (F10 D14): el contenido solo con datos del :id actual -->
    @if (protocol()) {
    <div class="workspace-shell">
      <!-- F10 D15: la recarga del mismo :id falló; los datos siguen a la vista -->
      @if (loadError()) {
        <div class="refresh-error">
          <app-error-state
            message="No pudimos actualizar el protocolo."
            (retry)="reload()"
          ></app-error-state>
        </div>
      }

      <!-- MODAL DE ACEPTACIÓN OBLIGATORIO DE TIEMPOS -->
      <app-timeline-acceptance-modal
        *ngIf="showAcceptanceModal()"
        [protocolId]="protocolIdNumber()"
        [ceishCode]="protocol()?.code || ''"
        (accepted)="onTimelineAccepted()"
      >
      </app-timeline-acceptance-modal>

      <!-- 1. Encabezado del protocolo (F10 D18, F00 §5): sin datos inventados -->
      @if (header(); as h) {
        @if (h.title) {
          <app-protocol-header
            class="workspace-header"
            [code]="h.code"
            [version]="versionLabel()"
            [status]="statusChip()"
            [heading]="h.title"
            [facts]="facts()"
            [stage]="workspaceStage()"
            [selectedStage]="selectedStage()"
            [stageStates]="stageStates()"
            [stageLinks]="stageLinks()"
            (notReachedStageClick)="onNotReachedStage($event)"
            (notApplicableStageClick)="onNotReachedStage($event)"
          >
            @if (visibleActions().length || showTermsNotice() || returnOrigin()) {
              <div protocolHeaderAction class="header-action">
                @if (returnOrigin()) {
                  <button
                    type="button"
                    class="header-action__button header-action__button--secondary"
                    (click)="returnToAssignmentContext()"
                  >
                    <mat-icon aria-hidden="true">arrow_back</mat-icon>
                    <span>{{ returnLabel() }}</span>
                  </button>
                }
                @for (action of visibleActions(); track action.id) {
                  <button
                    type="button"
                    class="header-action__button"
                    (click)="onExecuteAction(action.id)"
                  >
                    <mat-icon aria-hidden="true">{{ action.icon }}</mat-icon>
                    <span>{{ action.label }}</span>
                  </button>
                }
                <!-- F10 D20 (3): sin la aceptación de tiempos, Asignar Pares sigue visible pero deshabilitado, con su motivo -->
                @if (showTermsNotice()) {
                  <button
                    type="button"
                    class="header-action__button"
                    disabled
                    aria-describedby="assign-peers-blocked-reason"
                  >
                    <mat-icon aria-hidden="true">person_add</mat-icon>
                    <span>Asignar Pares</span>
                  </button>
                  <p id="assign-peers-blocked-reason" class="header-notice" role="status">
                    {{ termsNotAcceptedReason }}
                  </p>
                }
              </div>
            }
          </app-protocol-header>
        } @else {
          <!-- F10 D18 (3): sin título no se inventa uno; las pestañas siguen disponibles -->
          <div class="workspace-header">
            <app-error-state
              message="No pudimos leer el título de este protocolo."
              (retry)="reload()"
            ></app-error-state>
          </div>
        }
      }

      <!-- 2. Pestañas del protocolo (fuera del encabezado; componente propio en EP-T) -->
      <nav class="navigation-scaffold" aria-label="Pestañas del protocolo">
        <div class="tab-strip">
          <a
            class="tab-item"
            *ngFor="let tab of tabConfig()"
            [routerLink]="tab.path"
            routerLinkActive="active"
            #rla="routerLinkActive"
          >
            <mat-icon aria-hidden="true">{{ tab.icon }}</mat-icon>
            <span>{{ tab.label }}</span>
            <div class="active-indicator" *ngIf="rla.isActive"></div>
          </a>
        </div>
      </nav>

      <!-- 3. Contenido de la pestaña (sin otro <main>: el del AppShell es el único, D18) -->
      <div class="content-viewport">
        <div class="viewport-canvas">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
    } @else if (loadError() === 'not-found') {
      <div class="state-viewport">
        <app-error-state
          message="No encontramos este protocolo. Revise el enlace."
          retryLabel="Volver al inicio"
          (retry)="goHome()"
        ></app-error-state>
      </div>
    } @else if (loadError()) {
      <div class="state-viewport">
        <app-error-state message="No pudimos cargar el protocolo." (retry)="reload()"></app-error-state>
      </div>
    } @else {
      <div class="state-viewport">
        <app-loading-state message="Cargando el protocolo…"></app-loading-state>
      </div>
    }
  `,
  styles: [
    `
      /* F10 D18: solo tokens de F00, sin colores fijos */
      .workspace-shell {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 64px);
        background: var(--c-bg);
        font-family: var(--font-content);
      }

      .workspace-header {
        display: block;
        padding: clamp(16px, 3vw, 24px) clamp(16px, 3vw, 24px) 0;
      }

      /* Acción principal y su aviso (ranura del encabezado) */
      .header-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
      .header-action__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: var(--min-h-action);
        padding: 0 16px;
        border: none;
        border-radius: var(--radius-control);
        background: var(--c-primary);
        color: var(--c-surface);
        font-family: var(--font-content);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
        &:hover {
          background: var(--c-primary-dark);
        }
        &:focus-visible {
          outline: 2px solid var(--c-primary-dark);
          outline-offset: 2px;
        }
      }
      .header-action__button--secondary {
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        color: var(--c-primary-dark);

        &:hover {
          background: var(--c-primary-soft);
        }
      }
      .header-notice {
        margin: 0;
        max-width: 22rem;
        color: var(--tone-ambar-fg);
        font-size: 14px;
        font-weight: 600;
      }

      /* Aviso de la recarga fallida (F10 D15) */
      .refresh-error {
        padding: 16px clamp(16px, 3vw, 24px) 0;
      }

      /* Pestañas */
      .navigation-scaffold {
        margin-top: 16px;
        padding: 0 clamp(16px, 3vw, 24px);
        border-bottom: 1px solid var(--c-border);
      }
      .tab-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 0 24px;
      }
      .tab-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 4px;
        color: var(--c-text-2);
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        &:hover {
          color: var(--c-text);
        }
        &:focus-visible {
          outline: 2px solid var(--c-primary);
          outline-offset: 2px;
        }
        &.active {
          color: var(--c-primary);
        }
        .active-indicator {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 3px;
          border-radius: 3px 3px 0 0;
          background: var(--c-primary);
        }
      }

      /* Contenido */
      .content-viewport {
        flex: 1;
        overflow-y: auto;
      }
      .viewport-canvas {
        max-width: 1400px;
        margin: 0 auto;
        padding: clamp(16px, 3vw, 24px);
      }

      /* Cargando y errores (F10 D14) */
      .state-viewport {
        max-width: 640px;
        margin: 0 auto;
        padding: 2.5rem 1rem;
      }
    `,
  ],
})
export class ProtocolWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(ProtocolWorkspaceService);
  private authFacade = inject(AuthFacade);
  private activeRoleFacade = inject(ActiveRoleFacade);
  private snackBar = inject(MatSnackBar);
  private notifications = inject(NotificationService);
  private roleHome = inject(RoleHome);
  private destroyRef = inject(DestroyRef);
  /** F10 D20 (3) y F03 D5 (1): el mismo texto que el motivo del formulario de asignación. */
  readonly termsNotAcceptedReason = TERMS_NOT_ACCEPTED_REASON;

  /** Recarga del mismo `:id` (Reintentar, D14). */
  private reload$ = new Subject<void>();

  protocol = this.workspaceService.protocol;
  /** Encabezado sin rellenos (F10 D18). */
  header = this.workspaceService.header;
  loadError = this.workspaceService.error;

  protocolIdNumber = computed(() => Number(this.protocol()?.id || 0));

  readonly stageLinks = computed<Readonly<Partial<Record<StageCode, string>>>>(() => {
    const protocolId = this.protocol()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!protocolId) return {};
    const paths: Record<StageCode, string> = { ...STAGE_PATHS, ASIGNACION: this.assignmentPath() };

    return Object.fromEntries(
      Object.entries(paths).map(([stage, path]) => [
        stage,
        `/dashboard/protocols/workspace/${protocolId}/${path}`,
      ]),
    ) as Partial<Record<StageCode, string>>;
  });
  /**
   * Estados de la barra «derivados de la etapa actual» (ep2c §3.4, excepción del 24/11/2026): solo
   * `header.stage` y el código de estado; sin etapa del backend no se deriva nada.
   */
  readonly stageStates = computed(() => deriveStageStates(this.workspaceStage(), this.statusCode()));
  readonly selectedStage = signal<StageCode | null>(null);

  returnOrigin = signal<AssignmentOrigin | null>(null);

  returnLabel = computed(() =>
    this.returnOrigin() === 'assignment-form'
      ? 'Volver al formulario'
      : 'Volver a la lista de asignación',
  );

  /**
   * Estado canónico (F10 D13): el del protocolo y, si es NULL, el de la recepción. Pestañas,
   * acciones, ventana de aceptación, etapa y etiqueta leen solo de aquí.
   */
  statusCode = computed(() => {
    const p = this.protocol();
    return p ? workspaceStatusCode(p.statusId, p.status) : null;
  });

  /** Borrador: la recepción en BORRADOR (D13). */
  private isDraft = computed(() => this.protocol()?.status?.toUpperCase() === 'BORRADOR');

  /** Etapa de la barra (F10 D19): la `etapa` de `GET /protocols/:id`; null o desconocida → sin barra. */
  workspaceStage = computed(() => this.header()?.stage ?? null);

  statusLabel = computed(() => workspaceStatusLabel(this.statusCode(), this.isDraft()));

  /**
   * Chip de estado del encabezado (D18): la etiqueta de D13 y el tono de la regla T14b de F00
   * (`protocolStatusTone(ProtocolUI.class(estado))`); sin estado reconocido, gris.
   */
  statusChip = computed(() => {
    const code = this.statusCode();
    const cssClass = this.isDraft()
      ? ProtocolUI.class('BORRADOR')
      : code
        ? ProtocolUI.class(code)
        : null;
    return { label: this.statusLabel(), tone: protocolStatusTone(cssClass) };
  });

  /** Versión del encabezado (D18): `"2.0"` → `v2`; si no se lee un número, no se muestra. */
  versionLabel = computed(() => protocolVersionLabel(this.header()?.version ?? null));

  /**
   * Línea de datos del encabezado (D18, D19): solo lo que trae `GET /protocols/:id`. El nivel de
   * riesgo `null` se muestra «Sin fijar» y sin la clave no sale. El investigador principal ya llega,
   * pero mostrarlo aquí queda pendiente de decisión (D18 (1)); la sesión no llega (F00 §8).
   */
  facts = computed<readonly ProtocolHeaderFact[]>(() => [
    { label: 'Nivel de riesgo', value: riskLevelFactValue(this.header()?.riskLevel) },
  ]);

  showAcceptanceModal = computed(() => {
    const p = this.protocol();
    const user = this.authFacade.currentUser();
    if (!p || !user) return false;

    const isIp = this.activeRoleFacade.activeRole() === 'INVESTIGADOR';
    const isComplete = this.statusCode() === 'COMPLETO';
    const isNotSigned = !p.isTimelineTermsAccepted;

    return isIp && isComplete && isNotSigned;
  });

  onTimelineAccepted() {
    this.workspaceService.updateProtocol({
      isTimelineTermsAccepted: true,
    });
    // F10 D15: aceptar no cambia el estado del protocolo (protocols.service.ts:242-277 del backend).
    this.snackBar.open(
      'Su aceptación quedó registrada.',
      'Entendido',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      },
    );
  }

  contextualActions = computed(() => {
    const p = this.protocol();
    if (!p) return [];

    const actions = [];
    const activeRole = this.activeRoleFacade.activeRole();
    const code = this.statusCode();

    if (
      activeRole &&
      WORKSPACE_ACTION_ROLES.EDIT_PROTOCOL.includes(activeRole) &&
      !this.isDraft() &&
      (code === 'INICIADO' || code === 'REQUIERE_SUBSANACION_DOC' || code === 'INCOMPLETO')
    ) {
      actions.push({ id: 'EDIT_PROTOCOL', label: 'Completar / Editar', icon: 'edit' });
    }

    if (
      activeRole &&
      WORKSPACE_ACTION_ROLES.VALIDATE_ALL.includes(activeRole) &&
      code === 'EN_REVISION_SECRETARIA'
    ) {
      actions.push({ id: 'VALIDATE_ALL', label: 'Aprobar Todo', icon: 'done_all' });
    }
    if (
      activeRole &&
      WORKSPACE_ACTION_ROLES.ASSIGN_EVALUATORS.includes(activeRole) &&
      isAssignmentStatus(code) &&
      p.isTimelineTermsAccepted === true
    ) {
      actions.push({ id: 'ASSIGN_EVALUATORS', label: 'Asignar Pares', icon: 'person_add' });
    }
    return actions;
  });

  /**
   * D15 y D20 (3): quien puede asignar pares (PRESIDENTE) ve, en la etapa ASIGNACION, que falta la
   * aceptación de tiempos del investigador (por eso aún no sale "Asignar Pares").
   */
  awaitingTimelineAcceptance = computed(() => {
    const p = this.protocol();
    const activeRole = this.activeRoleFacade.activeRole();
    return (
      !!p &&
      !!activeRole &&
      WORKSPACE_ACTION_ROLES.ASSIGN_EVALUATORS.includes(activeRole) &&
      isAssignmentStatus(this.statusCode()) &&
      p.isTimelineTermsAccepted !== true
    );
  });

  /**
   * Ruta de la pestaña Asignación (F11-29): el formulario para quien asigna (PRESIDENTE) mientras el
   * protocolo esté en la etapa de asignación (COMPLETO); el historial en los demás casos.
   */
  readonly assignmentPath = computed(() => {
    const role = this.activeRoleFacade.activeRole();
    const canAssign =
      !!role &&
      WORKSPACE_TAB_ROLES.assignment.includes(role) &&
      isAssignmentStatus(this.statusCode());
    // Con evaluadores ya asignados nunca el formulario (F11-35). Mientras se consulta o si la consulta
    // falla, la pestaña lleva al formulario: él muestra la carga o el error con «Reintentar» (F11-38).
    return canAssign && this.activeAssignments().kind !== 'has' ? 'assignment' : 'assignment-history';
  });

  /** Asignaciones activas del protocolo (solo se piden a quien puede asignar, en la etapa de asignación). */
  readonly activeAssignments = this.workspaceService.activeAssignments;

  /** Quien puede asignar, con el protocolo en la etapa de asignación: es el único que consulta. */
  private readonly needsAssignmentGate = computed(() => {
    const role = this.activeRoleFacade.activeRole();
    return (
      !!role &&
      WORKSPACE_ACTION_ROLES.ASSIGN_EVALUATORS.includes(role) &&
      isAssignmentStatus(this.statusCode())
    );
  });

  private readonly requestActiveAssignments = effect(() => {
    const protocolId = this.protocolIdNumber();
    if (protocolId <= 0 || !this.needsAssignmentGate()) return;
    untracked(() => this.workspaceService.ensureActiveAssignments(protocolId));
  });

  /** «Asignar Pares» se muestra solo con la consulta resuelta y sin evaluadores ya asignados (F11-36). */
  private readonly assignPeersAllowed = computed(() => {
    const kind = this.activeAssignments().kind;
    return kind === 'none' || kind === 'error';
  });

  /** «Asignar Pares» no se muestra con la pestaña Asignación abierta (F11-34). */
  private readonly onAssignmentStage = computed(() => this.selectedStage() === 'ASIGNACION');

  visibleActions = computed(() =>
    this.onAssignmentStage() || !this.assignPeersAllowed()
      ? this.contextualActions().filter((action) => action.id !== 'ASSIGN_EVALUATORS')
      : this.contextualActions(),
  );

  showTermsNotice = computed(
    () => this.awaitingTimelineAcceptance() && !this.onAssignmentStage() && this.assignPeersAllowed(),
  );

  /**
   * Pestañas de la etapa seleccionada en la barra (F11-28 a F11-30): RECEPCIÓN muestra Resumen y
   * Validación Técnica; ASIGNACIÓN, solo Asignación; SEGUIMIENTO, su pestaña cuando existe; las
   * demás etapas no tienen pestañas todavía (la página muestra el estado «no disponible» de EP2c).
   * Sin etapa (ni seleccionada ni del backend) se conservan todas las pestañas de siempre.
   */
  tabConfig = computed(() => {
    const p = this.protocol();
    if (!p) return [];

    const activeRole = this.activeRoleFacade.activeRole();
    const code = this.statusCode();
    const stage = this.selectedStage() ?? this.workspaceStage()?.code ?? null;
    const tabs: { label: string; icon: string; path: string }[] = [];
    const all = stage === null;

    if ((all || stage === 'RECEPCION') && activeRole && WORKSPACE_TAB_ROLES.info.includes(activeRole)) {
      tabs.push({ label: 'Resumen', icon: 'dashboard', path: 'info' });
    }

    if (all && code === 'COMPLETO' && activeRole && WORKSPACE_TAB_ROLES.assignment.includes(activeRole)) {
      tabs.push({ label: 'Asignación', icon: 'person_add', path: 'assignment' });
    }
    if (stage === 'ASIGNACION' && activeRole && WORKSPACE_TAB_ROLES.info.includes(activeRole)) {
      tabs.push({ label: 'Asignación', icon: 'person_add', path: this.assignmentPath() });
    }

    if (
      (all || stage === 'RECEPCION') &&
      !this.isDraft() &&
      activeRole &&
      WORKSPACE_TAB_ROLES.validation.includes(activeRole)
    ) {
      tabs.push({ label: 'Validación Técnica', icon: 'fact_check', path: 'validation' });
    }

    if (
      (all || stage === 'SEGUIMIENTO') &&
      (code === 'APROBADO' || code === 'APROBADO_CON_CONDICION') &&
      activeRole &&
      WORKSPACE_TAB_ROLES['follow-up'].includes(activeRole)
    ) {
      tabs.push({ label: 'Seguimiento', icon: 'history', path: 'follow-up' });
    }

    return tabs;
  });

  /** Al abrir el espacio la etapa seleccionada es la actual del protocolo (F11-31): una vez por :id. */
  private entryHandled = false;
  private readonly openCurrentStage = effect(() => {
    const stage = this.workspaceStage();
    const loaded = !!this.protocol();
    if (!loaded || !stage || this.entryHandled) return;
    // Quien asigna espera a saber si ya hay evaluadores: de eso depende formulario o historial.
    const gate = this.activeAssignments().kind;
    if (this.needsAssignmentGate() && (gate === 'idle' || gate === 'loading')) return;
    this.entryHandled = true;
    untracked(() => {
      const path = this.router.url.split('?')[0].split('/').filter(Boolean).pop();
      if (path !== 'info' || stage.code === 'RECEPCION') return;
      const target = stage.code === 'ASIGNACION' ? this.assignmentPath() : STAGE_PATHS[stage.code];
      // Relativa al espacio; si la ruta no existe, el espacio se queda donde está.
      void this.router.navigate([target], { relativeTo: this.route, replaceUrl: true }).catch(() => false);
    });
  });

  /**
   * Aviso flotante (tipo «info», se cierra solo) de una etapa que no se abre: una posterior que el
   * protocolo aún no alcanza (F11-41) o una «no aplica» de un protocolo cerrado (F11-47).
   */
  private notifyNotReached(stage: StageCode): void {
    const closedAt = this.workspaceStage();
    if (isStageNotApplicable(this.stageStates()[stage]) && closedAt) {
      this.notifications.notify(stageClosedMessage(closedAt.label), 'info');
      return;
    }
    this.notifications.notify(stageNotReachedMessage(Stage.fromBackend(stage).label), 'info');
  }

  /** Clic en una etapa posterior a la actual o «no aplica»: no navega, solo avisa (F11-41, F11-47). */
  onNotReachedStage(stage: StageCode): void {
    this.notifyNotReached(stage);
  }

  /**
   * Etapa posterior a la actual abierta por URL: va a la etapa actual (replaceUrl) con el mismo aviso
   * (F11-43). Sin etapa del backend no se bloquea nada. Una vez por intento, aunque la señal cambie.
   */
  private blockedHandled: StageCode | null = null;
  private readonly redirectNotReachedStage = effect(() => {
    const current = this.workspaceStage();
    const selected = this.selectedStage();
    const loaded = !!this.protocol();
    if (!loaded || !current || !selected) {
      return;
    }
    const target = Stage.all().find((s) => s.code === selected);
    const state = this.stageStates()[selected];
    const blocked = !!target && (isStageNotReached(current, state, target) || isStageNotApplicable(state));
    if (!blocked) {
      this.blockedHandled = null;
      return;
    }
    // Quien asigna espera a saber si hay evaluadores: de eso depende formulario o historial.
    const gate = this.activeAssignments().kind;
    if (this.needsAssignmentGate() && (gate === 'idle' || gate === 'loading')) return;
    if (this.blockedHandled === selected) return;
    this.blockedHandled = selected;
    untracked(() => {
      const path =
        current.code === 'ASIGNACION'
          ? this.assignmentPath()
          : current.code === 'RECEPCION'
            ? 'info'
            : STAGE_PATHS[current.code];
      this.notifyNotReached(selected);
      void this.router.navigate([path], { relativeTo: this.route, replaceUrl: true }).catch(() => false);
    });
  });

  /**
   * D14: una sola carga a la vez. Con otro `:id` o una recarga, `switchMap` cancela la anterior,
   * así que gana la última respuesta. El error queda en el servicio (`loadError`).
   */
  ngOnInit() {
    (this.route.queryParamMap ?? of(this.route.snapshot?.queryParamMap ?? null))
      .pipe(
        startWith(this.route.snapshot?.queryParamMap ?? null),
        map((params) => toAssignmentOrigin(params?.get('origin') ?? null)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((origin) => this.returnOrigin.set(origin));
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith({ urlAfterRedirects: this.router.url } as NavigationEnd),
        map((event) => this.stageCodeFromUrl(event.urlAfterRedirects)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((stage) => this.selectedStage.set(stage));
    const id$ = this.route.params.pipe(
      map((params) => params['id'] as string | undefined),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      tap(() => (this.entryHandled = false)),
    );
    combineLatest([id$, this.reload$.pipe(startWith(undefined))])
      .pipe(
        switchMap(([id]) => this.workspaceService.loadProtocol(id).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private stageCodeFromUrl(url: string): StageCode | null {
    const path = url.split('?')[0].split('/').filter(Boolean).pop();
    // Resumen y Validación Técnica son pestañas de RECEPCIÓN; assignment es el formulario de ASIGNACIÓN.
    if (path === 'info' || path === 'validation') return 'RECEPCION';
    if (path === 'assignment') return 'ASIGNACION';
    return (Object.entries(STAGE_PATHS).find(([, value]) => value === path)?.[0] as StageCode) ?? null;
  }

  reload(): void {
    this.reload$.next();
  }

  /** "Volver al inicio" del no encontrado: inicio del rol activo (F00 D12). */
  goHome(): void {
    this.router.navigateByUrl(this.roleHome.urlTree());
  }

  onExecuteAction(actionId: string) {
    // El id va como número en toda navegación (decisión del 24/11/2026).
    const protocolId = this.protocolIdNumber();
    if (actionId === 'EDIT_PROTOCOL') {
      this.router.navigate(['/investigador/protocolo', protocolId, 'editar']);
    } else if (actionId === 'VALIDATE_ALL') {
      this.router.navigate(['/dashboard/protocols/workspace', protocolId, 'validation']);
    } else if (actionId === 'ASSIGN_EVALUATORS') {
      // F10 D20 (2): el formulario de asignación de la Presidenta, dentro del espacio (EP2b).
      const origin = this.returnOrigin();
      const destination = ['/dashboard/protocols/workspace', protocolId, 'assignment'];
      if (origin) {
        this.router.navigate(destination, { queryParams: { origin } });
      } else {
        this.router.navigate(destination);
      }
    }
  }

  returnToAssignmentContext(): void {
    const origin = this.returnOrigin();
    const protocolId = this.protocolIdNumber();
    if (origin === 'assignment-list') {
      void this.router.navigate(['/dashboard/evaluations/assignment']);
    } else if (origin === 'assignment-form' && protocolId > 0) {
      void this.router.navigate(['/dashboard/protocols/workspace', protocolId, 'assignment']);
    } else {
      this.goHome();
    }
  }
}
