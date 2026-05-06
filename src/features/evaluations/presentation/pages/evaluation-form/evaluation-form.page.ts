import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { SubmitEvaluationUseCase } from '../../../application/submit-evaluation.use-case';
import { EvaluationVerdict, EvaluationEntity, CriteriaResult } from '@domain/entities/evaluation.entity';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
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
    ProtocolCodePipe,
    FileUploaderComponent
  ],
  template: `
    <div class="evaluation-container animate-fade-in" [class.side-by-side]="showPreview()">
      
      <!-- Top Sticky Header -->
      <div class="sticky-header shadow-soft">
        <div class="header-content container-fluid">
          <div class="d-flex align-items-center gap-3">
            <button mat-icon-button routerLink="/dashboard/evaluations/list" class="back-btn" [disabled]="isSubmitting()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="protocol-meta">
              <span class="code">{{ protocolInfo().code | protocolCode }}</span>
              <h2 class="title">{{ protocolInfo().title }}</h2>
            </div>
          </div>
          <div class="header-actions">
            <div class="preview-toggle-wrapper">
              <mat-slide-toggle [checked]="showPreview()" (change)="showPreview.set($event.checked)" color="primary" [disabled]="isSubmitting()">
                Modo Side-by-Side
              </mat-slide-toggle>
              <mat-icon matTooltip="Ver documentos del protocolo mientras evalúa" class="info-icon">info_outline</mat-icon>
            </div>
            <div class="v-divider"></div>
            <div class="save-status">
              <mat-icon class="saving-icon">sync</mat-icon>
              <span>Borrador protegido</span>
            </div>
            <button mat-stroked-button color="warn" class="exit-btn" routerLink="/dashboard/evaluations/list" [disabled]="isSubmitting()">
              Salir
            </button>
          </div>
        </div>
        <mat-progress-bar [mode]="isSubmitting() ? 'indeterminate' : 'determinate'" [value]="progressValue()"></mat-progress-bar>
      </div>

      <div class="main-layout">
        <!-- Formulario Principal -->
        <div class="form-body container py-4">
          <mat-stepper [linear]="false" orientation="vertical" #stepper class="custom-stepper" (selectionChange)="onStepChange($event)">
            
            <!-- Sección 1: Rigurosidad Técnica -->
            <mat-step [stepControl]="technicalForm">
              <ng-template matStepLabel>
                <div class="step-label">
                  <span class="step-num">01</span>
                  <div class="step-text">
                    <span class="step-title">Rigurosidad Técnica</span>
                    <span class="step-desc">Metodología, diseño y objetivos</span>
                  </div>
                </div>
              </ng-template>
              
              <form [formGroup]="technicalForm" class="step-card glass-card shadow-soft">
                <div class="criteria-grid">
                  <div class="criteria-item" *ngFor="let item of technicalCriteria">
                    <div class="criteria-question">
                      <h3>{{ item.label }}</h3>
                      <p>{{ item.desc }}</p>
                    </div>
                    <div class="selection-box-group">
                      <div class="selection-box" 
                           [class.active]="technicalForm.get(item.key)?.value === 'YES'"
                           (click)="!isSubmitting() && setSelection('technical', item.key, 'YES')">
                        <mat-icon>check_circle</mat-icon>
                        <span>Cumple</span>
                      </div>
                      <div class="selection-box" 
                           [class.active]="technicalForm.get(item.key)?.value === 'NO'"
                           (click)="!isSubmitting() && setSelection('technical', item.key, 'NO')">
                        <mat-icon>cancel</mat-icon>
                        <span>No Cumple</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="observations-area mt-4">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones y Justificación Técnica</mat-label>
                    <textarea matInput formControlName="observations" rows="4"></textarea>
                    <mat-icon matPrefix>edit_note</mat-icon>
                  </mat-form-field>
                </div>

                <div class="step-actions mt-4">
                  <button mat-flat-button color="primary" class="next-btn" matStepperNext [disabled]="isSubmitting()">
                    Continuar a Ética <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Sección 2: Criterios Éticos -->
            <mat-step [stepControl]="ethicalForm">
              <ng-template matStepLabel>
                <div class="step-label">
                  <span class="step-num">02</span>
                  <div class="step-text">
                    <span class="step-title">Criterios Éticos</span>
                    <span class="step-desc">Consentimiento y Bioética</span>
                  </div>
                </div>
              </ng-template>

              <form [formGroup]="ethicalForm" class="step-card glass-card shadow-soft">
                <div class="criteria-grid">
                  <div class="criteria-item" *ngFor="let item of ethicalCriteria">
                    <div class="criteria-question">
                      <h3>{{ item.label }}</h3>
                      <p>{{ item.desc }}</p>
                    </div>
                    <div class="selection-box-group">
                      <div class="selection-box" 
                           [class.active]="ethicalForm.get(item.key)?.value === 'YES'"
                           (click)="!isSubmitting() && setSelection('ethical', item.key, 'YES')">
                        <mat-icon>verified_user</mat-icon>
                        <span>Adecuado</span>
                      </div>
                      <div class="selection-box" 
                           [class.active]="ethicalForm.get(item.key)?.value === 'NO'"
                           (click)="!isSubmitting() && setSelection('ethical', item.key, 'NO')">
                        <mat-icon>report_problem</mat-icon>
                        <span>Inadecuado</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="observations-area mt-4">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Observaciones sobre Bioética y Derechos</mat-label>
                    <textarea matInput formControlName="observations" rows="4"></textarea>
                    <mat-icon matPrefix>gavel</mat-icon>
                  </mat-form-field>
                </div>

                <div class="step-actions mt-4">
                  <button mat-button matStepperPrevious [disabled]="isSubmitting()">Atrás</button>
                  <button mat-flat-button color="primary" class="next-btn" matStepperNext [disabled]="isSubmitting()">
                    Dictamen y Firma <mat-icon>done_all</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Sección 3: Dictamen y Firma -->
            <mat-step>
              <ng-template matStepLabel>
                <div class="step-label">
                  <span class="step-num">03</span>
                  <div class="step-text">
                    <span class="step-title">Dictamen y Firma</span>
                    <span class="step-desc">Firma del acta y envío final</span>
                  </div>
                </div>
              </ng-template>

              <div class="step-card final-card glass-card shadow-soft">
                <h2 class="decision-title">Resolución Sugerida</h2>
                <div class="decision-cards">
                  <div class="decision-card favorable" [class.active]="finalDecision() === 'FAVORABLE'" (click)="!isSubmitting() && finalDecision.set(verdicts.FAVORABLE)">
                    <div class="card-icon"><mat-icon>thumb_up</mat-icon></div>
                    <h3>Favorable</h3>
                  </div>
                  <div class="decision-card observed" [class.active]="finalDecision() === 'OBSERVED'" (click)="!isSubmitting() && finalDecision.set(verdicts.OBSERVED)">
                    <div class="card-icon"><mat-icon>edit_calendar</mat-icon></div>
                    <h3>Observado</h3>
                  </div>
                  <div class="decision-card negative" [class.active]="finalDecision() === 'NEGATIVE'" (click)="!isSubmitting() && finalDecision.set(verdicts.NEGATIVE)">
                    <div class="card-icon"><mat-icon>thumb_down</mat-icon></div>
                    <h3>No Favorable</h3>
                  </div>
                </div>

                <div class="signature-section mt-5">
                  <div class="section-header">
                    <mat-icon>assignment_turned_in</mat-icon>
                    <h3>Carga de Acta Técnica Firmada</h3>
                    <p>Por favor, suba el documento final con su firma electrónica o física escaneada.</p>
                  </div>
                  <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
                  <div class="file-status-chip" *ngIf="isSigned()">
                    <mat-icon>verified</mat-icon>
                    Acta cargada correctamente
                  </div>
                </div>

                <div class="final-actions mt-5">
                  <button mat-button matStepperPrevious [disabled]="isSubmitting()">Revisar</button>
                  <button mat-flat-button class="submit-btn shadow-lg" [disabled]="!canSubmit() || isSubmitting()" (click)="onSubmit()">
                    <ng-container *ngIf="!isSubmitting()">
                      <mat-icon>send</mat-icon>
                      Firmar y Enviar Informe
                    </ng-container>
                    <ng-container *ngIf="isSubmitting()">
                      <mat-spinner diameter="24" color="accent"></mat-spinner>
                      <span>Enviando...</span>
                    </ng-container>
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </div>

        <!-- Panel Lateral de Documentos (Preview) -->
        <aside class="preview-panel animate-slide-left" *ngIf="showPreview()">
          <div class="panel-header">
            <h3>Documentos del Protocolo</h3>
            <button mat-icon-button (click)="showPreview.set(false)"><mat-icon>close</mat-icon></button>
          </div>
          <div class="panel-content">
            <mat-accordion multi>
              <mat-expansion-panel [expanded]="true">
                <mat-expansion-panel-header>
                  <mat-panel-title>Anexos y Formularios</mat-panel-title>
                </mat-expansion-panel-header>
                <div class="doc-list">
                  <div class="doc-item" *ngFor="let doc of protocolDocs">
                    <div class="doc-icon"><mat-icon>insert_drive_file</mat-icon></div>
                    <div class="doc-info">
                      <span class="doc-name">{{ doc.name }}</span>
                      <span class="doc-type">{{ doc.type }}</span>
                    </div>
                    <button mat-icon-button color="primary" matTooltip="Abrir Documento">
                      <mat-icon>open_in_new</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>

            <div class="protocol-quick-summary glass-card mt-4">
              <h4>Resumen Ejecutivo</h4>
              <p>El estudio busca determinar la correlación entre las horas de guardia y el nivel de ansiedad autoperceptiva...</p>
              <button mat-button color="primary">Ver Resumen Completo</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .evaluation-container { background: #f8fafc; min-height: 100vh; overflow-x: hidden; }

    /* Layout Side-by-Side */
    .main-layout { display: flex; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .evaluation-container.side-by-side {
      .form-body { flex: 0 0 60%; max-width: 60%; }
      .preview-panel { flex: 0 0 40%; border-left: 1px solid #e2e8f0; }
    }
    .form-body { flex: 1; transition: all 0.4s ease; max-width: 900px; margin: 0 auto; }

    /* Sticky Header */
    .sticky-header {
      position: sticky; top: 0; z-index: 1000; background: white; border-bottom: 1px solid #e2e8f0;
      .header-content { padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    }

    .preview-toggle-wrapper {
      display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 6px 16px; border-radius: 12px;
      .info-icon { font-size: 18px; color: #94a3b8; }
    }

    .v-divider { width: 1px; height: 32px; background: #e2e8f0; margin: 0 1rem; }
    .save-status { display: flex; align-items: center; gap: 8px; color: #10b981; font-size: 0.8rem; font-weight: 600; margin-right: 1.5rem; }

    /* Stepper & Cards */
    .custom-stepper { background: transparent !important; }
    .step-card { padding: 2rem; border-radius: 24px; margin-top: 1rem; }
    
    .criteria-grid { display: flex; flex-direction: column; gap: 1rem; }
    .criteria-item { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1.5rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 1rem; }
    .selection-box-group { display: flex; gap: 0.75rem; }
    .selection-box {
      width: 100px; padding: 8px; border-radius: 12px; border: 1.5px solid #e2e8f0; 
      display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s;
      mat-icon { font-size: 20px; color: #94a3b8; }
      span { font-size: 0.65rem; font-weight: 800; }
      &.active { background: #003366; color: white; mat-icon { color: white; } }
    }

    /* Decision Cards */
    .decision-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem; }
    .decision-card {
      padding: 1.5rem; border-radius: 16px; border: 2px solid #f1f5f9; cursor: pointer; text-align: center; transition: all 0.3s;
      .card-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; }
      h3 { font-size: 0.9rem; font-weight: 800; margin: 0; }
      &.active { border-color: #003366; background: #f8fbff; transform: scale(1.05); }
    }

    /* Preview Panel */
    .preview-panel {
      background: #ffffff; height: calc(100vh - 70px); position: sticky; top: 70px; display: flex; flex-direction: column;
      .panel-header { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; h3 { font-weight: 800; margin: 0; } }
      .panel-content { padding: 1.5rem; overflow-y: auto; flex: 1; }
    }

    .doc-list { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 0; }
    .doc-item {
      display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px;
      .doc-icon { color: #003366; }
      .doc-info { display: flex; flex-direction: column; flex: 1; .doc-name { font-weight: 700; font-size: 0.85rem; } .doc-type { font-size: 0.7rem; color: #94a3b8; font-weight: 600; } }
    }

    /* Signature Section */
    .signature-section {
      background: #fdfdfd; border: 2px dashed #e2e8f0; border-radius: 20px; padding: 2rem;
      .section-header { text-align: center; margin-bottom: 1.5rem; mat-icon { font-size: 40px; width: 40px; height: 40px; color: #003366; } h3 { font-weight: 800; } p { color: #64748b; font-size: 0.9rem; } }
    }

    .file-status-chip { display: inline-flex; align-items: center; gap: 8px; background: #dcfce7; color: #15803d; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 0.85rem; margin-top: 1rem; }

    .submit-btn { background: #003366 !important; color: white !important; padding: 0 2rem; height: 50px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; }
    
    .animate-slide-left { animation: slideLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes slideLeft { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class EvaluationFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private submitEvaluationUC = inject(SubmitEvaluationUseCase);

  @ViewChild('stepper') stepper!: MatStepper;

  showPreview = signal(false);
  isSigned = signal(false);
  isSubmitting = signal(false);
  progressValue = signal(10);
  finalDecision = signal<EvaluationVerdict | null>(null);
  verdicts = EvaluationVerdict;

  protocolInfo = signal({ id: 'p-001', code: '2026-IO-001', title: 'Ansiedad en Estudiantes de Medicina', type: 'IO' });
  
  protocolDocs = [
    { name: 'Protocolo_Investigacion_v2.pdf', type: 'Protocolo Principal' },
    { name: 'Consentimiento_Informado.pdf', type: 'Anexo Técnico' },
    { name: 'Instrumentos_Recoleccion.docx', type: 'Metodología' }
  ];

  technicalCriteria = [
    { key: 'methodology', label: 'Metodología', desc: 'Diseño adecuado para los objetivos' },
    { key: 'sample', label: 'Muestra', desc: 'Justificación del tamaño y selección' }
  ];

  ethicalCriteria = [
    { key: 'consent', label: 'Consentimiento', desc: 'Claridad y descripción de riesgos' },
    { key: 'risks', label: 'Riesgo/Beneficio', desc: 'Equilibrio ético del estudio' }
  ];

  technicalForm = this.fb.group({
    methodology: ['', Validators.required],
    sample: ['', Validators.required],
    observations: ['', [Validators.required, Validators.minLength(10)]]
  });

  ethicalForm = this.fb.group({
    consent: ['', Validators.required],
    risks: ['', Validators.required],
    observations: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit() {}

  setSelection(formType: 'technical' | 'ethical', key: string, value: string) {
    if (formType === 'technical') {
      const control = this.technicalForm.get(key);
      if (control) control.setValue(value);
    } else {
      const control = this.ethicalForm.get(key);
      if (control) control.setValue(value);
    }
    this.updateProgress();
  }

  onStepChange(event: any) { this.updateProgress(); }

  updateProgress() {
    const totalSteps = 3;
    const currentStep = this.stepper?.selectedIndex || 0;
    this.progressValue.set(((currentStep + 1) / totalSteps) * 100);
  }

  onFileUpload(files: File[]) {
    if (files.length > 0) {
      this.isSigned.set(true);
      this.snackBar.open('Acta cargada correctamente', 'Cerrar', { duration: 2000 });
    }
  }

  canSubmit(): boolean {
    return !!this.finalDecision() && this.isSigned() && this.technicalForm.valid && this.ethicalForm.valid;
  }

  onSubmit() {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    const evaluation: Partial<EvaluationEntity> = {
      protocolId: this.protocolInfo().id,
      technicalCriteria: this.mapCriteria(this.technicalForm, this.technicalCriteria),
      technicalObservations: this.technicalForm.value.observations || '',
      ethicalCriteria: this.mapCriteria(this.ethicalForm, this.ethicalCriteria),
      ethicalObservations: this.ethicalForm.value.observations || '',
      verdict: this.finalDecision()!
    };

    this.submitEvaluationUC.execute(evaluation).subscribe({
      next: () => {
        this.snackBar.open('Evaluación finalizada y enviada al CEISH', 'Éxito', { 
          duration: 5000, 
          panelClass: ['snackbar-success'] 
        });
        this.router.navigate(['/dashboard/evaluations/list']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Error al enviar la evaluación. Intente nuevamente.', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-error'] 
        });
      }
    });
  }

  private mapCriteria(form: FormGroup, criteria: any[]): CriteriaResult[] {
    return criteria.map(c => ({
      key: c.key,
      value: form.get(c.key)?.value as 'YES' | 'NO'
    }));
  }
}
