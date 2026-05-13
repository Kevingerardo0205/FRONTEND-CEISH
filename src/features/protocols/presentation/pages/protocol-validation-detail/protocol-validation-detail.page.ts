import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ValidateDocumentaryUseCase } from '../../../application/use-cases/validate-documentary.use-case';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { IncompleteValidationDialog } from './incomplete-validation-dialog.component';

@Component({
  selector: 'app-protocol-validation-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCheckboxModule, 
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    FormsModule
  ],
  template: `
    <div class="validation-wrapper animate-fade-in">
      
      <div *ngIf="isLoading()" class="loading-overlay">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>Cargando información del protocolo...</p>
      </div>

      <div *ngIf="!isLoading() && protocolNotFound()" class="error-state">
        <mat-icon>error</mat-icon>
        <h2>Protocolo no encontrado</h2>
        <button mat-flat-button color="primary" routerLink="/dashboard/protocols/validation/list">Volver a la lista</button>
      </div>

      <div *ngIf="!isLoading() && !protocolNotFound()">
        <!-- ENCABEZADO ESTILO OFICIAL PET 2023 -->
        <header class="official-header">
          <div class="top-row">
            <button mat-icon-button routerLink="/dashboard/protocols/validation/list" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-text">
              <span class="institution">ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</span>
              <h1>NOTIFICACIÓN DE RECEPCIÓN DE PROTOCOLO DE INVESTIGACIÓN ({{ protocolTypeLabel() }})</h1>
              <p class="subtitle">COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS (CEISH-ESPOCH)</p>
            </div>
          </div>

          <div class="protocol-info-grid">
            <div class="info-item">
              <span class="label">CÓDIGO DE TRÁMITE:</span>
              <span class="value code">{{ generatedCode() || 'TRÁMITE EN PROCESO' }}</span>
            </div>
            <div class="info-item full">
              <span class="label">TEMA DEL PROYECTO:</span>
              <span class="value title">"{{ protocolTitle() }}"</span>
            </div>
          </div>
        </header>

        <!-- CHECKLIST DE REQUISITOS (ESTILO EXCEL) -->
        <div class="checklist-container mt-4">
          <h2 class="checklist-title">LISTA DE VERIFICACIÓN DE REQUISITOS DOCUMENTALES (PET 2023)</h2>
          
          <div class="table-scroll">
            <table class="excel-table">
              <thead>
                <tr>
                  <th class="col-req">REQUISITOS</th>
                  <th class="col-doc">DOCUMENTO</th>
                  <th class="col-action">VALIDACIÓN</th>
                  <th class="col-obs">OBSERVACIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of checklist()" [ngClass]="{'row-validated': item.status === 1, 'row-rejected': item.status === 2}">
                  <td class="req-label">
                    <span class="req-id">{{ item.anexo }}</span>
                    {{ item.label }}
                    <span *ngIf="item.isOptional" class="badge-optional">(Opcional)</span>
                  </td>
                  <td class="text-center">
                    <a *ngIf="item.documentUrl" [href]="item.documentUrl" target="_blank" mat-icon-button color="primary" matTooltip="Ver documento">
                      <mat-icon>visibility</mat-icon>
                    </a>
                    <span *ngIf="!item.documentUrl" class="text-muted small">No subido</span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group-validation">
                      <button mat-icon-button [color]="item.status === 1 ? 'primary' : ''" 
                              (click)="onValidateDocument(item, 1)" 
                              [disabled]="!item.documentId || isProcessing"
                              matTooltip="Aprobar">
                        <mat-icon>{{ item.status === 1 ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                      </button>
                      <button mat-icon-button [color]="item.status === 2 ? 'warn' : ''" 
                              (click)="onValidateDocument(item, 2)" 
                              [disabled]="!item.documentId || isProcessing"
                              matTooltip="Rechazar">
                        <mat-icon>{{ item.status === 2 ? 'cancel' : 'highlight_off' }}</mat-icon>
                      </button>
                    </div>
                  </td>
                  <td>
                    <input type="text" class="mini-input" [(ngModel)]="item.observations" placeholder="Nota opcional...">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DE ACCIÓN Y NOTIFICACIONES -->
        <div class="action-footer mt-4">
          <div class="summary-panel full-width">
            <div class="progress-container">
              <div class="progress-labels">
                <span>Progreso de validación:</span>
                <strong>{{ progress() }}%</strong>
              </div>
              <mat-progress-bar mode="determinate" [value]="progress()" 
                                [color]="progress() === 100 ? 'primary' : 'accent'"></mat-progress-bar>
            </div>

            <div class="action-buttons-row">
              <button *ngIf="generatedCode()" mat-stroked-button color="accent" (click)="onDownloadCertificate()" class="btn-cert">
                <mat-icon>download</mat-icon> DESCARGAR ANEXO 7 (CONSTANCIA)
              </button>
              
              <button mat-flat-button class="btn-finalize" 
                      [disabled]="progress() < 100 || isProcessing || generatedCode()" (click)="onFinalize()">
                <mat-icon>send</mat-icon>
                {{ generatedCode() ? 'REVISIÓN FINALIZADA' : 'FINALIZAR REVISIÓN Y GENERAR CONSTANCIA' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .validation-wrapper { padding: 1.5rem; max-width: 1250px; margin: 0 auto; min-height: 80vh; }
    
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #64748b; }
    .error-state { text-align: center; padding: 4rem; color: #64748b; mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; } }

    .official-header {
      background: white; border: 2px solid #000; padding: 1.5rem;
      .top-row { display: flex; align-items: flex-start; gap: 1rem; border-bottom: 1px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; }
      .header-text { flex: 1; text-align: center; 
        .institution { font-weight: 800; font-size: 1.1rem; display: block; color: #000; }
        h1 { font-size: 1.25rem; font-weight: 900; color: #003366; margin: 0.5rem 0; }
        .subtitle { font-size: 0.9rem; font-weight: 600; color: #000; margin: 0; }
      }
    }

    .protocol-info-grid {
      display: grid; grid-template-columns: 250px 1fr; gap: 0; border: 1px solid #000;
      .info-item { padding: 0.75rem; border-right: 1px solid #000; border-bottom: 1px solid #000; display: flex; flex-direction: column;
        &.full { grid-column: 1 / -1; border-right: none; border-bottom: none; }
        .label { font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 4px; }
        .value { font-weight: 700; &.code { color: #003366; font-size: 1.1rem; } &.title { font-style: italic; } }
      }
    }

    .checklist-title { background: #003366; color: white; padding: 10px; font-size: 0.9rem; font-weight: 700; margin: 0; text-align: center; }

    .excel-table {
      width: 100%; border-collapse: collapse; border: 1px solid #000; background: white;
      th { background: #d1d5db; color: #000; border: 1px solid #000; padding: 10px; font-size: 0.75rem; text-transform: uppercase; }
      td { border: 1px solid #000; padding: 8px; font-size: 0.85rem; vertical-align: middle; }
      .req-label { 
        .req-id { font-weight: 900; color: #003366; margin-right: 8px; } 
        .badge-optional { font-size: 0.7rem; color: #64748b; margin-left: 4px; font-style: italic; }
      }
      .text-center { text-align: center; }
      .mini-input { width: 100%; border: 1px solid #cbd5e1; padding: 6px; border-radius: 4px; }
      .btn-group-validation { display: flex; justify-content: center; gap: 4px; }
      .row-validated { background-color: #f0fdf4; }
      .row-rejected { background-color: #fef2f2; }
    }

    .action-footer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px; }
    .summary-panel { display: flex; flex-direction: column; gap: 1.5rem; &.full-width { width: 100%; } }
    .progress-labels { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
    
    .action-buttons-row { display: flex; justify-content: flex-end; gap: 1rem;
      .btn-cert { height: 52px; font-weight: 700; border-radius: 8px; border: 2px solid #059669; color: #059669; }
      .btn-finalize { height: 52px; font-weight: 700; border-radius: 8px; background: #003366 !important; color: white !important; min-width: 300px; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private repository = inject(IProtocolRepositoryPort);
  private docRepository = inject(IDocumentRepositoryPort);
  private validateUseCase = inject(ValidateDocumentaryUseCase);
  private dialog = inject(MatDialog);

  isLoading = signal(true);
  protocolNotFound = signal(false);
  protocolId = '';
  protocolTitle = signal('');
  protocolType = signal(ProtocolType.IO);
  protocolTypeLabel = computed(() => {
    switch(this.protocolType()) {
      case ProtocolType.IO: return 'ESTUDIO OBSERVACIONAL';
      case ProtocolType.EC: return 'ENSAYO CLÍNICO';
      case ProtocolType.EI: return 'ESTUDIO DE INTERVENCIÓN';
      default: return 'PROTOCOLO';
    }
  });

  progress = signal(0);
  isProcessing = false;
  generatedCode = signal<string | null>(null);
  
  checklist = signal<any[]>([]);

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    this.loadProtocol();
  }

  loadProtocol() {
    this.isLoading.set(true);
    // 1. Obtener Checklist REAL del Backend (Sprint 1)
    this.repository.getChecklist(this.protocolId).subscribe({
      next: (res) => {
        const protocol = res.protocol || res;
        const documents = res.documents || [];

        this.protocolTitle.set(protocol.title);
        this.protocolType.set(protocol.type);
        this.generatedCode.set(protocol.code || null);
        
        this.checklist.set(documents.map((d: any) => ({
          label: d.documentType?.name || 'Requisito',
          anexo: d.documentType?.description || 'N/A',
          typeId: d.documentTypeId,
          documentId: d.id,
          documentUrl: d.path, 
          status: d.status === 'VALIDADO' ? 1 : (d.status === 'RECHAZADO' ? 2 : 0),
          observations: d.observations || '',
          isOptional: d.isOptional
        })));

        this.updateProgress();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading checklist:', err);
        this.protocolNotFound.set(true);
        this.isLoading.set(false);
        this.snackBar.open('❌ No se pudo cargar el checklist de recepción.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  onValidateDocument(item: any, statusId: number) {
    if (!item.documentId && statusId === 1) return;

    this.isProcessing = true;
    this.docRepository.validateDocument(item.documentId, statusId, item.observations).subscribe({
      next: () => {
        item.status = statusId;
        this.updateProgress();
        this.isProcessing = false;
        const msg = statusId === 1 ? 'Documento aprobado' : 'Documento rechazado';
        this.snackBar.open(`✅ ${msg}`, 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al validar el documento', 'Cerrar', { duration: 3000 });
      }
    });
  }

  updateProgress() {
    const total = this.checklist().length;
    if (total === 0) return;
    const answered = this.checklist().filter(c => c.status !== 0 || c.isOptional).length;
    this.progress.set(Math.round((answered / total) * 100));
  }

  onFinalize() {
    this.isProcessing = true;
    this.validateUseCase.execute(this.protocolId).subscribe({
      next: (res) => {
        this.isProcessing = false;
        const code = res.ceishCode || res.code || 'GENERADO';
        this.generatedCode.set(code);
        this.snackBar.open(`✅ Recepción finalizada. Código CEISH: ${code}`, 'Cerrar', { duration: 10000 });
        
        // Ofrecer descarga inmediata
        this.onDownloadCertificate();
      },
      error: (err) => {
        this.isProcessing = false;
        
        if (err.status === 400 && err.error?.missingDocuments) {
          this.dialog.open(IncompleteValidationDialog, {
            width: '500px',
            data: {
              missingDocuments: err.error.missingDocuments,
              deadline: err.error.deadline
            }
          });
        } else {
          const msg = err.error?.message || 'Error al finalizar la recepción';
          this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
        }
      }
    });
  }

  onDownloadCertificate() {
    this.repository.getCertificate(this.protocolId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Anexo_7_Constancia_${this.generatedCode()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('❌ Error al descargar la constancia.', 'Cerrar');
      }
    });
  }
}

