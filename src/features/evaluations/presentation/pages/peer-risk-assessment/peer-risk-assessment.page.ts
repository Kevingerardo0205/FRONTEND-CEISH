import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { PeerAssignmentEntity, PET_RISK_LEVELS, RiskLevelInfo } from '@domain/entities/peer-evaluation.entity';
import { switchMap, map, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { sanitizeFilename } from '@domain/entities/storage.interface';

@Component({
  selector: 'app-peer-risk-assessment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    FileUploaderComponent,
    ProtocolCodePipe
  ],
  template: `
    <div class="evaluation-container animate-fade-in" [class.side-by-side]="showPreview()">
      
      <!-- Top Sticky Header -->
      <div class="sticky-header shadow-soft">
        <div class="header-content container-fluid">
          <div class="d-flex align-items-center gap-3">
            <button mat-icon-button routerLink="/dashboard/evaluations/list" class="back-btn" [disabled]="isSubmitting()" aria-label="Volver a la bandeja de evaluaciones">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="protocol-meta">
              <span class="code">{{ assignment()?.protocol?.ceishCode | protocolCode }}</span>
              <h2 class="title">{{ assignment()?.protocol?.title }}</h2>
              <span class="badge-anexo">Estratificación de Nivel de Riesgo (PET 4.2.1)</span>
            </div>
          </div>
        </div>
        <mat-progress-bar [mode]="isSubmitting() ? 'indeterminate' : 'determinate'" [value]="progressValue()"></mat-progress-bar>
      </div>

      <div class="main-layout">
        <!-- Formulario de Riesgo -->
        <div class="form-body container py-4">
          
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
              <span class="step-label">Estratificación de Riesgo</span>
            </div>
            <div class="timeline-line"></div>
            
            <div class="timeline-step pending">
              <div class="step-circle">
                <mat-icon>rate_review</mat-icon>
              </div>
              <span class="step-label">Dictamen Ético</span>
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
          <div class="step-card glass-card mb-4">
            <h3 class="field-title mb-3" style="font-size: 0.90rem; font-weight: 800; color: #1e293b;">Resumen del Trámite</h3>
            <div class="metadata-grid">
              <div class="meta-item">
                <span class="label">Investigador Principal</span>
                <span class="value">{{ getInvestigatorName() }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Tipo de Estudio</span>
                <span class="value">{{ getStudyType() }}</span>
              </div>
            </div>
          </div>

          <!-- Form Panel -->
          <form [formGroup]="assessmentForm" class="step-card glass-card">
            <div class="form-section mb-4">
              <h3 class="field-title">1. Selección del Nivel de Riesgo Oficial</h3>
              <p class="helper-text mb-3">Establezca el riesgo de acuerdo con la clasificación del manual PET 4.2.1.</p>
              
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Nivel de Riesgo</mat-label>
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

            <div class="form-section mb-4">
              <h3 class="field-title">2. Justificación Técnica y Metodológica</h3>
              <p class="helper-text mb-3">Detalle el sustento de la selección del nivel de riesgo. Mínimo 30 caracteres.</p>
              
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Observaciones / Fundamento</mat-label>
                <textarea matInput formControlName="observations" rows="5" placeholder="Fundamente aquí de manera técnica..."></textarea>
                <mat-hint align="end">{{ assessmentForm.get('observations')?.value?.length || 0 }} caracteres</mat-hint>
                <mat-error *ngIf="assessmentForm.get('observations')?.hasError('required')">
                  La justificación es obligatoria.
                </mat-error>
                <mat-error *ngIf="assessmentForm.get('observations')?.hasError('minlength')">
                  La justificación debe tener al menos 30 caracteres.
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-section mb-4">
              <h3 class="field-title">3. Documento de Respaldo Firmado</h3>
              <p class="helper-text mb-3">Adjunte obligatoriamente el informe de evaluación de riesgo firmado en formato PDF.</p>
              
              <div class="upload-container text-center p-4 rounded-4"
                   [class.upload-pending]="selectedFiles().length === 0"
                   [class.upload-done]="selectedFiles().length > 0">
                <mat-icon class="upload-icon" [style.color]="selectedFiles().length > 0 ? '#16a34a' : '#003366'">
                  {{ selectedFiles().length > 0 ? 'task_alt' : 'upload_file' }}
                </mat-icon>
                <h4 class="fw-bold mt-3 mb-1">Informe Firmado</h4>
                <p class="upload-hint mb-4">Solo archivos PDF &middot; Máx 10MB</p>
                
                <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>

                <div class="file-status-chip mt-3 mx-auto" *ngIf="selectedFiles().length > 0">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ selectedFiles()[0].name }} — {{ (selectedFiles()[0].size/1024/1024).toFixed(2) }} MB</span>
                </div>
              </div>
            </div>

            <div class="final-actions mt-5 pt-4 border-top">
              <button mat-button routerLink="/dashboard/evaluations/list" [disabled]="isSubmitting()" aria-label="Cancelar evaluación de riesgo">CANCELAR</button>
              <button mat-flat-button class="submit-btn" 
                      [disabled]="assessmentForm.invalid || isSubmitting() || selectedFiles().length === 0"
                      (click)="onSubmit()"
                      aria-label="Enviar evaluación de riesgo oficial">
                <mat-icon *ngIf="!isSubmitting()">send</mat-icon>
                <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
                <span>{{ isSubmitting() ? 'ENVIANDO...' : 'ENVIAR EVALUACIÓN DE RIESGO' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Sidebar Documentos -->
        <aside class="preview-panel" *ngIf="showPreview()">
          <div class="panel-header">
            <h3>Expediente del Protocolo</h3>
            <p class="small text-muted">Consulte los documentos cargados por el investigador</p>
          </div>
          <div class="panel-content">
            <div class="doc-list">
              <div class="doc-item" *ngFor="let d of protocolDocuments()">
                <mat-icon>picture_as_pdf</mat-icon>
                <div class="d-info">
                  <span class="n text-truncate">{{ d.name || d.title }}</span>
                  <span class="t">{{ d.type || 'Documento de recepción' }}</span>
                </div>
                <button type="button" (click)="verDocumento(d.id)" mat-icon-button color="primary" aria-label="Abrir archivo en una nueva ventana">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </div>
            </div>
            <div class="empty-state py-5 text-center text-muted" *ngIf="protocolDocuments().length === 0">
              <mat-icon style="font-size: 32px; height: 32px; width: 32px; opacity: 0.5;">find_in_page</mat-icon>
              <p class="small mt-2 mb-0">No se encontraron documentos en este expediente.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-container { background: #f8fafc; min-height: 100vh; }
    .sticky-header { position: sticky; top: 0; z-index: 1000; background: #ffffff; border-bottom: 1px solid #e2e8f0; 
      .header-content { padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    }
    .protocol-meta { display: flex; flex-direction: column; .code { font-weight: 800; color: #003366; font-size: 0.7rem; } 
      .title { font-size: 1rem; font-weight: 700; margin: 0; color: #1e293b; max-width: 600px; }
      .badge-anexo { font-size: 0.65rem; color: #ea580c; font-weight: 800; text-transform: uppercase; margin-top: 4px; }
    }
    .main-layout { display: flex; }
    .form-body { flex: 1; max-width: 1000px; }
    .preview-panel { width: 400px; background: #ffffff; border-left: 1px solid #e2e8f0; height: calc(100vh - 90px); position: sticky; top: 90px; padding: 1.5rem; overflow-y: auto; }
    
    .step-card {
      padding: 2.5rem;
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      background: #ffffff;
      box-shadow: 0 10px 35px -5px rgba(0, 51, 102, 0.03);
    }
    
    .field-title { font-size: 0.9rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
    .helper-text { font-size: 0.8rem; color: #64748b; font-weight: 500; }
    .upload-hint { font-size: 0.75rem; color: #64748b; font-weight: 600; }

    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        .label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        .value { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
      }
    }

    .upload-container {
      border: 2px dashed;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.upload-pending {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      &.upload-done {
        border-color: #86efac;
        background: #f0fdf4;
      }
      
      .upload-icon { font-size: 48px; width: 48px; height: 48px; }
    }

    .file-status-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0fdf4;
      color: #166534;
      padding: 8px 14px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      width: fit-content;
      border: 1px solid #bbf7d0;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .final-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      button { font-weight: 800; border-radius: 12px; height: 48px; padding: 0 1.5rem; }
      button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    }

    .submit-btn {
      background: #003366 !important;
      color: #ffffff !important;
      font-weight: 800;
      height: 56px;
      border-radius: 14px;
      padding: 0 2.5rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
      }

      &:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid #edf2f7;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        background: #ffffff;
      }
      
      .d-info { flex: 1; display: flex; flex-direction: column; .n { font-size: 0.8rem; font-weight: 700; color: #1e293b; } .t { font-size: 0.65rem; color: #94a3b8; font-weight: 600; } }
    }

    /* Timeline styles */
    .workflow-timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 1.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.02);
      
      .timeline-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        position: relative;
        z-index: 1;
        
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #cbd5e1;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          
          mat-icon { font-size: 18px; width: 18px; height: 18px; }
        }
        
        .step-label {
          font-size: 0.75rem;
          font-weight: 800;
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
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.35);
          }
          .step-label { color: #1d4ed8; }
        }
        
        &.pending {
          .step-circle { background: #f8fafc; border-color: #cbd5e1; color: #94a3b8; }
          .step-label { color: #94a3b8; }
        }
      }
      
      .timeline-line {
        height: 3px;
        background: #e2e8f0;
        flex: 1.5;
        margin-top: -1.4rem;
        
        &.completed {
          background: #22c55e;
        }
      }
    }
  `]
})
export class PeerRiskAssessmentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private destroyRef = inject(DestroyRef);
  private s3StorageService = inject(S3StorageService);

  assignmentId = '';
  assignment = signal<PeerAssignmentEntity | null>(null);
  protocolDocuments = signal<any[]>([]);
  
  showPreview = signal(true);
  isSubmitting = signal(false);
  progressValue = signal(20);
  
  assessmentForm!: FormGroup;
  riskLevels: any[] = PET_RISK_LEVELS; // Default fallback catalog
  selectedFiles = signal<File[]>([]);

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
    this.assignmentId = this.route.snapshot.params['id'];
    this.initForm();
    this.loadData();
    this.loadRiskLevelsCatalog();
  }

  private loadRiskLevelsCatalog() {
    this.protocolRepo.getRiskLevels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (levels) => {
          if (levels && levels.length > 0) {
            this.riskLevels = levels;
          }
        },
        error: (err) => {
          console.warn('[PeerRiskAssessmentPage] Error al cargar catálogo dinámico de niveles de riesgo, usando fallback:', err);
        }
      });
  }

  private initForm() {
    this.assessmentForm = this.fb.group({
      riskLevelId: ['', Validators.required],
      observations: ['', [Validators.required, Validators.minLength(30)]]
    });
  }

  private loadData() {
    this.evaluationRepo.getMyPendingPeerAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => {
          const current = assignments.find(a => a.id.toString() === this.assignmentId);
          if (current) {
            this.assignment.set(current);
            
            if (current.proposedRiskLevelId) {
              this.assessmentForm.get('riskLevelId')?.setValue(current.proposedRiskLevelId);
            }
            if (current.observations) {
              this.assessmentForm.get('observations')?.setValue(current.observations);
            }

            // Cargar expediente de documentos
            const protocolId = current.protocolId || (current.protocol as any)?.id;
            if (protocolId) {
              this.protocolRepo.getDocumentHistory(protocolId.toString())
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: (docs) => {
                    this.protocolDocuments.set(docs || []);
                  },
                  error: (err) => {
                    console.error('[PeerRiskAssessmentPage] Error loading protocol documents:', err);
                  }
                });
            }
          } else {
            this.snack.open('No se encontró la tarea de riesgo asignada.', 'Cerrar');
            this.router.navigate(['/dashboard/evaluations/list']);
          }
        },
        error: (err) => {
          console.error('[PeerRiskAssessmentPage] Error loading assignments:', err);
          this.snack.open('No se pudo cargar la información de la asignación.', 'Cerrar');
        }
      });
  }

  onFileUpload(files: File[]) {
    if (files.length > 0) {
      this.selectedFiles.set([files[0]]);
    }
  }

  getInvestigatorName(): string {
    const p = this.assignment()?.protocol as any;
    return p?.principalInvestigatorRecord?.fullName || p?.investigator?.fullName || 'No especificado';
  }

  getStudyType(): string {
    const p = this.assignment()?.protocol as any;
    return p?.studyType?.nombre || p?.studyType?.name || 'No especificado';
  }

  onSubmit() {
    if (this.assessmentForm.invalid || this.selectedFiles().length === 0) return;

    this.isSubmitting.set(true);
    const file = this.selectedFiles()[0];
    const sanitizedName = sanitizeFilename(file.name);
    const protocolId = this.assignment()?.protocolId || (this.assignment()?.protocol as any)?.id;
    const key = `protocols/${protocolId}/docEvaluacion/${sanitizedName}`;

    this.s3StorageService.getUploadUrl(key, file.type || 'application/pdf').pipe(
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

        return this.evaluationRepo.submitPeerRiskProposed(this.assignmentId, payload);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snack.open('✅ Evaluación de riesgo enviada con éxito.', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
        this.router.navigate(['/dashboard/evaluations/list']);
      },
      error: (err: any) => {
        console.error('[PeerRiskAssessmentPage] Error submitting risk assessment:', err);
        const msg = err.message || err.error?.message || 'Error al enviar la evaluación de riesgo.';
        this.snack.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }
}
