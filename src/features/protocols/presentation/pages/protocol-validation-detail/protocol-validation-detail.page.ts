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
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ValidateDocumentaryUseCase } from '../../../application/use-cases/validate-documentary.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { ValidationChecklistItem, ValidationHeader, ValidationGlobalStatus } from '@domain/entities/protocol.entity';
import { IncompleteValidationDialog } from './incomplete-validation-dialog.component';
import { ReceptionSuccessDialog } from './reception-success-dialog.component';

import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';

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
    MatDividerModule, 
    FormsModule
  ],
  template: `
    <div class="validation-wrapper animate-fade-in" [class.in-workspace]="isInsideWorkspace()">
      
      <!-- Ocultar si estamos en el Workspace para evitar duplicidad -->
      <div *ngIf="!isInsideWorkspace()">
        <div *ngIf="isLoading()" class="loading-overlay">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Cargando información técnica del protocolo...</p>
        </div>

        <div *ngIf="!isLoading() && protocolNotFound()" class="error-state">
          <mat-icon>error</mat-icon>
          <h2>Protocolo no encontrado</h2>
          <button mat-flat-button color="primary" routerLink="/dashboard/protocols/validation/list">Volver a la lista</button>
        </div>
      </div>

      <div *ngIf="(!isLoading() && !protocolNotFound()) || isInsideWorkspace()">
        <!-- ENCABEZADO ESTILO OFICIAL PET 2023 - Solo si no es Workspace -->
        <header class="official-header shadow-sm" *ngIf="!isInsideWorkspace()">
          <div class="top-row">
            <button mat-icon-button routerLink="/dashboard/protocols/validation/list" class="back-btn" matTooltip="Volver a la lista">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-text">
              <span class="institution">ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</span>
              <h1>NOTIFICACIÓN DE RECEPCIÓN DE PROTOCOLO DE INVESTIGACIÓN ({{ header()?.studyType | uppercase }})</h1>
              <p class="subtitle">COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS (CEISH-ESPOCH)</p>
            </div>
            <button mat-stroked-button color="primary" [routerLink]="['/dashboard/protocols/workspace', protocolId, 'info']" class="ms-auto">
              <mat-icon>visibility</mat-icon>
              Ver Detalle General
            </button>
          </div>

          <div class="protocol-info-grid">
            <div class="info-item">
              <span class="label">CÓDIGO DE TRÁMITE:</span>
              <div class="d-flex align-items-center justify-content-between gap-2">
                <span class="value code">{{ header()?.ceishCode || 'TRÁMITE EN PROCESO' }}</span>
                <span class="badge-status" [ngClass]="globalStatus()?.status?.toLowerCase() || ''">
                  {{ globalStatus()?.status || 'PENDIENTE' }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">FECHA DE ENVÍO:</span>
              <span class="value">{{ header()?.submissionDate | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-item full">
              <span class="label">INVESTIGADOR PRINCIPAL:</span>
              <span class="value">{{ header()?.investigator || 'No especificado' }}</span>
            </div>
            <div class="info-item full">
              <span class="label">TEMA DEL PROYECTO:</span>
              <span class="value title">"{{ header()?.title }}"</span>
            </div>
          </div>
        </header>

        <!-- CHECKLIST DE REQUISITOS (ESTILO EXCEL) -->
        <div class="checklist-container" [class.mt-4]="!isInsideWorkspace()">
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
                <tr *ngFor="let item of checklist()" [ngClass]="{'row-validated': item.status === 'APROBADO' || item.status === 'VALIDADO', 'row-rejected': item.status === 'RECHAZADO'}">
                  <td class="req-label">
                    <div class="d-flex flex-column">
                      <span class="req-id">{{ item.code }}</span>
                      <span class="req-name">{{ item.name }}</span>
                      <span class="item-status-tag" [ngClass]="item.status.toLowerCase()">{{ item.status }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div *ngIf="item.attachedDocument; else noDoc">
                      <a [href]="item.attachedDocument.path" target="_blank" mat-icon-button color="primary" matTooltip="Ver documento cargado">
                        <mat-icon>description</mat-icon>
                      </a>
                      <div class="small text-muted" style="font-size: 0.65rem;">{{ item.attachedDocument.fileName | slice:0:15 }}...</div>
                    </div>
                    <ng-template #noDoc>
                      <span class="text-muted small italic">Sin archivo</span>
                    </ng-template>
                  </td>
                  <td class="text-center">
                    <div class="btn-group-validation" *ngIf="item.attachedDocument">
                      <button mat-icon-button [color]="item.status === 'APROBADO' ? 'primary' : ''" 
                              (click)="onValidateItem(item, 1)" 
                              [disabled]="isProcessing"
                              matTooltip="Aprobar documento">
                        <mat-icon>{{ item.status === 'APROBADO' ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                      </button>
                      <button mat-icon-button [color]="item.status === 'RECHAZADO' ? 'warn' : ''" 
                              (click)="onValidateItem(item, 2)" 
                              [disabled]="isProcessing"
                              matTooltip="Rechazar documento">
                        <mat-icon>{{ item.status === 'RECHAZADO' ? 'cancel' : 'highlight_off' }}</mat-icon>
                      </button>
                    </div>
                    <span *ngIf="!item.attachedDocument" class="small text-muted">-</span>
                  </td>
                  <td>
                    <input type="text" class="mini-input" [(ngModel)]="item.observations" 
                           [placeholder]="item.status === 'RECHAZADO' ? 'Motivo de rechazo (obligatorio)...' : 'Nota opcional...'"
                           [disabled]="!item.attachedDocument || isProcessing">
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="checklist().length === 0" class="empty-docs-warning p-4 text-center">
              <mat-icon color="warn">warning</mat-icon>
              <p>No se encontraron requisitos para este protocolo.</p>
            </div>
          </div>
        </div>

        <!-- PANEL DE OBSERVACIONES GENERALES -->
        <div class="verification-panel mt-4 p-4 shadow-soft">
          <h3 class="section-title"><mat-icon>chat_bubble_outline</mat-icon> Observaciones Generales (Para correo al investigador)</h3>
          <mat-form-field class="full-width" appearance="outline">
            <mat-label>Observaciones Generales / Lista de Faltantes</mat-label>
            <textarea matInput rows="3" [(ngModel)]="missingItemsList" placeholder="Ej: Se solicita revisar el formato del Anexo 2 que se encuentra ilegible..."></textarea>
          </mat-form-field>
        </div>

        <!-- PANEL DE ACCIÓN Y NOTIFICACIONES -->
        <div class="action-footer mt-4">
          <div class="summary-panel full-width">
            <div class="progress-container">
              <div class="progress-labels">
                <span>Progreso de validación (Ítems obligatorios): {{ validatedCount() }} / {{ mandatoryCount() }}</span>
                <strong>{{ progress() }}%</strong>
              </div>
              <mat-progress-bar mode="determinate" [value]="progress()" 
                                [color]="progress() === 100 ? 'primary' : 'accent'"></mat-progress-bar>
            </div>

            <div class="action-buttons-row">
              <button *ngIf="header()?.ceishCode && header()?.ceishCode !== 'TRÁMITE EN PROCESO'" mat-stroked-button color="accent" (click)="onDownloadCertificate()" class="btn-cert">
                <mat-icon>download</mat-icon> DESCARGAR ANEXO 7 (CONSTANCIA)
              </button>
              
              <button mat-flat-button class="btn-finalize" 
                      [disabled]="!allReviewed() || isProcessing || isFinalized()" 
                      (click)="onFinalize()">
                <mat-icon>{{ progress() === 100 ? 'send' : 'notifications_active' }}</mat-icon>
                {{ isFinalized() 
                    ? 'REVISIÓN FINALIZADA' 
                    : (progress() === 100 ? 'FINALIZAR REVISIÓN Y GENERAR CONSTANCIA' : 'NOTIFICAR OBSERVACIONES AL INVESTIGADOR') }}
              </button>
            </div>
            
            <div class="legal-disclaimer" *ngIf="allReviewed() && !isFinalized()">
               <mat-icon [color]="progress() === 100 ? 'primary' : 'warn'">info</mat-icon>
               <span *ngIf="progress() === 100">Todo correcto. Se generará el Anexo 7 y se notificará al investigador.</span>
               <span *ngIf="progress() < 100">Existen rechazos. Se enviará una notificación de subsanación con las observaciones ingresadas.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .validation-wrapper { padding: 1.5rem; max-width: 1250px; margin: 0 auto; min-height: 80vh; }
    .validation-wrapper.in-workspace { padding: 0; max-width: 100%; min-height: auto; }
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #64748b; }
    .error-state { text-align: center; padding: 4rem; color: #64748b; mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; } }

    .official-header {
      background: white; border: 2px solid #000; padding: 1.5rem; border-radius: 4px;
      .top-row { display: flex; align-items: flex-start; gap: 1rem; border-bottom: 1px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; }
      .header-text { flex: 1; text-align: center; 
        .institution { font-weight: 800; font-size: 1.1rem; display: block; color: #000; }
        h1 { font-size: 1.2rem; font-weight: 900; color: #003366; margin: 0.5rem 0; }
        .subtitle { font-size: 0.85rem; font-weight: 600; color: #000; margin: 0; }
      }
    }

    .protocol-info-grid {
      display: grid; grid-template-columns: 250px 1fr; gap: 0; border: 1px solid #000;
      .info-item { padding: 0.75rem; border-right: 1px solid #000; border-bottom: 1px solid #000; display: flex; flex-direction: column;
        &.full { grid-column: 1 / -1; border-right: none; }
        &:last-child { border-bottom: none; }
        .label { font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 4px; }
        .value { font-weight: 700; color: #1e293b; &.code { color: #003366; font-size: 1.1rem; } &.title { font-style: italic; } }
      }
    }

    .checklist-title { background: #003366; color: white; padding: 10px; font-size: 0.9rem; font-weight: 700; margin: 0; text-align: center; }

    .excel-table {
      width: 100%; border-collapse: collapse; border: 1px solid #000; background: white;
      th { background: #d1d5db; color: #000; border: 1px solid #000; padding: 10px; font-size: 0.75rem; text-transform: uppercase; }
      td { border: 1px solid #000; padding: 8px; font-size: 0.85rem; vertical-align: middle; }
      .req-label { 
        .req-id { font-weight: 900; color: #003366; margin-bottom: 2px; } 
        .req-name { font-weight: 500; color: #334155; }
        .item-status-tag { 
          font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; text-transform: uppercase;
          &.presentado { background: #e0f2fe; color: #0369a1; }
          &.no_presentado { background: #f1f5f9; color: #64748b; }
          &.aprobado, &.validado { background: #dcfce7; color: #166534; }
          &.rechazado { background: #fee2e2; color: #991b1b; }
        }
      }
      .text-center { text-align: center; }
      .mini-input { width: 100%; border: 1px solid #cbd5e1; padding: 6px; border-radius: 4px; font-size: 0.8rem; }
      .btn-group-validation { display: flex; justify-content: center; gap: 4px; }
      .row-validated { background-color: #f0fdf4; }
      .row-rejected { background-color: #fef2f2; }
    }

    .verification-panel { background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; color: #003366; margin-bottom: 1rem; }

    .badge-status { padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      &.en_revision_secretaria { background: #fef3c7; color: #92400e; }
      &.completo { background: #dcfce7; color: #166534; }
      &.incompleto { background: #fee2e2; color: #991b1b; }
    }

    .action-footer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px; }
    .summary-panel { display: flex; flex-direction: column; gap: 1.5rem; &.full-width { width: 100%; } }
    .progress-labels { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
    
    .action-buttons-row { display: flex; justify-content: flex-end; gap: 1rem;
      .btn-cert { height: 52px; font-weight: 700; border-radius: 8px; border: 2px solid #059669; color: #059669; }
      .btn-finalize { height: 52px; font-weight: 700; border-radius: 8px; background: #003366 !important; color: white !important; min-width: 300px; }
    }

    .legal-disclaimer { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #64748b; padding: 10px; background: #f1f5f9; border-radius: 8px; 
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .full-width { width: 100%; }
    .empty-docs-warning { mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 10px; } }
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
  
  // Workspace integration
  private workspaceService = inject(ProtocolWorkspaceService, { optional: true });
  isInsideWorkspace = signal(!!this.workspaceService);

  isLoading = signal(true);
  protocolNotFound = signal(false);
  isProcessing = false;
  protocolId = '';

  header = signal<ValidationHeader | null>(null);
  checklist = signal<ValidationChecklistItem[]>([]);
  globalStatus = signal<ValidationGlobalStatus | null>(null);

  // Verificación Global local (para observaciones)
  missingItemsList = '';

  checklistLength = computed(() => this.checklist().length);

  mandatoryCount = computed(() => this.checklist().length);

  validatedCount = computed(() => {
    return this.checklist().filter(i => i.status === 'APROBADO' || i.status === 'VALIDADO').length;
  });

  progress = computed(() => {
    const total = this.mandatoryCount();
    if (total === 0) return 100;
    return Math.round((this.validatedCount() / total) * 100);
  });

  allReviewed = computed(() => {
    const items = this.checklist();
    if (items.length === 0) return false;
    // Un ítem está revisado si no tiene documento adjunto (no requiere validación),
    // o si teniéndolo ya ha sido APROBADO, VALIDADO o RECHAZADO
    return items.every(i => !i.attachedDocument || i.status === 'APROBADO' || i.status === 'VALIDADO' || i.status === 'RECHAZADO');
  });

  isFinalized = computed(() => {
    // Está finalizado solo si el progreso es 100% (todo aprobado) Y además ya existe un código generado
    return this.progress() === 100 && !!this.header()?.ceishCode && this.header()?.ceishCode !== 'TRÁMITE EN PROCESO';
  });

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'] || this.route.parent?.snapshot.params['id'];
    this.loadValidationData();
  }

  loadValidationData() {
    this.isLoading.set(true);
    this.repository.getValidationDetail(this.protocolId).pipe(
      catchError(err => {
        console.error('[ProtocolValidationDetailPage] Error al cargar detalle:', err);
        this.protocolNotFound.set(true);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        console.log('[ProtocolValidationDetailPage] Detalle cargado:', data);
        
        this.header.set(data.header);
        this.checklist.set(data.checklist || []);
        this.globalStatus.set(data.globalStatus);
        
        if (data.globalStatus) {
          this.missingItemsList = data.globalStatus.missingItemsList || '';
        }
      } else {
        this.protocolNotFound.set(true);
      }
      this.isLoading.set(false);
    });
  }

  onValidateItem(item: ValidationChecklistItem, actionType: number) {
    if (!item.attachedDocument) return;

    if (actionType === 2 && (!item.observations || item.observations.trim().length < 5)) {
      this.snackBar.open('⚠️ Por favor ingrese un motivo de rechazo técnico (mín. 5 carácteres).', 'Cerrar');
      return;
    }

    this.isProcessing = true;
    this.docRepository.validateDocument(item.attachedDocument.id.toString(), actionType, item.observations || '').subscribe({
      next: () => {
        // Actualizar la señal checklist con una nueva referencia para activar la reactividad de Angular
        this.checklist.update(list => list.map(i => {
          if (i.id === item.id) {
            return { ...i, status: actionType === 1 ? 'APROBADO' : 'RECHAZADO' };
          }
          return i;
        }));
        
        this.isProcessing = false;
        const msg = actionType === 1 ? 'Ítem aprobado' : 'Ítem rechazado';
        this.snackBar.open(`✅ ${msg}`, 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al procesar la validación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onFinalize() {
    if (!this.allReviewed()) {
      this.snackBar.open('❌ Error: Existen documentos pendientes de revisión.', 'Cerrar');
      return;
    }

    this.isProcessing = true;
    const isComplete = this.progress() === 100;

    // Guardar automáticamente observaciones en la base de datos antes de finalizar
    this.repository.verifyProtocol(this.protocolId, isComplete, this.missingItemsList).subscribe({
      next: () => {
        // Continuar con la finalización del trámite
        this.validateUseCase.execute(this.protocolId).subscribe({
          next: (res) => {
            this.isProcessing = false;
            const code = res.ceishCode || res.code || 'GENERADO';
            
            const dialogRef = this.dialog.open(ReceptionSuccessDialog, {
              width: '500px',
              disableClose: true,
              data: { code: code }
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result === 'download') {
                this.onDownloadCertificate();
              }
              this.router.navigate(['/dashboard/protocols/validation/list']);
            });
          },
          error: (err) => {
            this.isProcessing = false;
            if (err.status === 400 && err.error?.missingDocuments) {
              this.dialog.open(IncompleteValidationDialog, {
                width: '500px',
                data: { missingDocuments: err.error.missingDocuments, deadline: err.error.deadline }
              });
            } else {
              const msg = err.error?.message || 'Error al finalizar la recepción';
              this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
            }
          }
        });
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al guardar las observaciones generales.', 'Cerrar');
      }
    });
  }

  onDownloadCertificate() {
    const code = this.header()?.ceishCode || 'CONSTANCIA';
    this.repository.getCertificate(this.protocolId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Anexo_7_Constancia_${code}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('❌ Error al descargar la constancia.', 'Cerrar');
      }
    });
  }
}
