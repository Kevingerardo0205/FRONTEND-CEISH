import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimelineAcceptanceModalComponent } from '../../components/timeline-acceptance-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AssignPeersModalComponent } from '../../../../dashboard/presentation/components/assign-peers-modal/assign-peers-modal.component';

import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { resolveEstado } from '@shared/utils/estado.resolver';

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
    MatProgressBarModule,
    MatTooltipModule,
    ProtocolCodePipe,
    MatSnackBarModule,
    TimelineAcceptanceModalComponent,
    MatDialogModule
  ],
  template: `
    <div class="workspace-shell" *ngIf="protocol(); else loading">
      <!-- MODAL DE ACEPTACIÓN OBLIGATORIO DE TIEMPOS -->
      <app-timeline-acceptance-modal
        *ngIf="showAcceptanceModal()"
        [protocolId]="protocolIdNumber()"
        [ceishCode]="protocol()?.code || ''"
        (accepted)="onTimelineAccepted()">
      </app-timeline-acceptance-modal>

      <!-- 1. Header Premium: Identidad y Acciones Rápidas -->
      <header class="premium-header">
        <div class="header-main">
          <div class="identity-block">
            <div class="meta-row">
              <span class="protocol-id">{{ protocol()?.code | protocolCode }}</span>
              <span class="status-indicator" [attr.data-status]="protocol()!.status">
                {{ getFriendlyStatusLabel(protocol()!.status) }}
              </span>
            </div>
            <h1 class="protocol-title" [matTooltip]="protocol()?.title">
              {{ protocol()?.title }}
            </h1>
            <div class="owner-chip">
              <mat-icon>account_circle</mat-icon>
              <span>{{ protocol()?.principalInvestigator || 'Cargando...' }}</span>
            </div>
          </div>
          
          <div class="action-registry">
            <button class="action-btn secondary" matRipple matTooltip="Ver bitácora de auditoría">
              <mat-icon>history</mat-icon>
              <span>Historial</span>
            </button>
            <div class="divider"></div>
            <button 
              class="action-btn primary" 
              *ngFor="let action of contextualActions()" 
              (click)="onExecuteAction(action.id)"
              matRipple>
              <mat-icon>{{ action.icon }}</mat-icon>
              <span>{{ action.label }}</span>
            </button>
            <button class="action-btn success" matRipple>
              <mat-icon>check_circle</mat-icon>
              <span>Finalizar</span>
            </button>
          </div>
        </div>

        <!-- 2. Timeline Evolucionado: Visualización de Progreso -->
        <div class="progress-scaffold">
          <div class="stepper-line">
            <div class="step" [class.completed]="isStepCompleted('RECEPCION')" [class.active]="isStepActive('RECEPCION')">
              <div class="dot"><mat-icon *ngIf="isStepCompleted('RECEPCION')">check</mat-icon></div>
              <span class="label">Recepción</span>
            </div>
            <div class="connector" [class.filled]="isStepCompleted('VALIDACION')"></div>
            <div class="step" [class.completed]="isStepCompleted('VALIDACION')" [class.active]="isStepActive('VALIDACION')">
              <div class="dot"><mat-icon *ngIf="isStepCompleted('VALIDACION')">check</mat-icon></div>
              <span class="label">Validación</span>
            </div>
            <div class="connector" [class.filled]="isStepCompleted('EVALUACION')"></div>
            <div class="step" [class.completed]="isStepCompleted('EVALUACION')" [class.active]="isStepActive('EVALUACION')">
              <div class="dot"><mat-icon *ngIf="isStepCompleted('EVALUACION')">check</mat-icon></div>
              <span class="label">Evaluación</span>
            </div>
            <div class="connector" [class.filled]="isStepCompleted('RESOLUCION')"></div>
            <div class="step" [class.completed]="isStepCompleted('RESOLUCION')" [class.active]="isStepActive('RESOLUCION')">
              <div class="dot"><mat-icon *ngIf="isStepCompleted('RESOLUCION')">check</mat-icon></div>
              <span class="label">Resolución</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 3. Navegación Tabular Estilizada -->
      <nav class="navigation-scaffold">
        <div class="tab-strip">
          <a class="tab-item" 
             *ngFor="let tab of tabConfig()"
             [routerLink]="tab.path"
             routerLinkActive="active"
             #rla="routerLinkActive">
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

    <ng-template #loading>
      <div class="loading-viewport">
        <div class="loader-card">
          <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
          <p>Sincronizando Workspace del Protocolo...</p>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { --primary: #0f172a; --accent: #3b82f6; --success: #10b981; --border: #e2e8f0; --bg: #f8fafc; }

    .workspace-shell {
      display: flex; flex-direction: column; height: calc(100vh - 64px); background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
    }

    /* Header Aesthetics */
    .premium-header {
      background: white; border-bottom: 1px solid var(--border); padding: 1.5rem 2.5rem 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .header-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }

    .identity-block {
      max-width: 60%;
      .meta-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
      .protocol-id { font-weight: 800; color: #64748b; font-size: 0.85rem; letter-spacing: 0.05em; }
      .status-indicator { 
        font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
        &[data-status="DRAFT"] { background: #f1f5f9; color: #475569; }
        &[data-status="SUBMITTED"] { background: #ecfdf5; color: #065f46; }
        &[data-status="EN_EVALUACION"] { background: #eff6ff; color: #1e40af; }
        &[data-status="DISCREPANCIA_RIESGO"], &[data-status="DISCREPANCIA_DE_RIESGO"] { background: #fff7ed; color: #c2410c; }
      }
      .protocol-title { 
        margin: 0 0 0.75rem; font-size: 1.5rem; color: var(--primary); font-weight: 700; 
        line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      .owner-chip { 
        display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.85rem; 
        mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
      }
    }

    /* Action Registry Styling */
    .action-registry {
      display: flex; align-items: center; gap: 0.75rem; background: #f1f5f9; padding: 0.5rem; border-radius: 12px;
      .divider { width: 1px; height: 24px; background: #cbd5e1; margin: 0 0.25rem; }
      .action-btn {
        display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border: none; border-radius: 8px;
        font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
        &.secondary { background: transparent; color: #475569; &:hover { background: #e2e8f0; } }
        &.primary { background: var(--primary); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); &:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.15); } }
        &.success { background: var(--success); color: white; &:hover { background: #059669; } }
      }
    }

    /* Progress Scaffold (Timeline) */
    .progress-scaffold {
      padding: 0 1rem 1.5rem;
      .stepper-line { display: flex; align-items: center; justify-content: space-between; max-width: 900px; }
      .step {
        display: flex; flex-direction: column; align-items: center; gap: 0.6rem; position: relative; z-index: 2;
        .dot { 
          width: 24px; height: 24px; border-radius: 50%; background: white; border: 2px solid #cbd5e1;
          display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;
          mat-icon { font-size: 14px; width: 14px; height: 14px; color: white; font-weight: 800; }
        }
        .label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s ease; }
        &.active .dot { border-color: var(--accent); border-width: 3px; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        &.active .label { color: var(--primary); }
        &.completed .dot { background: var(--success); border-color: var(--success); }
        &.completed .label { color: #64748b; }
      }
      .connector { 
        flex: 1; height: 3px; background: #e2e8f0; margin: 0 -12px 24px; border-radius: 2px;
        &.filled { background: var(--success); }
      }
    }

    /* Navigation Aesthetic */
    .navigation-scaffold { background: white; border-bottom: 1px solid var(--border); padding: 0 2.5rem; }
    .tab-strip { display: flex; gap: 2rem; }
    .tab-item {
      display: flex; align-items: center; gap: 0.5rem; padding: 1rem 0.25rem; color: #64748b; text-decoration: none;
      font-weight: 600; font-size: 0.9rem; position: relative; transition: color 0.2s ease;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { color: var(--primary); }
      &.active { color: var(--accent); }
      .active-indicator { 
        position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); 
        border-radius: 3px 3px 0 0; animation: scaleIn 0.2s ease;
      }
    }

    /* Viewport Aesthetics */
    .content-viewport { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
    .viewport-canvas { max-width: 1400px; margin: 0 auto; padding: 2.5rem; }

    /* Loader Aesthetic */
    .loading-viewport { 
      height: 100vh; display: flex; align-items: center; justify-content: center; background: #f1f5f9; 
      .loader-card { 
        background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); width: 400px; text-align: center;
        p { margin-top: 1.5rem; font-weight: 600; color: #475569; }
      }
    }

    @keyframes scaleIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(ProtocolWorkspaceService);
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  protocol = this.workspaceService.protocol;

  protocolIdNumber = computed(() => Number(this.protocol()?.id || 0));

  showAcceptanceModal = computed(() => {
    const p = this.protocol();
    const user = this.authFacade.currentUser();
    if (!p || !user) return false;
    
    const isIp = user.rol?.toUpperCase() === 'INVESTIGADOR';
    const isComplete = p.status?.toUpperCase() === 'COMPLETO';
    const isNotSigned = !p.isTimelineTermsAccepted;
    
    return isIp && isComplete && isNotSigned;
  });

  onTimelineAccepted() {
    this.workspaceService.updateProtocol({
      isTimelineTermsAccepted: true
    });
    this.snackBar.open('📋 Conformidad aceptada con éxito. Su protocolo ha sido sometido formalmente a evaluación.', 'Entendido', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  contextualActions = computed(() => {
    const p = this.protocol();
    if (!p) return [];

    const actions = [];
    const role = this.authFacade.currentUser()?.rol?.toUpperCase();
    const status = p.status as string;
    const core = resolveEstado(status);
    const code = core?.code || status;

    if (role === 'INVESTIGADOR' && (code === 'INICIADO' || code === 'REQUIERE_SUBSANACION_DOC' || code === 'INCOMPLETO')) {
      actions.push({ id: 'EDIT_PROTOCOL', label: 'Completar / Editar', icon: 'edit' });
    }

    if (code === 'EN_REVISION_SECRETARIA') {
      actions.push({ id: 'VALIDATE_ALL', label: 'Aprobar Todo', icon: 'done_all' });
    }
    if (code === 'COMPLETO' || code === 'INCOMPLETO') {
      actions.push({ id: 'ASSIGN_EVALUATORS', label: 'Asignar Pares', icon: 'person_add' });
    }
    return actions;
  });

  tabConfig = computed(() => {
    const p = this.protocol();
    if (!p) return [];

    const role = this.authFacade.currentUser()?.rol?.toUpperCase();
    const tabs = [{ label: 'Resumen', icon: 'dashboard', path: 'info' }];

    // Pestaña de Validación Documental: Para admins, secretaría, presidencia y el propio investigador (después de borrador)
    if (p.status !== ProtocolStatus.DRAFT) {
      const canValidate = ['ADMIN', 'SECRETARIA', 'PRESIDENTA', 'PRESIDENTE'].includes(role || '');
      if (canValidate || role === 'INVESTIGADOR') {
        tabs.push({ label: 'Validación Técnica', icon: 'fact_check', path: 'validation' });
      }
    }

    // Pestaña de Evaluación Ética: Para admins, secretaría, presidencia y evaluadores asignados
    if ([ProtocolStatus.EN_EVALUACION, ProtocolStatus.APPROVED, ProtocolStatus.DISCREPANCIA_RIESGO, ProtocolStatus.DISCREPANCIA_DE_RIESGO].includes(p.status)) {
      const canEvaluate = ['ADMIN', 'SECRETARIA', 'PRESIDENTA', 'PRESIDENTE', 'EVALUADOR'].includes(role || '');
      if (canEvaluate) {
        tabs.push({ label: 'Evaluación Ética', icon: 'gavel', path: 'evaluation' });
      }
    }

    // Pestaña de Seguimiento (Eventos Adversos, etc.): Se activa tras ser Aprobado
    if (p.status === ProtocolStatus.APPROVED) {
      tabs.push({ label: 'Seguimiento', icon: 'history', path: 'follow-up' });
    }

    return tabs;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.workspaceService.loadProtocol(params['id']).subscribe();
      }
    });
  }

  onExecuteAction(actionId: string) {
    if (actionId === 'EDIT_PROTOCOL') {
      this.router.navigate(['/investigador/protocolo', this.protocol()?.id, 'editar']);
    } else if (actionId === 'VALIDATE_ALL') {
      this.router.navigate(['/dashboard/protocols/workspace', this.protocol()?.id, 'validation']);
    } else if (actionId === 'ASSIGN_EVALUATORS') {
      const p = this.protocol();
      if (!p) return;
      
      const mappedProtocol: any = {
        id: Number(p.id),
        ceishCode: p.code || '',
        title: p.title,
        receptionStatus: p.status,
        isRiskLevelDesignated: false,
        createdAt: p.submissionDate ? new Date(p.submissionDate).toISOString() : new Date().toISOString(),
        studyType: p.studyType ? {
          id: p.studyType.id || 0,
          codigo: p.studyType.codigo || p.studyType.code || '',
          nombre: p.studyType.nombre || p.studyType.name || 'General'
        } : {
          id: 0,
          codigo: p.studyTypeCode || '',
          nombre: p.type || 'General'
        },
        principalInvestigatorRecord: {
          id: 0,
          fullName: p.principalInvestigator || 'Investigador Principal',
          email: ''
        }
      };

      const dialogRef = this.dialog.open(AssignPeersModalComponent, {
        width: '600px',
        data: { protocol: mappedProtocol },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((assigned: boolean) => {
        if (assigned) {
          this.snackBar.open('✅ Evaluadores asignados correctamente.', 'Cerrar', { duration: 4000 });
          this.workspaceService.loadProtocol(p.id).subscribe();
        }
      });
    } else {
      console.log('[ProtocolWorkspace] Executing action:', actionId);
    }
  }

  isStepActive(step: string): boolean {
    const p = this.protocol();
    if (!p) return false;
    switch (step) {
      case 'RECEPCION': return p.status === ProtocolStatus.SUBMITTED;
      case 'VALIDACION': return p.status === ProtocolStatus.VALIDATED;
      case 'EVALUACION': return p.status === ProtocolStatus.EN_EVALUACION || p.status === ProtocolStatus.DISCREPANCIA_RIESGO || p.status === ProtocolStatus.DISCREPANCIA_DE_RIESGO;
      case 'RESOLUCION': return p.status === ProtocolStatus.APPROVED;
      default: return false;
    }
  }

  isStepCompleted(step: string): boolean {
    const p = this.protocol();
    if (!p) return false;
    const statusOrder = [ProtocolStatus.DRAFT, ProtocolStatus.SUBMITTED, ProtocolStatus.VALIDATED, ProtocolStatus.EN_EVALUACION, ProtocolStatus.APPROVED];
    let currentIdx = statusOrder.indexOf(p.status);
    if (p.status === ProtocolStatus.DISCREPANCIA_RIESGO || p.status === ProtocolStatus.DISCREPANCIA_DE_RIESGO) {
      currentIdx = statusOrder.indexOf(ProtocolStatus.EN_EVALUACION);
    }
    
    switch (step) {
      case 'RECEPCION': return currentIdx > 1;
      case 'VALIDACION': return currentIdx > 2;
      case 'EVALUACION': return currentIdx > 3;
      case 'RESOLUCION': return currentIdx >= 4;
      default: return false;
    }
  }

  getFriendlyStatusLabel(status: string): string {
    if (!status) return '';
    const labels: { [key: string]: string } = {
      'DRAFT': 'Borrador',
      'BORRADOR': 'Borrador',
      'SUBMITTED': 'Recibido',
      'PRESENTADO': 'Recibido',
      'EN_REVISION_SECRETARIA': 'Revisión Técnica',
      'EN_REVISION_DOCUMENTAL': 'Revisión Técnica',
      'VALIDATED': 'Validado',
      'VALIDADO': 'Validado',
      'COMPLETO': 'Validado',
      'EN_EVALUACION': 'En Evaluación',
      'DISCREPANCIA_RIESGO': 'Discrepancia de Riesgo',
      'DISCREPANCIA_DE_RIESGO': 'Discrepancia de Riesgo',
      'APPROVED': 'Aprobado',
      'APROBADO': 'Aprobado',
      'REJECTED': 'Rechazado',
      'OBSERVED': 'Observado',
      'OBSERVADO': 'Observado',
    };
    return labels[status.toUpperCase()] || status.replace(/_/g, ' ');
  }
}
