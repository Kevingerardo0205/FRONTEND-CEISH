import { Component, Inject, OnInit, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { PeerAssignmentEntity, PET_RISK_LEVELS, RiskLevelInfo } from '@domain/entities/peer-evaluation.entity';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError, filter } from 'rxjs/operators';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

@Component({
  selector: 'app-peer-risk-assessment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    FileUploaderComponent,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="assessment-wrapper">
      <!-- Header -->
      <header class="modal-header">
        <div class="brand">
          <div class="icon-box">
            <mat-icon>security</mat-icon>
          </div>
          <div class="title-meta">
            <h2>Estratificación de Nivel de Riesgo</h2>
            <span class="version">Manual PET 4.2.1</span>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div mat-dialog-content class="modal-body custom-scrollbar">
        <!-- Workflow Timeline -->
        <div class="workflow-timeline mb-4">
          <div class="timeline-step completed">
            <div class="step-circle">
              <mat-icon>check</mat-icon>
            </div>
            <span class="step-label">Recepción</span>
          </div>
          <div class="timeline-line completed"></div>
          
          <div class="timeline-step completed">
            <div class="step-circle">
              <mat-icon>check</mat-icon>
            </div>
            <span class="step-label">Validación</span>
          </div>
          <div class="timeline-line completed"></div>
          
          <div class="timeline-step active">
            <div class="step-circle">
              <mat-icon>security</mat-icon>
            </div>
            <span class="step-label">Evaluación de Riesgo</span>
          </div>
          <div class="timeline-line"></div>
          
          <div class="timeline-step pending">
            <div class="step-circle">
              <mat-icon>gavel</mat-icon>
            </div>
            <span class="step-label">Resolución</span>
          </div>
        </div>

        <!-- Protocol Info Card -->
        <section class="protocol-summary shadow-sm mb-4">
          <div class="protocol-header">
            <span class="ceish-badge">{{ assignment.protocol.ceishCode || 'SIN CÓDIGO' }}</span>
            <h3 class="protocol-title">{{ assignment.protocol.title }}</h3>
          </div>
          
          <div class="metadata-grid">
            <div class="meta-item">
              <span class="label">Investigador</span>
              <span class="value">{{ getInvestigatorName() }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Tipo de Estudio</span>
              <span class="value">{{ getStudyType() }}</span>
            </div>
          </div>
        </section>

        <!-- Protocol Documents Section -->
        <section class="protocol-docs shadow-sm mb-4" *ngIf="protocolDocuments().length > 0">
          <div class="section-title-wrapper">
            <mat-icon>folder_open</mat-icon>
            <h4>Expediente del Protocolo para Evaluar</h4>
          </div>
          <div class="docs-grid">
            <div class="doc-item" *ngFor="let doc of protocolDocuments()">
              <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
              <div class="doc-info">
                <span class="doc-name" [matTooltip]="doc.name || doc.title">{{ doc.name || doc.title }}</span>
                <span class="doc-type">{{ doc.type || 'Documento de recepción' }}</span>
              </div>
              <button type="button" (click)="verDocumento(doc.id)" class="view-doc-btn" mat-icon-button color="primary" matTooltip="Abrir documento">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
          </div>
        </section>

        <form [formGroup]="assessmentForm" class="assessment-form">
          <!-- Step 1: Risk Level -->
          <div class="form-section">
            <div class="section-header">
              <span class="step-number">1</span>
              <div>
                <h4>Nivel de Riesgo Oficial</h4>
                <p class="helper">Consulte los criterios del manual PET 4.2.1 al seleccionar.</p>
              </div>
            </div>
            
            <mat-form-field appearance="outline" class="w-full dense-field">
              <mat-label>Seleccione el nivel</mat-label>
              <mat-select formControlName="riskLevelId">
                @for (risk of riskLevels; track risk.id) {
                  <mat-option [value]="risk.id" [matTooltip]="risk.description" matTooltipPosition="right">
                    {{ risk.name }}
                  </mat-option>
                }
              </mat-select>
              <mat-error *ngIf="assessmentForm.get('riskLevelId')?.hasError('required')">
                El nivel de riesgo es obligatorio.
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Step 2: Justification -->
          <div class="form-section">
            <div class="section-header">
              <span class="step-number">2</span>
              <div>
                <h4>Justificación Técnica Ética</h4>
                <p class="helper">Fundamente de manera técnica y metodológica la atribución de este riesgo.</p>
              </div>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Observaciones y Justificación</mat-label>
              <textarea 
                matInput 
                formControlName="observations" 
                rows="4"
                placeholder="Ej: El estudio utiliza encuestas anónimas sobre hábitos alimenticios cotidianos..."></textarea>
              <mat-hint align="end">{{ assessmentForm.get('observations')?.value?.length || 0 }} / 30 min</mat-hint>
              <mat-error *ngIf="assessmentForm.get('observations')?.hasError('required')">
                La justificación es obligatoria.
              </mat-error>
              <mat-error *ngIf="assessmentForm.get('observations')?.hasError('minlength')">
                Mínimo 30 caracteres para una justificación válida.
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Documentation Section -->
          <div class="form-section no-border">
            <div class="section-header">
              <mat-icon class="section-icon text-error">upload_file</mat-icon>
              <div>
                <h4>Documentación de Respaldo</h4>
                <p class="helper">El informe firmado (PDF) es <strong>obligatorio</strong>.</p>
              </div>
            </div>

            <div class="upload-container" [class.has-files]="selectedFiles().length > 0">
              <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
              
              @if (selectedFiles().length > 0) {
                <div class="file-summary animate-in">
                  <div class="summary-header">
                    <mat-icon>inventory_2</mat-icon>
                    <span>{{ selectedFiles().length }} archivos listos para subir</span>
                  </div>
                  <ul class="file-mini-list">
                    @for (file of selectedFiles(); track file.name) {
                      <li>
                        <mat-icon>check_circle</mat-icon>
                        <span class="name">{{ file.name }}</span>
                        <span class="size">({{ (file.size / 1024 / 1024) | number:'1.1-2' }} MB)</span>
                      </li>
                    }
                  </ul>
                </div>
              } @else {
                <div class="upload-alert">
                  <mat-icon>info</mat-icon>
                  <span>Sin el PDF firmado no podrá enviar el dictamen.</span>
                </div>
              }
            </div>
          </div>
        </form>
      </div>

      <footer mat-dialog-actions class="modal-footer">
        <button mat-button (click)="close()" [disabled]="isSubmitting()">Cancelar</button>
        <button 
          mat-flat-button 
          class="btn-submit"
          [disabled]="assessmentForm.invalid || isSubmitting() || selectedFiles().length === 0"
          (click)="onSubmit()">
          <mat-icon *ngIf="isSubmitting()" class="rotating">sync</mat-icon>
          <mat-icon *ngIf="!isSubmitting()">send</mat-icon>
          <span>{{ isSubmitting() ? 'Procesando...' : 'Enviar Dictamen' }}</span>
        </button>
      </footer>
    </div>
  `,
  styles: `
    :host { display: block; --primary: #003366; --accent: #ea580c; --text-main: #0f172a; --text-muted: #64748b; --border: #e2e8f0; }
    
    .assessment-wrapper { display: flex; flex-direction: column; max-height: 90vh; }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fcfdfe;

      .brand {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .icon-box {
          background: #fff7ed;
          color: var(--accent);
          padding: 0.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          mat-icon { font-size: 24px; width: 24px; height: 24px; }
        }

        .title-meta {
          h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em; }
          .version { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        }
      }
    }

    .modal-body {
      padding: 1.5rem !important;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .protocol-summary {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      
      .protocol-header {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        
        .ceish-badge {
          background: #fff7ed;
          color: var(--accent);
          font-weight: 800;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 6px;
          width: fit-content;
          border: 1px solid #ffedd5;
          letter-spacing: 0.05em;
        }

        .protocol-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main); line-height: 1.5; }
      }

      .metadata-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--border);

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          .label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
          .value { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
        }
      }
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);

      &.no-border { border: none; padding-bottom: 0; }

      .section-header {
        display: flex;
        gap: 1rem;
        align-items: flex-start;

        .step-number {
          background: var(--primary);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .section-icon { font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; }

        h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-main); }
        .helper { margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        .text-error { color: #dc2626; }
      }
    }

    .w-full { width: 100%; }
    .dense-field { ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; } }

    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      &.has-files {
        ::ng-deep .uploader-container { border-color: #86efac; background: #f0fdf4; }
      }
    }

    .upload-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fff7ed;
      color: #9a3412;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid #fed7aa;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .file-summary {
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      border-radius: 12px;
      padding: 1rem;

      .summary-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 800;
        color: #166534;
        margin-bottom: 0.75rem;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }

      .file-mini-list {
        margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.5rem;
        li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #166534;
          font-weight: 600;
          mat-icon { font-size: 16px; width: 16px; height: 16px; color: #22c55e; }
          .name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .size { color: #15803d; opacity: 0.7; font-size: 0.7rem; }
        }
      }
    }

    .modal-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: #fcfdfe;

      button { font-weight: 800; border-radius: 12px; height: 48px; padding: 0 1.5rem; }
      .btn-submit { min-width: 180px; background: var(--primary); }
    }

    .rotating { animation: rotate 1.5s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: #f1f5f9; }
      &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    }

    /* Timeline styles */
    .workflow-timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      
      .timeline-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        position: relative;
        z-index: 1;
        
        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 2px solid #cbd5e1;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          
          mat-icon { font-size: 16px; width: 16px; height: 16px; }
        }
        
        .step-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-align: center;
        }
        
        &.completed {
          .step-circle {
            background: #dcfce7;
            border-color: #22c55e;
            color: #15803d;
          }
          .step-label { color: #15803d; }
        }
        
        &.active {
          .step-circle {
            background: #eff6ff;
            border-color: #3b82f6;
            color: #1d4ed8;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
          }
          .step-label { color: #1d4ed8; }
        }
        
        &.pending {
          .step-circle { background: #f8fafc; border-color: #cbd5e1; color: #94a3b8; }
          .step-label { color: #94a3b8; }
        }
      }
      
      .timeline-line {
        height: 2px;
        background: #e2e8f0;
        flex: 1.5;
        margin-top: -1.2rem;
        
        &.completed {
          background: #22c55e;
        }
      }
    }

    /* Documents styles */
    .protocol-docs {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      
      .section-title-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 1px solid #edf2f7;
        padding-bottom: 0.75rem;
        margin-bottom: 1rem;
        
        mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary); }
        h4 { margin: 0; font-size: 0.9rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
      }
      
      .docs-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }
      
      .doc-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border: 1px solid #edf2f7;
        border-radius: 12px;
        transition: all 0.2s ease;
        
        &:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }
        
        .pdf-icon { font-size: 24px; width: 24px; height: 24px; color: #ef4444; }
        
        .doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          
          .doc-name {
            font-size: 0.8rem;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .doc-type {
            font-size: 0.65rem;
            color: #64748b;
            font-weight: 600;
          }
        }
        
        .view-doc-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }
      }
    }
  `
})
export class PeerRiskAssessmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private docRepo = inject(IDocumentRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private snack = inject(MatSnackBar);
  private s3StorageService = inject(S3StorageService);

  assessmentForm!: FormGroup;
  riskLevels: any[] = PET_RISK_LEVELS; // Default fallback catalog
  isSubmitting = signal<boolean>(false);
  selectedFiles = signal<File[]>([]);
  protocolDocuments = signal<any[]>([]);
  
  assignment!: PeerAssignmentEntity;

  constructor(
    public dialogRef: MatDialogRef<PeerRiskAssessmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assignment: PeerAssignmentEntity }
  ) {
    this.assignment = data.assignment;
  }

  verDocumento(documentId: any) {
    if (!documentId) return;
    this.s3StorageService.getDocumentDownloadUrl(Number(documentId)).subscribe({
      next: (res) => {
        window.open(res.downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Error al generar la URL de descarga:', err);
        this.snack.open('No se pudo abrir el documento.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadProtocolDocuments();
    this.loadRiskLevelsCatalog();
  }

  private loadRiskLevelsCatalog() {
    this.protocolRepo.getRiskLevels().subscribe({
      next: (levels) => {
        if (levels && levels.length > 0) {
          this.riskLevels = levels;
        }
      },
      error: (err) => {
        console.warn('[PeerRiskAssessmentForm] Error al cargar catálogo dinámico de niveles de riesgo, usando fallback:', err);
      }
    });
  }

  private loadProtocolDocuments() {
    const protocolId = this.assignment.protocolId || (this.assignment.protocol as any)?.id;
    if (protocolId) {
      this.protocolRepo.getDocumentHistory(protocolId.toString()).subscribe({
        next: (docs) => {
          this.protocolDocuments.set(docs || []);
        },
        error: (err) => {
          console.error('[PeerRiskAssessmentForm] Error cargando documentos:', err);
        }
      });
    }
  }

  private initForm() {
    this.assessmentForm = this.fb.group({
      riskLevelId: [this.assignment.proposedRiskLevelId || '', Validators.required],
      observations: [this.assignment.observations || '', [Validators.required, Validators.minLength(30)]]
    });
  }

  onFileUpload(files: File[]) {
    if (files.length > 0) {
      this.selectedFiles.set([files[0]]);
    }
  }

  getInvestigatorName(): string {
    const p = this.assignment?.protocol as any;
    return p?.principalInvestigatorRecord?.fullName || p?.investigator?.fullName || 'No especificado';
  }

  getStudyType(): string {
    const p = this.assignment?.protocol as any;
    return p?.studyType?.nombre || p?.studyType?.name || 'No especificado';
  }

  close() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    if (this.assessmentForm.invalid || this.selectedFiles().length === 0) return;

    this.isSubmitting.set(true);
    const file = this.selectedFiles()[0];
    const sanitizedName = file.name.replace(/\s+/g, '_');
    const protocolId = this.assignment.protocolId || (this.assignment.protocol as any)?.id;
    const s3Key = `protocols/${protocolId}/docEvaluacion/${sanitizedName}`;

    this.s3StorageService.getUploadUrl(s3Key, file.type || 'application/pdf').pipe(
      switchMap(urlRes => 
        this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
          filter(uploadRes => uploadRes.success),
          map(() => urlRes.key)
        )
      ),
      switchMap(filePath => {
        const payload = {
          riskLevelId: Number(this.assessmentForm.value.riskLevelId),
          observations: this.assessmentForm.value.observations,
          reportPath: filePath
        };

        return this.evaluationRepo.submitPeerRiskProposed(this.assignment.id.toString(), payload);
      })
    ).subscribe({
      next: () => {
        this.snack.open('Dictamen de riesgo enviado exitosamente.', 'Éxito', { duration: 3000 });
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error enviando dictamen:', err);
        const msg = err.message || 'Error crítico al procesar la solicitud.';
        this.snack.open(msg, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }
}
