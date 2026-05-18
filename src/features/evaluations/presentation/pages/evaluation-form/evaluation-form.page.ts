import { Component, inject, signal, OnInit, ViewChild, computed } from '@angular/core';
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
            <button mat-icon-button routerLink="/dashboard/evaluations/list" class="back-btn" [disabled]="isSubmitting()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="protocol-meta">
              <span class="code">{{ protocolInfo()?.code | protocolCode }}</span>
              <h2 class="title">{{ protocolInfo()?.title }}</h2>
              <span class="badge-anexo">{{ currentAnexo()?.anexo }}: {{ currentAnexo()?.titulo }}</span>
            </div>
          </div>
          <div class="header-actions">
            <mat-slide-toggle [checked]="showPreview()" (change)="showPreview.set($event.checked)" color="primary" [disabled]="isSubmitting()">
              Ver Expediente PI
            </mat-slide-toggle>
            <div class="v-divider"></div>
            <button mat-stroked-button color="warn" routerLink="/dashboard/evaluations/list" [disabled]="isSubmitting()">Salir</button>
          </div>
        </div>
        <mat-progress-bar [mode]="isSubmitting() ? 'indeterminate' : 'determinate'" [value]="progressValue()"></mat-progress-bar>
      </div>

      <div class="main-layout">
        <!-- Formulario Dinámico PET -->
        <div class="form-body container py-4">
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

                  <div class="step-actions mt-5 d-flex gap-3">
                    <button mat-button matStepperPrevious *ngIf="!$first">ATRÁS</button>
                    <button mat-flat-button color="primary" matStepperNext *ngIf="!$last">CONTINUAR</button>
                  </div>
                </div>
              </mat-step>
            }

            <!-- ÚLTIMO PASO: SUSTENTO Y ENVÍO -->
            <mat-step>
              <ng-template matStepLabel>Firma y Envío</ng-template>
              <div class="step-card glass-card">
                
                <!-- Regla Crítica: Sustento Técnico Obligatorio -->
                <div class="alert-box mb-4" *ngIf="isReportRequired()">
                  <mat-icon color="warn">warning</mat-icon>
                  <div class="alert-text">
                    <strong>Sustento Técnico Obligatorio</strong>
                    <p>Al haber dictaminado resultados negativos o condicionados, debe adjuntar obligatoriamente el informe técnico firmado en PDF.</p>
                  </div>
                </div>

                <div class="upload-section text-center p-5 border-dashed rounded-4">
                   <mat-icon color="primary" style="font-size: 64px; width: 64px; height: 64px;">cloud_upload</mat-icon>
                   <h3 class="fw-bold mt-3">Informe de Evaluación Firmado</h3>
                   <p class="text-muted small mb-4">Solo archivos PDF (Máx 10MB)</p>
                   
                   <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
                   
                   <div class="file-ready-chip mt-3" *ngIf="selectedFile">
                     <mat-icon>check_circle</mat-icon>
                     <span>{{ selectedFile.name }} ({{ (selectedFile.size/1024/1024).toFixed(2) }} MB)</span>
                   </div>
                </div>

                <div class="final-actions mt-5 pt-4 border-top">
                  <button mat-button matStepperPrevious [disabled]="isSubmitting()">REVISAR EVALUACIÓN</button>
                  <button mat-flat-button class="submit-btn" 
                          [disabled]="!canSubmit() || isSubmitting()" 
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

        <!-- Sidebar Documentos -->
        <aside class="preview-panel" *ngIf="showPreview()">
          <div class="panel-header">
            <h3>Expediente del Protocolo</h3>
            <p class="small text-muted">Consulte los documentos cargados por el investigador</p>
          </div>
          <div class="panel-content">
            <div class="doc-list">
              <div class="doc-item" *ngFor="let d of protocolDocs()">
                <mat-icon>picture_as_pdf</mat-icon>
                <div class="d-info">
                  <span class="n text-truncate">{{ d.name || d.title }}</span>
                  <span class="t">{{ d.type }}</span>
                </div>
                <a [href]="d.url" target="_blank" mat-icon-button color="primary">
                  <mat-icon>open_in_new</mat-icon>
                </a>
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
    
    .step-card { padding: 2.5rem; border-radius: 24px; border: 1px solid #e2e8f0; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
    .section-instruction { display: flex; align-items: center; gap: 10px; background: #f0f7ff; color: #003366; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    
    .field-title { font-size: 0.9rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem; }
    
    .triple-result-group { display: flex; gap: 10px; }
    .res-btn { flex: 1; height: 48px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: white; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
      &.active { background: #10b981; color: white; border-color: #10b981; }
      &.conditional.active { background: #f59e0b; border-color: #f59e0b; }
      &.negative.active { background: #ef4444; border-color: #ef4444; }
    }

    .alert-box { display: flex; gap: 12px; background: #fff1f2; border: 1px solid #fecaca; color: #991b1b; padding: 16px; border-radius: 16px;
      .alert-text { strong { display: block; font-size: 0.9rem; } p { margin: 0; font-size: 0.8rem; } }
    }

    .submit-btn { background: #003366 !important; color: white !important; font-weight: 800; height: 56px; border-radius: 14px; padding: 0 2.5rem; }
    .file-ready-chip { display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #166534; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; width: fit-content; margin: 0 auto; }

    .border-dashed { border: 2px dashed #e2e8f0; }
    .doc-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px; border: 1px solid #edf2f7;
      .d-info { flex: 1; display: flex; flex-direction: column; .n { font-size: 0.8rem; font-weight: 700; color: #1e293b; } .t { font-size: 0.65rem; color: #94a3b8; font-weight: 600; } }
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

  @ViewChild('stepper') stepper!: MatStepper;

  evaluationId = '';
  protocolInfo = signal<any>(null);
  currentAnexo = signal<AnexoEvaluacion | null>(null);
  
  showPreview = signal(true);
  isSubmitting = signal(false);
  progressValue = signal(10);
  
  evaluationForm: FormGroup = this.fb.group({});
  selectedFile: File | null = null;

  sections: string[] = [];

  ngOnInit() {
    this.evaluationId = this.route.snapshot.params['id'];
    this.loadInitialData();
  }

  loadInitialData() {
    this.evalRepo.getMyAssignments().subscribe(assignments => {
      const task = assignments.find(a => a.id === this.evaluationId);
      if (task) {
        this.protocolRepo.getById(task.protocolId).subscribe(protocol => {
          this.protocolInfo.set(protocol);
          // REGLA: Determinar Anexo basado en reviewType del backend o tipo de protocolo
          const esExpedita = protocol.status === 'EN_REVISION_EXPEDITA' || protocol.type === ProtocolType.IO;
          this.currentAnexo.set(getAnexoPorTipo(protocol.type, esExpedita));
          this.initDynamicForm();
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
    if (this.isReportRequired() && !this.selectedFile) return false;
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

    const formData = new FormData();
    const payload = {
      assignmentId: this.evaluationId,
      anexoId: this.currentAnexo()?.id,
      data: this.evaluationForm.value,
      result: this.getGlobalResult()
    };

    formData.append('evaluationData', JSON.stringify(payload));
    if (this.selectedFile) formData.append('report', this.selectedFile);

    this.submitEvaluationUC.execute(formData).subscribe({
      next: () => {
        this.snackBar.open('✅ Evaluación enviada con éxito.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/evaluations/list']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.snackBar.open(`❌ Error: ${err.error?.message || 'No se pudo enviar'}`, 'Cerrar');
      }
    });
  }

  private getGlobalResult(): string {
    const values = this.evaluationForm.getRawValue();
    if (values.resultadoGlobal) return values.resultadoGlobal;
    
    // Para Anexo 9, si alguna sección no es APROBADO, el global es CON_OBSERVACIONES o NO_APROBADO
    if (values.resultadoEtica === 'NO_APROBADO' || values.resultadoMetodologia === 'NO_APROBADO' || values.resultadoJuridica === 'NO_APROBADO') {
      return 'NO_APROBADO';
    }
    if (this.isReportRequired()) return 'CON_OBSERVACIONES';
    return 'APROBADO';
  }

  protocolDocs = computed(() => this.protocolInfo()?.documents || []);
}
