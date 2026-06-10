import { Component, inject, signal, OnInit, ViewChild, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { SubmitEvaluationUseCase } from '../../../application/submit-evaluation.use-case';
import { EvaluationVerdict } from '@domain/entities/evaluation.entity';
import { ANEXOS_EVALUACION, AnexoEvaluacion, getAnexoPorTipo, CampoEvaluacion } from '../../constants/anexos-evaluacion.constants';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { of, Observable } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { sanitizeFilename } from '@domain/entities/storage.interface';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ProtocolCodePipe,
    FileUploaderComponent
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
              <span class="code">{{ protocolInfo()?.code | protocolCode }}</span>
              <h2 class="title">{{ protocolInfo()?.title }}</h2>
              <span class="badge-anexo">{{ currentAnexo()?.anexo }}: {{ currentAnexo()?.titulo }}</span>
            </div>
          </div>
        </div>
        <mat-progress-bar [mode]="isSubmitting() ? 'indeterminate' : 'determinate'" [value]="progressValue()"></mat-progress-bar>
      </div>

      <div class="main-layout">
        <!-- Formulario Dinámico PET -->
        <div class="form-body container py-4" *ngIf="!isSuspended()">
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
            
            <div class="timeline-step completed">
              <div class="step-circle">
                <mat-icon>check</mat-icon>
              </div>
              <span class="step-label">Estratificación de Riesgo</span>
            </div>
            <div class="timeline-line completed"></div>
            
            <div class="timeline-step active">
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
          <mat-stepper [linear]="true" #stepper class="custom-stepper" (selectionChange)="onStepChange($event)">
            
            @for (section of sections; track section) {
              <mat-step [stepControl]="getStepForm(section)">
                <ng-template matStepLabel>{{ sectionLabel(section) }}</ng-template>
                
                <div class="step-card glass-card">
                  <div class="section-instruction mb-4">
                    <mat-icon color="primary">info</mat-icon>
                    <span>Complete la evaluación de esta sección según los criterios técnicos del PET.</span>
                  </div>

                  <div class="fields-list">
                    @for (campo of getCamposPorSeccion(section); track campo.id) {
                      <div class="field-item mb-4">
                        <h3 class="field-title">{{ campo.label }}</h3>
                        
                        @if (campo.tipo === 'result_triple') {
                          <div class="triple-result-group">
                            <button type="button" class="res-btn" 
                                    [class.active]="getControl(campo.id).value === 'APROBADO'"
                                    (click)="setResult(campo.id, 'APROBADO')">APROBADO</button>
                            
                            <button type="button" class="res-btn conditional" 
                                    [class.active]="isConditional(getControl(campo.id).value)"
                                    (click)="setResult(campo.id, 'CON_OBSERVACIONES')">
                                    {{ currentAnexo()?.id === 'anexo10' ? 'CONDICIONADO' : 'CON OBSERVACIONES' }}
                            </button>

                            <button type="button" class="res-btn negative" 
                                    [class.active]="getControl(campo.id).value === 'NO_APROBADO'"
                                    (click)="setResult(campo.id, 'NO_APROBADO')">NO APROBADO</button>
                          </div>
                        }

                        @if (campo.tipo === 'text') {
                          <mat-form-field appearance="outline" class="w-100 mt-2" 
                                          *ngIf="shouldShowTextField(campo.id)">
                            <mat-label>{{ campo.label }}</mat-label>
                            <textarea matInput rows="3" [formControlName]="campo.id" placeholder="Detalle aquí..."></textarea>
                          </mat-form-field>
                        }
                      </div>
                    }
                  </div>

                  <!-- Subida de informe firmado — visible en el último paso de evaluación -->
                  @if ($last) {
                    <div class="section-divider my-4"></div>
                    <div class="inline-upload-section">
                      <div class="inline-upload-header">
                        <mat-icon class="upload-header-icon">upload_file</mat-icon>
                        <div>
                          <h3 class="inline-upload-title">
                            Informe de Evaluación Firmado
                            <span class="required-badge">*</span>
                          </h3>
                          <p class="inline-upload-subtitle">Adjunte el informe en PDF con su firma antes de continuar. Es obligatorio para enviar el dictamen.</p>
                        </div>
                      </div>

                      <div class="inline-upload-body"
                           [class.upload-pending]="!selectedFile"
                           [class.upload-done]="!!selectedFile">
                        <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>

                        <div class="file-status-chip mt-3" *ngIf="selectedFile">
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ selectedFile!.name }} — {{ (selectedFile!.size/1024/1024).toFixed(2) }} MB</span>
                        </div>

                        <div class="file-missing-hint" *ngIf="!selectedFile">
                          <mat-icon>info</mat-icon>
                          <span>Sin el PDF firmado no podrá enviar el dictamen al CEISH.</span>
                        </div>
                      </div>
                    </div>
                  }

                  <div class="step-actions mt-5 d-flex gap-3">
                    <button mat-button matStepperPrevious *ngIf="!$first">ATRÁS</button>
                    <button mat-flat-button color="primary" matStepperNext *ngIf="!$last">CONTINUAR</button>
                    <button mat-flat-button color="primary" matStepperNext *ngIf="$last">REVISAR Y FIRMAR</button>
                  </div>
                </div>
              </mat-step>
            }

            <!-- ÚLTIMO PASO: SUSTENTO Y ENVÍO -->
            <mat-step>
              <ng-template matStepLabel>Firma y Envío</ng-template>
              <div class="step-card glass-card">
                
                <!-- Caja de Observaciones/Sustento Técnico -->
                <div class="observations-section mb-4">
                  <h3 class="field-title" style="font-size: 0.90rem; font-weight: 800; color: #1e293b;">Sustento Técnico / Observaciones Generales</h3>
                  <mat-form-field appearance="outline" class="w-100 mt-2">
                    <mat-label>Observaciones Generales</mat-label>
                    <textarea matInput rows="4" [formControl]="observationsControl" placeholder="Describa de forma resumida el sustento técnico y consideraciones de su dictamen..."></textarea>
                    <mat-hint>Obligatorio para justificar observaciones o rechazo.</mat-hint>
                  </mat-form-field>
                </div>

                <!-- Regla Crítica: Informe Firmado Obligatorio -->
                <div class="alert-box mb-4" *ngIf="!selectedFile">
                  <mat-icon color="warn">warning</mat-icon>
                  <div class="alert-text">
                    <strong>Informe Firmado Obligatorio</strong>
                    <p>Debe adjuntar obligatoriamente el informe de evaluación firmado en formato PDF para finalizar y enviar su dictamen.</p>
                  </div>
                </div>

                <!-- Confirmación cuando ya se subió el PDF -->
                <div class="alert-box success mb-4" *ngIf="selectedFile">
                  <mat-icon>check_circle</mat-icon>
                  <div class="alert-text">
                    <strong>Informe Adjuntado Correctamente</strong>
                    <p>{{ selectedFile!.name }} ({{ (selectedFile!.size/1024/1024).toFixed(2) }} MB) — listo para envío.</p>
                  </div>
                </div>

                <!-- Alerta de Observaciones Obligatorias -->
                <div class="alert-box mb-4" *ngIf="isReportRequired() && !observationsControl.value?.trim()">
                  <mat-icon color="warn">warning</mat-icon>
                  <div class="alert-text">
                    <strong>Justificación y Observaciones Requeridas</strong>
                    <p>Al haber dictaminado resultados negativos o condicionados, debe escribir de forma obligatoria la justificación técnica en el campo de observaciones.</p>
                  </div>
                </div>

                <!-- Área de carga del informe -->
                <div class="upload-section text-center p-4 rounded-4"
                     [class.upload-pending]="!selectedFile"
                     [class.upload-done]="!!selectedFile">
                  <mat-icon class="upload-icon" [style.color]="selectedFile ? '#16a34a' : '#003366'">
                    {{ selectedFile ? 'task_alt' : 'upload_file' }}
                  </mat-icon>
                  <h3 class="fw-bold mt-3 mb-1">
                    Informe de Evaluación Firmado
                    <span class="required-badge">*</span>
                  </h3>
                  <p class="upload-hint mb-4">Solo archivos PDF &middot; Máx 10MB &middot; <strong>Obligatorio</strong></p>
                  
                  <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
                </div>

                <div class="final-actions mt-5 pt-4 border-top">
                  <button mat-button matStepperPrevious [disabled]="isSubmitting()">REVISAR EVALUACIÓN</button>
                  <button mat-flat-button class="submit-btn" 
                          [disabled]="!canSubmit() || isSubmitting()"
                          [matTooltip]="!selectedFile ? 'Debe adjuntar el informe PDF firmado para continuar' : ''"
                          (click)="onSubmit()">
                    <mat-icon *ngIf="!isSubmitting()">send</mat-icon>
                    <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
                    <span>{{ isSubmitting() ? 'ENVIANDO...' : 'ENVIAR EVALUACIÓN AL CEISH' }}</span>
                  </button>
                </div>
              </div>
            </mat-step>

            </mat-stepper>
        </div>

        <!-- Banner de Suspensión -->
        <div class="suspension-container container py-5" *ngIf="isSuspended()">
          <div class="suspension-card glass-card text-center py-5 px-4 shadow-soft">
            <mat-icon class="suspension-icon">lock_clock</mat-icon>
            <h2 class="fw-bold mt-4 mb-2">Evaluación Ética Suspendida</h2>
            <p class="text-muted mb-4">La evaluación ética de este protocolo está suspendida temporalmente hasta que los pares evaluadores consoliden el nivel de riesgo.</p>
            <div class="d-inline-flex align-items-center gap-2 alert-info-pill">
              <mat-icon>info</mat-icon>
              <span>Puede revisar toda la documentación del expediente del protocolo en el panel lateral.</span>
            </div>
          </div>
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
                  <span class="t">{{ d.type }}</span>
                </div>
                <button type="button" (click)="verDocumento(d.id)" mat-icon-button color="primary" aria-label="Abrir archivo en una nueva ventana">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-container { background: #f8fafc; min-height: 100vh; }
    .sticky-header { position: sticky; top: 0; z-index: 1000; background: white; border-bottom: 1px solid #e2e8f0; 
      .header-content { padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    }
    .protocol-meta { display: flex; flex-direction: column; .code { font-weight: 800; color: #003366; font-size: 0.7rem; } 
      .title { font-size: 1rem; font-weight: 700; margin: 0; color: #1e293b; max-width: 600px; }
      .badge-anexo { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-top: 4px; }
    }
    .main-layout { display: flex; }
    .form-body { flex: 1; max-width: 1000px; }
    .preview-panel { width: 400px; background: white; border-left: 1px solid #e2e8f0; height: calc(100vh - 90px); position: sticky; top: 90px; padding: 1.5rem; overflow-y: auto; }
    
    .step-card {
      padding: 2.5rem;
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      background: white;
      box-shadow: 0 10px 35px -5px rgba(0, 51, 102, 0.03);
    }
    
    .section-instruction { display: flex; align-items: center; gap: 10px; background: #f0f7ff; color: #003366; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    
    .field-title { font-size: 0.9rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem; }
    
    .triple-result-group { display: flex; gap: 10px; }
    
    .res-btn {
      flex: 1;
      height: 48px;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      background: white;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      color: #64748b;
      
      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #334155;
      }
      
      &.active {
        background: #10b981;
        color: white;
        border-color: #10b981;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      }
      
      &.conditional.active {
        background: #f59e0b;
        border-color: #f59e0b;
        color: white;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
      }
      
      &.negative.active {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
      }
    }

    .alert-box { display: flex; gap: 12px; background: #fff1f2; border: 1px solid #fecaca; color: #991b1b; padding: 16px; border-radius: 16px;
      .alert-text { strong { display: block; font-size: 0.9rem; } p { margin: 0; font-size: 0.8rem; } }
      &.success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    }

    .upload-section {
      border: 2px dashed;
      transition: all 0.3s ease;

      &.upload-pending {
        border-color: #e2e8f0;
        background: #f8fafc;
      }

      &.upload-done {
        border-color: #86efac;
        background: #f0fdf4;
      }
    }

    .upload-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      transition: color 0.3s ease;
    }

    .required-badge {
      color: #dc2626;
      font-size: 1rem;
      margin-left: 4px;
    }

    .upload-hint {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .section-divider {
      border: none;
      border-top: 1.5px dashed #e2e8f0;
    }

    .inline-upload-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 1.5rem;
      transition: all 0.3s ease;

      .inline-upload-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 1rem;

        .upload-header-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
          color: #003366;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .inline-upload-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .inline-upload-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
      }

      .inline-upload-body {
        border: 2px dashed;
        border-radius: 14px;
        padding: 1.25rem;
        transition: all 0.3s ease;

        &.upload-pending {
          border-color: #cbd5e1;
          background: white;
        }

        &.upload-done {
          border-color: #86efac;
          background: #f0fdf4;
        }
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
        font-size: 0.82rem;
        width: fit-content;
        border: 1px solid #bbf7d0;

        mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
      }

      .file-missing-hint {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 600;
        margin-top: 8px;

        mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      }
    }

    .submit-btn {
      background: #003366 !important;
      color: white !important;
      font-weight: 800;
      height: 56px;
      border-radius: 14px;
      padding: 0 2.5rem;
      transition: all 0.25s ease;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
      }
    }
    
    .file-ready-chip { display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #166534; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; width: fit-content; margin: 0 auto; }

    .border-dashed { border: 2px dashed #e2e8f0; }
    
    .doc-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid #edf2f7;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        background: white;
      }
      
      .d-info { flex: 1; display: flex; flex-direction: column; .n { font-size: 0.8rem; font-weight: 700; color: #1e293b; } .t { font-size: 0.65rem; color: #94a3b8; font-weight: 600; } }
    }

    .suspension-container { flex: 1; display: flex; align-items: center; justify-content: center; }
    .suspension-card { max-width: 600px; padding: 3rem 2rem; border-radius: 24px; border: 1.5px solid #ffedd5; background: #fffcf9; margin: 3rem auto; }
    .suspension-icon { font-size: 80px; width: 80px; height: 80px; color: #ea580c; line-height: 80px; }
    .alert-info-pill { background: #eff6ff; color: #1d4ed8; padding: 8px 16px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }

    /* Timeline styles */
    .workflow-timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
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
          background: white;
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
export class EvaluationFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private submitEvaluationUC = inject(SubmitEvaluationUseCase);
  private docRepo = inject(IDocumentRepositoryPort);
  private destroyRef = inject(DestroyRef);
  private s3StorageService = inject(S3StorageService);

  @ViewChild('stepper') stepper!: MatStepper;

  evaluationId = '';
  protocolInfo = signal<any>(null);
  currentAnexo = signal<AnexoEvaluacion | null>(null);
  isSuspended = signal<boolean>(false);
  protocolDocuments = signal<any[]>([]);
  
  showPreview = signal(true);
  isSubmitting = signal(false);
  progressValue = signal(10);
  
  evaluationForm: FormGroup = this.fb.group({});
  selectedFile: File | null = null;
  observationsControl = new FormControl('');

  sections: string[] = [];

  ngOnInit() {
    this.evaluationId = this.route.snapshot.params['id'];
    this.loadInitialData();
  }

  loadInitialData() {
    this.evalRepo.getMyAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(assignments => {
        const task = assignments.find(a => a.id === this.evaluationId);
        if (task) {
          this.isSuspended.set(task.isSuspended ?? false);
          this.protocolRepo.getById(task.protocolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(protocol => {
              this.protocolInfo.set(protocol);
              // REGLA: Determinar Anexo basado en reviewType del backend o tipo de protocolo
              const esExpedita = protocol.status === 'EN_REVISION_EXPEDITA' || protocol.type === ProtocolType.IO;
              this.currentAnexo.set(getAnexoPorTipo(protocol.type, esExpedita));
              if (!task.isSuspended) {
                this.initDynamicForm();
              }
            });

          // Cargar historial de documentos para el expediente real
          this.protocolRepo.getDocumentHistory(task.protocolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (docs) => {
                this.protocolDocuments.set(docs || []);
              },
              error: (err) => {
                console.error('[EvaluationFormPage] Error al cargar expediente del protocolo:', err);
              }
            });
        }
      });
  }

  initDynamicForm() {
    const anexo = this.currentAnexo();
    if (!anexo) return;

    // Identificar secciones únicas
    this.sections = [...new Set(anexo.campos.map(c => c.seccion))];
    
    anexo.campos.forEach(campo => {
      const validators = campo.obligatorio ? [Validators.required] : [];
      this.evaluationForm.addControl(campo.id, new FormControl('', validators));
    });

    if (anexo.id === 'anexo11') {
      this.evaluationForm.get('fechaEvaluacion')?.setValue(new Date().toISOString().split('T')[0]);
    }
  }

  sectionLabel(sec: string): string {
    const labels: any = { 'ETICA': 'Ética', 'TECNICA': 'Metodología', 'JURIDICA': 'Jurídica', 'GENERAL': 'Evaluación' };
    return labels[sec] || sec;
  }

  getStepForm(section: string): FormGroup { return this.evaluationForm; }

  getCamposPorSeccion(seccion: string) {
    return this.currentAnexo()?.campos.filter(c => c.seccion === seccion) || [];
  }

  getControl(id: string) { return this.evaluationForm.get(id) as FormControl; }

  setResult(id: string, value: string) {
    this.getControl(id).setValue(value);
    // Auto-limpiar plazo si cambia a Aprobado
    if (value === 'APROBADO') {
      const plazoId = id.replace('resultado', 'plazo');
      if (this.evaluationForm.contains(plazoId)) this.getControl(plazoId).setValue('');
    }
  }

  isConditional(val: string): boolean {
    return val === 'CON_OBSERVACIONES' || val === 'APROBADO_CONDICIONADO';
  }

  shouldShowTextField(id: string): boolean {
    // Si es un campo de texto puro (como descripción de condiciones o plazo)
    const anexo = this.currentAnexo()?.id;
    if (id === 'condiciones') return this.isConditional(this.getControl('resultadoGlobal').value);
    if (id === 'fechaEvaluacion') return true;
    
    // Para Anexo 9: Plazos dinámicos
    if (id.startsWith('plazo')) {
      const resultId = id.replace('plazo', 'resultado');
      return this.getControl(resultId).value === 'CON_OBSERVACIONES';
    }
    return false;
  }

  isReportRequired(): boolean {
    // REGLA CRÍTICA: Si hay algún resultado que NO sea APROBADO, el PDF es obligatorio.
    const values = this.evaluationForm.getRawValue();
    return Object.keys(values).some(key => {
      if (key.startsWith('resultado')) {
        return values[key] !== 'APROBADO' && values[key] !== '';
      }
      return false;
    });
  }

  canSubmit(): boolean {
    if (this.evaluationForm.invalid) return false;
    // El informe PDF es siempre obligatorio para cualquier dictamen
    if (!this.selectedFile) return false;
    
    // Las observaciones escritas solo son obligatorias si hay observaciones o rechazo
    if (this.isReportRequired()) {
      if (!this.observationsControl.value?.trim()) return false;
    }
    return true;
  }

  onFileUpload(files: File[]) { if (files.length > 0) this.selectedFile = files[0]; }

  onStepChange(event: any) {
    const total = this.stepper._steps.length;
    this.progressValue.set(((event.selectedIndex + 1) / total) * 100);
  }

  onSubmit() {
    if (!this.canSubmit()) return;
    this.isSubmitting.set(true);

    const formVal = this.evaluationForm.value;
    const isAnexo9 = this.currentAnexo()?.id === 'anexo9';
    const isAnexo10 = this.currentAnexo()?.id === 'anexo10';
    const isAnexo11 = this.currentAnexo()?.id === 'anexo11';

    const globalResult = this.getGlobalResult();
    const observations = this.observationsControl.value?.trim() || (globalResult === 'APROBADO' ? 'Aprobado sin observaciones' : 'Evaluación con observaciones/condicionada');

    let payload: any = {
      assignmentId: Number(this.evaluationId),
      result: globalResult
    };

    if (isAnexo9) {
      const mapSectionResult = (val: string) => {
        if (val === 'APROBADO') return 'FAVORABLE';
        if (val === 'CON_OBSERVACIONES') return 'FAVORABLE';
        if (val === 'NO_APROBADO') return 'NO_FAVORABLE';
        return 'FAVORABLE';
      };

      payload.annex9 = {
        eticaResult: mapSectionResult(formVal.resultadoEtica),
        eticaPlazo: formVal.plazoEtica || '',
        metodologiaResult: mapSectionResult(formVal.resultadoMetodologia),
        metodologiaPlazo: formVal.plazoMetodologia || '',
        juridicaResult: mapSectionResult(formVal.resultadoJuridica),
        juridicaPlazo: formVal.plazoJuridica || ''
      };
      payload.observations = observations;
    } else if (isAnexo10) {
      payload.annex10 = {
        resultado: globalResult,
        condicionesDescripcion: formVal.condiciones || 'Sin condiciones'
      };
      payload.observations = observations;
    } else if (isAnexo11) {
      payload.annex11 = {
        resultado: globalResult,
        fechaEvaluacion: formVal.fechaEvaluacion || new Date().toISOString().split('T')[0]
      };
    }
    const sanitizedName = this.selectedFile ? sanitizeFilename(this.selectedFile.name) : '';
    const key = `evaluations/${this.evaluationId}/${sanitizedName}`;

    const upload$: Observable<string | null> = this.selectedFile
      ? this.s3StorageService.getUploadUrl(key, this.selectedFile.type || 'application/pdf').pipe(
          switchMap(urlRes => 
            this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, this.selectedFile!).pipe(
              filter(uploadRes => uploadRes.success),
              map(() => urlRes.key)
            )
          )
        )
      : of(null);

    upload$.pipe(
      switchMap(path => {
        if (path) {
          payload.reportPath = path;
        }
        return this.submitEvaluationUC.execute(payload);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open('✅ Evaluación enviada con éxito.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/evaluations/list']);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.snackBar.open(`❌ Error: ${err.message || err.error?.message || 'No se pudo enviar'}`, 'Cerrar');
      }
    });
  }

  verDocumento(documentId: any) {
    if (!documentId) return;
    this.s3StorageService.getDocumentDownloadUrl(Number(documentId)).subscribe({
      next: (res) => {
        window.open(res.downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Error al generar la URL de descarga:', err);
        this.snackBar.open('No se pudo abrir el documento.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private getGlobalResult(): string {
    const values = this.evaluationForm.getRawValue();
    let rawResult = 'APROBADO';
    if (values.resultadoGlobal) {
      rawResult = values.resultadoGlobal;
    } else if (values.resultadoEtica === 'NO_APROBADO' || values.resultadoMetodologia === 'NO_APROBADO' || values.resultadoJuridica === 'NO_APROBADO') {
      rawResult = 'NO_APROBADO';
    } else if (this.isReportRequired()) {
      rawResult = 'CON_OBSERVACIONES';
    }
    
    // Map to backend expected values
    if (rawResult === 'APROBADO') return 'APROBADO';
    if (rawResult === 'CON_OBSERVACIONES' || rawResult === 'APROBADO_CONDICIONADO') return 'APROBADO_CON_OBSERVACIONES';
    if (rawResult === 'NO_APROBADO') return 'RECHAZADO';
    return 'APROBADO';
  }

}
