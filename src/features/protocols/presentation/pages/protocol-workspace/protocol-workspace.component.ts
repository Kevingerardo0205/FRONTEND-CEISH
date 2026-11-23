import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
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
import { WorkspaceStageState } from '../../../domain/workspace-stage-state';
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
            [stageLinks]="stageLinks"
          >
            @if (contextualActions().length || awaitingTimelineAcceptance() || returnOrigin()) {
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
                @for (action of contextualActions(); track action.id) {
                  <button
                    type="button"
                    class="header-action__button"
                    (click)="onExecuteAction(action.id)"
                  >
                    <mat-icon aria-hidden="true">{{ action.icon }}</mat-icon>
                    <span>{{ action.label }}</span>
                  </button>
                }
                <!-- F10 D20 (3): la Presidenta ve que Asignar Pares espera la aceptación de tiempos -->
                @if (awaitingTimelineAcceptance()) {
                  <p class="header-notice" role="status">{{ termsNotAcceptedReason }}</p>
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

  readonly stageLinks = STAGE_PATHS;
  readonly stageStates = signal<Readonly<Partial<Record<StageCode, WorkspaceStageState>>> >({});
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

  tabConfig = computed(() => {
    const p = this.protocol();
    if (!p) return [];

    const activeRole = this.activeRoleFacade.activeRole();
    const code = this.statusCode();
    const tabs: { label: string; icon: string; path: string }[] = [];

    if (activeRole && WORKSPACE_TAB_ROLES.info.includes(activeRole)) {
      tabs.push({ label: 'Resumen', icon: 'dashboard', path: 'info' });
    }

    if (
      code === 'COMPLETO' &&
      activeRole &&
      WORKSPACE_TAB_ROLES.assignment.includes(activeRole)
    ) {
      tabs.push({ label: 'Asignación', icon: 'person_add', path: 'assignment' });
    }

    if (
      !this.isDraft() &&
      activeRole &&
      WORKSPACE_TAB_ROLES.validation.includes(activeRole)
    ) {
      tabs.push({ label: 'Validación Técnica', icon: 'fact_check', path: 'validation' });
    }

    if (
      (code === 'APROBADO' || code === 'APROBADO_CON_CONDICION') &&
      activeRole &&
      WORKSPACE_TAB_ROLES['follow-up'].includes(activeRole)
    ) {
      tabs.push({ label: 'Seguimiento', icon: 'history', path: 'follow-up' });
    }

    return tabs;
  });

  /**
   * D14: una sola carga a la vez. Con otro `:id` o una recarga, `switchMap` cancela la anterior,
   * así que gana la última respuesta. El error queda en el servicio (`loadError`).
   */
  ngOnInit() {
    this.returnOrigin.set(
      toAssignmentOrigin(this.route.snapshot?.queryParamMap?.get('origin') ?? null),
    );
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
    if (actionId === 'EDIT_PROTOCOL') {
      this.router.navigate(['/investigador/protocolo', this.protocol()?.id, 'editar']);
    } else if (actionId === 'VALIDATE_ALL') {
      this.router.navigate(['/dashboard/protocols/workspace', this.protocol()?.id, 'validation']);
    } else if (actionId === 'ASSIGN_EVALUATORS') {
      // F10 D20 (2): el formulario de asignación de la Presidenta (F03), no un modal.
      const origin = this.returnOrigin();
      const destination = ['/dashboard/protocols/workspace', this.protocol()?.id, 'assignment'];
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
