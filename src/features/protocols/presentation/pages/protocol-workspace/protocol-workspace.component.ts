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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { Stage } from '@domain/value-objects/stage.vo';
import { StageBarComponent } from '@shared/ui/stage-bar/stage-bar.component';
import { ErrorStateComponent, LoadingStateComponent } from '@shared/ui/states/states.component';
import { RoleHome } from '@infrastructure/guards/role-home.guard';
import { WORKSPACE_ACTION_ROLES, WORKSPACE_TAB_ROLES } from '../../../domain/workspace-tab-roles';
import {
  workspaceStageCode,
  workspaceStatusCode,
  workspaceStatusLabel,
} from '../../../domain/workspace-status';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
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
    MatChipsModule,
    MatTooltipModule,
    ProtocolCodePipe,
    MatSnackBarModule,
    TimelineAcceptanceModalComponent,
    MatDialogModule,
    StageBarComponent,
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

      <!-- 1. Header Premium: Identidad y Acciones Rápidas -->
      <header class="premium-header">
        <div class="header-main">
          <div class="identity-block">
            <div class="meta-row">
              <span class="protocol-id">{{ protocol()?.code | protocolCode }}</span>
              <span class="status-indicator" [attr.data-status]="statusCode()">
                {{ statusLabel() }}
              </span>
            </div>
            <h1 class="protocol-title" [matTooltip]="protocol()?.title">
              {{ protocol()?.title }}
            </h1>
            @if (protocol()?.principalInvestigator; as investigator) {
              <div class="owner-chip">
                <mat-icon>account_circle</mat-icon>
                <span>{{ investigator }}</span>
              </div>
            }
          </div>

          <div class="action-registry">
            <button
              class="action-btn primary"
              *ngFor="let action of contextualActions()"
              (click)="onExecuteAction(action.id)"
              matRipple
            >
              <mat-icon>{{ action.icon }}</mat-icon>
              <span>{{ action.label }}</span>
            </button>
          </div>
        </div>

        <!-- F10 D15: Asignar Pares espera la aceptación de tiempos del investigador -->
        @if (awaitingTimelineAcceptance()) {
          <p class="header-notice" role="status">
            El investigador aún no acepta los tiempos del comité.
          </p>
        }

        <!-- 2. Etapas del protocolo (F10 D13): sin estado reconocido no hay barra (F02 §5.3) -->
        @if (workspaceStage(); as stage) {
          <div class="progress-scaffold">
            <app-stage-bar [stage]="stage"></app-stage-bar>
          </div>
        }
      </header>

      <!-- 3. Navegación Tabular Estilizada -->
      <nav class="navigation-scaffold">
        <div class="tab-strip">
          <a
            class="tab-item"
            *ngFor="let tab of tabConfig()"
            [routerLink]="tab.path"
            routerLinkActive="active"
            #rla="routerLinkActive"
          >
            <mat-icon>{{ tab.icon }}</mat-icon>
            <span>{{ tab.label }}</span>
            <div class="active-indicator" *ngIf="rla.isActive"></div>
          </a>
        </div>
      </nav>

      <!-- 4. Contenedor de Contenido con Scroll Suave -->
      <main class="content-viewport">
        <div class="viewport-canvas">
          <router-outlet></router-outlet>
        </div>
      </main>
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
      :host {
        --primary: #0f172a;
        --accent: #3b82f6;
        --success: #10b981;
        --border: #e2e8f0;
        --bg: #f8fafc;
      }

      .workspace-shell {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 64px);
        background: var(--bg);
        font-family:
          'Inter',
          -apple-system,
          sans-serif;
      }

      /* Header Aesthetics */
      .premium-header {
        background: white;
        border-bottom: 1px solid var(--border);
        padding: 1.5rem 2.5rem 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
      }

      .identity-block {
        max-width: 60%;
        .meta-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .protocol-id {
          font-weight: 800;
          color: #64748b;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }
        .status-indicator {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          &[data-status='INICIADO'] {
            background: #f1f5f9;
            color: #475569;
          }
          &[data-status='EN_REVISION_SECRETARIA'] {
            background: #ecfdf5;
            color: #065f46;
          }
          &[data-status='EN_EVALUACION'] {
            background: #eff6ff;
            color: #1e40af;
          }
          &[data-status='DISCREPANCIA_RIESGO'] {
            background: #fff7ed;
            color: #c2410c;
          }
        }
        .protocol-title {
          margin: 0 0 0.75rem;
          font-size: 1.5rem;
          color: var(--primary);
          font-weight: 700;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .owner-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.85rem;
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #94a3b8;
          }
        }
      }

      /* Action Registry Styling */
      .action-registry {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #f1f5f9;
        padding: 0.5rem;
        border-radius: 12px;
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
          &.primary {
            background: var(--primary);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
            }
          }
        }
      }

      /* Avisos de la cabecera (F10 D15) */
      .refresh-error {
        padding: 1rem 2.5rem 0;
        background: white;
      }
      .header-notice {
        margin: -1rem 0 1.5rem;
        color: #92400e;
        font-size: 0.9rem;
        font-weight: 600;
      }

      /* Etapas del protocolo (app-stage-bar) */
      .progress-scaffold {
        padding: 0 1rem 1.5rem;
        max-width: 900px;
      }

      /* Navigation Aesthetic */
      .navigation-scaffold {
        background: white;
        border-bottom: 1px solid var(--border);
        padding: 0 2.5rem;
      }
      .tab-strip {
        display: flex;
        gap: 2rem;
      }
      .tab-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 0.25rem;
        color: #64748b;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        position: relative;
        transition: color 0.2s ease;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        &:hover {
          color: var(--primary);
        }
        &.active {
          color: var(--accent);
        }
        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 3px 3px 0 0;
          animation: scaleIn 0.2s ease;
        }
      }

      /* Viewport Aesthetics */
      .content-viewport {
        flex: 1;
        overflow-y: auto;
        scroll-behavior: smooth;
      }
      .viewport-canvas {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2.5rem;
      }

      /* Cargando y errores (F10 D14) */
      .state-viewport {
        max-width: 640px;
        margin: 0 auto;
        padding: 2.5rem 1rem;
      }

      @keyframes scaleIn {
        from {
          transform: scaleX(0);
        }
        to {
          transform: scaleX(1);
        }
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
