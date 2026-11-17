import {
  Component,
  inject,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Stage } from '@domain/value-objects/stage.vo';
import {
  ProtocolHeaderComponent,
  ProtocolHeaderFact,
} from '@shared/ui/protocol-header/protocol-header.component';
import { protocolStatusTone } from '@shared/utils/protocol-status-tone';
import { ProtocolUI } from '@shared/utils/protocol-ui.util';
import { ErrorStateComponent, LoadingStateComponent } from '@shared/ui/states/states.component';
import { RoleHome } from '@infrastructure/guards/role-home.guard';
import { WORKSPACE_ACTION_ROLES, WORKSPACE_TAB_ROLES } from '../../../domain/workspace-tab-roles';
import {
  workspaceStageCode,
  workspaceStatusCode,
  workspaceStatusLabel,
} from '../../../domain/workspace-status';
import { protocolVersionLabel } from '../../../domain/protocol-header';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimelineAcceptanceModalComponent } from '../../components/timeline-acceptance-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AssignPeersModalComponent } from '../../../../dashboard/presentation/components/assign-peers-modal/assign-peers-modal.component';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';

import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';

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
          >
            @if (contextualActions().length || awaitingTimelineAcceptance()) {
              <div protocolHeaderAction class="header-action">
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
                <!-- F10 D15: Asignar Pares espera la aceptación de tiempos del investigador -->
                @if (awaitingTimelineAcceptance()) {
                  <p class="header-notice" role="status">
                    El investigador aún no acepta los tiempos del comité.
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
  private dialog = inject(MatDialog);
  private roleHome = inject(RoleHome);
  private destroyRef = inject(DestroyRef);

  /** Recarga del mismo `:id` (Reintentar y después de Asignar Pares, D14). */
  private reload$ = new Subject<void>();

  protocol = this.workspaceService.protocol;
  /** Encabezado sin rellenos (F10 D18). */
  header = this.workspaceService.header;
  loadError = this.workspaceService.error;

  protocolIdNumber = computed(() => Number(this.protocol()?.id || 0));

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

  /** Etapa de la barra (temporal, D13). */
  workspaceStage = computed(() => {
    const code = workspaceStageCode(this.statusCode());
    return code ? Stage.fromBackend(code) : null;
  });

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
   * Línea de datos del encabezado (D18): solo lo que trae `GET /protocols/:id`. El investigador
   * principal y la sesión no llegan (F00 §8); el nivel de riesgo, solo si llega.
   */
  facts = computed<readonly ProtocolHeaderFact[]>(() => [
    { label: 'Nivel de riesgo', value: this.header()?.riskLevel ?? null },
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
      workspaceStageCode(code) === 'ASIGNACION' &&
      p.isTimelineTermsAccepted === true
    ) {
      actions.push({ id: 'ASSIGN_EVALUATORS', label: 'Asignar Pares', icon: 'person_add' });
    }
    return actions;
  });

  /**
   * D15: quien puede asignar pares ve, en la etapa ASIGNACION, que falta la aceptación de tiempos
   * del investigador (por eso aún no sale "Asignar Pares").
   */
  awaitingTimelineAcceptance = computed(() => {
    const p = this.protocol();
    const activeRole = this.activeRoleFacade.activeRole();
    return (
      !!p &&
      !!activeRole &&
      WORKSPACE_ACTION_ROLES.ASSIGN_EVALUATORS.includes(activeRole) &&
      workspaceStageCode(this.statusCode()) === 'ASIGNACION' &&
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
      const p = this.protocol();
      if (!p) return;

      // F10 D15: solo datos reales, sin rellenos ('General', 'Investigador Principal'). El modal
      // usa id, ceishCode, title, studyType.nombre y principalInvestigatorRecord.fullName; los
      // demás campos los exige el tipo y el modal no los lee. `GET /protocols/:id` manda
      // `studyType` como texto (`protocol.mapper.ts:52` del backend), aunque la entidad diga objeto.
      const rawStudyType: unknown = p.studyType;
      const studyTypeName =
        typeof rawStudyType === 'string' ? rawStudyType : (p.studyType?.nombre ?? '');
      const mappedProtocol: PendingPeerAssignmentProtocol = {
        id: Number(p.id),
        ceishCode: p.code || '',
        title: p.title,
        receptionStatus: p.status,
        isRiskLevelDesignated: false,
        createdAt: p.submissionDate ? new Date(p.submissionDate).toISOString() : '',
        studyType: { id: p.studyType?.id ?? 0, codigo: p.studyTypeCode || '', nombre: studyTypeName },
        principalInvestigatorRecord: { id: 0, fullName: p.principalInvestigator || '', email: '' },
      };

      const dialogRef = this.dialog.open(AssignPeersModalComponent, {
        width: '600px',
        data: { protocol: mappedProtocol },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((assigned: boolean) => {
        if (assigned) {
          this.snackBar.open('✅ Evaluadores asignados correctamente.', 'Cerrar', {
            duration: 4000,
          });
          this.reload();
        }
      });
    }
  }
}
