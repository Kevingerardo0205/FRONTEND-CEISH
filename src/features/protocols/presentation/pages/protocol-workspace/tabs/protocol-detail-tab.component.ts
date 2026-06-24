import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { resolveEstado } from '@shared/utils/estado.resolver';
import { ProtocolStatusLabelPipe } from '@shared/pipes/protocol-status-label.pipe';
import { ProtocolStatusClassPipe } from '@shared/pipes/protocol-status-class.pipe';

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
    ProtocolStatusClassPipe
  ],
  template: `
    <div class="tab-container animate-fade-in" *ngIf="protocol()">
      <div class="info-card">
        <div class="header-row d-flex justify-content-between align-items-center mb-3">
          <h3 class="section-title mb-0">Resumen del Proyecto</h3>
          <button *ngIf="isEditable()" 
                  [routerLink]="['/investigador/protocolo', protocol()?.id, 'editar']" 
                  class="edit-btn-inline">
            <mat-icon>edit</mat-icon> Completar / Editar Datos
          </button>
        </div>
        <mat-divider class="mb-4"></mat-divider>

        <div class="info-grid">
          <div class="info-item">
            <label>Tipo de Estudio</label>
            <p>{{ protocol()?.studyType?.name || protocol()?.type }}</p>
          </div>
          <div class="info-item">
            <label>Investigador Principal</label>
            <p>{{ protocol()?.principalInvestigator || 'Cargando...' }}</p>
          </div>
          <div class="info-item full-width">
            <label>Título del Proyecto</label>
            <p class="project-title">{{ protocol()?.title }}</p>
          </div>
        </div>

        <!-- Campos Diferidos / Opcionales -->
        <h4 class="section-subtitle mt-4 mb-3" *ngIf="hasDeferredData()"><mat-icon>info</mat-icon> Detalles Adicionales</h4>
        <div class="info-grid mt-2" *ngIf="hasDeferredData()">
          <div class="info-item" *ngIf="protocol()?.riskLevel">
            <label>Nivel de Riesgo</label>
            <p>{{ protocol()?.riskLevel?.name || protocol()?.riskLevel }}</p>
          </div>
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
          <span class="badge-count">{{ evaluations().length }} Miembros</span>
        </div>
        
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
        
        <div class="empty-evals" *ngIf="evaluations().length === 0">
          <mat-icon>group_off</mat-icon>
          <p>No se han asignado evaluadores a este protocolo aún.</p>
        </div>
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
            <div class="timeline-marker" [class.current]="ver.versionNumber === (protocol()?.version || 1)">
              <div class="marker-dot"></div>
              <div class="marker-line" *ngIf="!first"></div>
            </div>
            
            <div class="timeline-content-card p-3 border rounded mb-3 bg-white shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="version-info">
                  <span class="version-tag fw-bold">Versión {{ ver.versionNumber }}.0</span>
                  <span class="current-badge ms-2" *ngIf="ver.versionNumber === (protocol()?.version || 1)">Versión Activa</span>
                </div>
                <span class="status-badge" [ngClass]="ver.status | protocolStatusClass">
                  {{ ver.status | protocolStatusLabel }}
                </span>
              </div>
              
              <p class="small text-muted mb-1" *ngIf="ver.createdAt">
                <strong>Creada el:</strong> {{ ver.createdAt | date:'dd MMM, yyyy - HH:mm' }}
              </p>
              
              <!-- Detalles si fue observada / requiere subsanación -->
              <div class="observation-details mt-2 p-3 bg-red-soft rounded border-start border-danger border-3"
                   *ngIf="resolveEstado(ver.status)?.code === 'REQUIERE_SUBSANACION_VERSION' || ver.majorObservations || ver.minorObservations">
                <h5 class="fw-bold small text-danger text-uppercase mb-2">Dictamen de Observaciones Ético-Científicas</h5>
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
    </div>
  `,
  styles: [`
    .tab-container { max-width: 950px; margin: 0 auto; }
    .info-card { background: white; padding: 2rem; border-radius: 16px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 1.15rem; color: #0f172a; font-weight: 800; }
    .section-subtitle { font-size: 0.95rem; color: #334155; font-weight: 700; display: flex; align-items: center; gap: 6px; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item {
      label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
      p { margin: 0; color: #1e293b; font-weight: 600; font-size: 0.95rem; }
      .project-title { font-weight: 500; color: #334155; line-height: 1.4; }
    }
    .full-width { grid-column: span 2; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .badge-count { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    /* Evaluators Styling */
    .eval-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .eval-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.25rem;
      display: flex; justify-content: space-between; align-items: center;
      transition: border-color 0.2s; &:hover { border-color: #cbd5e1; }
    }
    .eval-identity { display: flex; align-items: center; gap: 1rem;
      .avatar { width: 36px; height: 36px; background: #e2e8f0; color: #64748b; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; }
      .info { display: flex; flex-direction: column; .name { font-weight: 700; color: #1e293b; font-size: 0.9rem; } .role-tag { font-size: 0.7rem; color: #94a3b8; font-weight: 600; } }
    }
    .eval-status-pills { display: flex; align-items: center; gap: 8px; }
    .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      &.pending { background: #f8fafc; color: #64748b; }
      &.completed { background: #f0fdf4; color: #166534; }
    }
    .empty-evals { padding: 3rem; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 16px; border: 1px dashed #e2e8f0; mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 0.5rem; } p { margin: 0; font-size: 0.85rem; font-weight: 600; } }
    .doc-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .doc-item {
      display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      .doc-info { flex: 1; display: flex; flex-direction: column;
        .doc-name { font-weight: 600; color: #1e293b; }
        .doc-meta { font-size: 0.75rem; color: #94a3b8; }
      }
      .download-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s;
        &:hover { background: #eff6ff; }
      }
    }
    
    /* Timeline styles */
    .timeline-scaffold { display: flex; flex-direction: column-reverse; margin-top: 1.5rem; position: relative; }
    .timeline-item { display: flex; gap: 1.5rem; position: relative; }
    .timeline-marker {
      display: flex; flex-direction: column; align-items: center; position: relative; width: 20px;
      .marker-dot { width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; border: 2px solid white; z-index: 2; box-shadow: 0 0 0 2px #cbd5e1; margin-top: 6px; }
      .marker-line { width: 2px; position: absolute; top: 18px; bottom: -18px; background: #e2e8f0; z-index: 1; }
      &.current .marker-dot { background: var(--accent, #3b82f6); box-shadow: 0 0 0 2px var(--accent, #3b82f6), 0 0 8px rgba(59, 130, 246, 0.4); }
    }
    .timeline-content-card { flex: 1; transition: all 0.2s ease; border-radius: 12px !important; border: 1px solid #e2e8f0; }
    .version-tag { font-size: 0.9rem; color: #1e293b; }
    .current-badge { font-size: 0.7rem; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
    .bg-red-soft { background: #fff5f5; }
    .observation-details { border-radius: 8px !important; }

    .mt-4 { margin-top: 1.5rem; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolDetailTabPage {
  private workspaceService = inject(ProtocolWorkspaceService);
  private authFacade = inject(AuthFacade);

  resolveEstado = resolveEstado;

  protocol = this.workspaceService.protocol;
  evaluations = this.workspaceService.evaluations;
  
  showEvaluators(): boolean {
    const role = this.authFacade.currentUser()?.rol?.toUpperCase();
    return ['ADMIN', 'SECRETARIA', 'PRESIDENTA', 'PRESIDENTE'].includes(role || '');
  }

  versions = computed(() => {
    const p = this.protocol();
    if (!p) return [];
    if (p.versions && p.versions.length > 0) {
      return p.versions;
    }
    return [{
      id: 0,
      versionNumber: typeof p.version === 'number' ? p.version : (parseInt(p.version as string, 10) || 1),
      status: p.status,
      createdAt: p.submissionDate
    }];
  });

  isEditable(): boolean {
    const p = this.protocol();
    if (!p) return false;
    const role = this.authFacade.currentUser()?.rol?.toUpperCase();
    const status = p.status as string;
    const core = resolveEstado(status);
    const code = core?.code || status;
    return role === 'INVESTIGADOR' && 
      (code === 'INICIADO' || 
       code === 'REQUIERE_SUBSANACION_DOC' || 
       code === 'INCOMPLETO');
  }

  hasDeferredData(): boolean {
    const p = this.protocol();
    if (!p) return false;
    return !!(
      p.riskLevel || 
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
