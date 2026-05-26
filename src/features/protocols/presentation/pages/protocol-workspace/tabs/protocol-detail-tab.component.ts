import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';

@Component({
  selector: 'app-protocol-detail-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule
  ],
  template: `
    <div class="tab-container animate-fade-in" *ngIf="protocol()">
      <div class="info-card">
        <h3 class="section-title">Resumen del Proyecto</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Tipo de Estudio</label>
            <p>{{ protocol()?.type }}</p>
          </div>
          <div class="info-item">
            <label>Investigador Principal</label>
            <p>{{ protocol()?.principalInvestigator }}</p>
          </div>
          <div class="info-item full-width">
            <label>Descripción / Objetivo</label>
            <p>{{ getProtocolDescription() || 'No proporcionada' }}</p>
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
              <span class="doc-meta">Versión {{ protocol()?.version }} • PDF</span>
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
    .tab-container { max-width: 900px; margin: 0 auto; }
    .info-card { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 1.1rem; color: #003366; font-weight: 700; margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item {
      label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
      p { margin: 0; color: #1e293b; font-weight: 500; font-size: 0.95rem; }
    }
    .full-width { grid-column: span 2; }
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
  protocol = this.workspaceService.protocol;

  getProtocolDescription(): string {
    return (this.protocol() as any)?.description;
  }
}
