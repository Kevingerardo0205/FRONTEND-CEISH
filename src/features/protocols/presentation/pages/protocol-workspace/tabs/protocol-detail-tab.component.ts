import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

@Component({
  selector: 'app-protocol-detail-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    RouterModule
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
          <div class="info-item" *ngIf="protocol()?.lugarEjecucion">
            <label>Lugar de Ejecución</label>
            <p>{{ protocol()?.lugarEjecucion }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.fechaInicioEstimada">
            <label>Fecha Inicio Estimada</label>
            <p>{{ protocol()?.fechaInicioEstimada | date:'longDate' }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.fechaFinEstimada">
            <label>Fecha Fin Estimada</label>
            <p>{{ protocol()?.fechaFinEstimada | date:'longDate' }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.sponsorRuc">
            <label>RUC del Patrocinador</label>
            <p>{{ protocol()?.sponsorRuc }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.sponsorExecutingAgency">
            <label>Órgano Ejecutor</label>
            <p>{{ protocol()?.sponsorExecutingAgency }}</p>
          </div>
          <div class="info-item" *ngIf="protocol()?.financingAmount">
            <label>Presupuesto Financiado</label>
            <p>$ {{ protocol()?.financingAmount | number }} USD</p>
          </div>
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
    .edit-btn-inline {
      display: flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0;
      color: #0f172a; font-weight: 700; font-size: 0.8rem; padding: 8px 16px; border-radius: 8px; cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #e2e8f0; }
    }
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
    .mt-4 { margin-top: 1.5rem; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolDetailTabPage {
  private workspaceService = inject(ProtocolWorkspaceService);
  private authFacade = inject(AuthFacade);

  protocol = this.workspaceService.protocol;

  isEditable(): boolean {
    const p = this.protocol();
    if (!p) return false;
    const role = this.authFacade.currentUser()?.rol?.toUpperCase();
    const status = p.status as string;
    return role === 'INVESTIGADOR' && 
      (status === 'DRAFT' || 
       status === 'BORRADOR' || 
       status === 'REQUIERE_CORRECCION' || 
       status === 'OBSERVED' || 
       status === 'PENDIENTE_SUBSANACION');
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
