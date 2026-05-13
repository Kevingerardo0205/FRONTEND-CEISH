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
import { EvaluationVerdict, ComplianceStatus } from '@domain/entities/evaluation.entity';
import { ANEXOS_EVALUACION, AnexoEvaluacion, getAnexoPorTipo, CampoEvaluacion, TipoRevision } from '../../constants/anexos-evaluacion.constants';
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
              Ver Documentos PI
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
          <mat-stepper [linear]="true" orientation="vertical" #stepper class="custom-stepper" (selectionChange)="onStepChange($event)">
            
            <!-- SECCION GENERAL (Solo Anexo 9) -->
            <mat-step *ngIf="hasSection('GENERAL')" [stepControl]="formGeneral">
              <ng-template matStepLabel>Información General / Justificación</ng-template>
              <div class="step-card glass-card">
                <div class="criteria-section" *ngFor="let campo of getCamposPorSeccion('GENERAL')">
                  <div class="criteria-header">
                    <h4>{{ campo.label }}</h4>
                  </div>
                  <div class="selection-group" *ngIf="campo.tipo === 'check'">
                    <button type="button" class="select-box" [class.active]="formGeneral.get(campo.id)?.value === true" (click)="formGeneral.get(campo.id)?.setValue(true)">SÍ</button>
                    <button type="button" class="select-box no" [class.active]="formGeneral.get(campo.id)?.value === false" (click)="formGeneral.get(campo.id)?.setValue(false)">NO</button>
                  </div>
                  <mat-form-field appearance="outline" class="full-width mt-2" *ngIf="campo.tipo === 'text'">
                    <textarea matInput rows="2" [formControlName]="campo.id"></textarea>
                  </mat-form-field>
                </div>

                <div class="step-actions mt-3">
                  <button mat-flat-button color="primary" matStepperNext>Siguiente</button>
                </div>
              </div>
            </mat-step>

            <!-- SECCION ETICA (Emanuel + Otros) -->
            <mat-step [stepControl]="formEtica">
              <ng-template matStepLabel>Evaluación Ética (7 Criterios de Emanuel)</ng-template>
              <div class="step-card glass-card">
                <div class="criteria-grid">
                  <div class="criteria-row" *ngFor="let campo of getCamposPorSeccion('ETICA')">
                    <div class="criteria-label">
                      <strong>{{ campo.label }}</strong>
                      <p class="small text-muted">{{ campo.descripcion }}</p>
                    </div>
                    <div class="compliance-group">
                      <button type="button" class="comp-btn c" [class.active]="formEtica.get(campo.id)?.value === 'C'" (click)="formEtica.get(campo.id)?.setValue('C')">C</button>
                      <button type="button" class="comp-btn nc" [class.active]="formEtica.get(campo.id)?.value === 'NC'" (click)="formEtica.get(campo.id)?.setValue('NC')">NC</button>
                      <button type="button" class="comp-btn na" [class.active]="formEtica.get(campo.id)?.value === 'NA'" (click)="formEtica.get(campo.id)?.setValue('NA')">NA</button>
                    </div>
                  </div>
                </div>

                <mat-form-field appearance="outline" class="full-width mt-4">
                  <mat-label>Observaciones Éticas</mat-label>
                  <textarea matInput rows="3" [(ngModel)]="obsEtica" [ngModelOptions]="{standalone: true}"></textarea>
                </mat-form-field>

                <div class="step-actions mt-3">
                  <button mat-button matStepperPrevious *ngIf="hasSection('GENERAL')">Atrás</button>
                  <button mat-flat-button color="primary" matStepperNext>Siguiente: Metodología</button>
                </div>
              </div>
            </mat-step>

            <!-- SECCION TECNICA (Metodológica) -->
            <mat-step *ngIf="hasSection('TECNICA')" [stepControl]="formTecnica">
              <ng-template matStepLabel>Evaluación Metodológica</ng-template>
              <div class="step-card glass-card">
                <div class="criteria-grid">
                  <div class="criteria-row" *ngFor="let campo of getCamposPorSeccion('TECNICA')">
                    <div class="criteria-label">
                      <strong>{{ campo.label }}</strong>
                    </div>
                    <div class="compliance-group" *ngIf="campo.tipo === 'compliance'">
                      <button type="button" class="comp-btn c" [class.active]="formTecnica.get(campo.id)?.value === 'C'" (click)="formTecnica.get(campo.id)?.setValue('C')">C</button>
                      <button type="button" class="comp-btn nc" [class.active]="formTecnica.get(campo.id)?.value === 'NC'" (click)="formTecnica.get(campo.id)?.setValue('NC')">NC</button>
                      <button type="button" class="comp-btn na" [class.active]="formTecnica.get(campo.id)?.value === 'NA'" (click)="formTecnica.get(campo.id)?.setValue('NA')">NA</button>
                    </div>
                    <mat-form-field appearance="outline" class="full-width" *ngIf="campo.tipo === 'text'">
                       <textarea matInput rows="2" [formControlName]="campo.id"></textarea>
                    </mat-form-field>
                  </div>
                </div>

                <mat-form-field appearance="outline" class="full-width mt-4">
                  <mat-label>Observaciones Metodológicas</mat-label>
                  <textarea matInput rows="3" [(ngModel)]="obsTecnica" [ngModelOptions]="{standalone: true}"></textarea>
                </mat-form-field>

                <div class="step-actions mt-3">
                  <button mat-button matStepperPrevious>Atrás</button>
                  <button mat-flat-button color="primary" matStepperNext>Siguiente: Jurídica</button>
                </div>
              </div>
            </mat-step>

            <!-- SECCION JURIDICA Y FINAL -->
            <mat-step>
              <ng-template matStepLabel>Dictamen Jurídico y Resolución Final</ng-template>
              <div class="step-card glass-card">
                <div class="criteria-grid mb-4">
                  <div class="criteria-row" *ngFor="let campo of getCamposPorSeccion('JURIDICA')">
                    <div class="criteria-label"><strong>{{ campo.label }}</strong></div>
                    <div class="compliance-group" *ngIf="campo.tipo === 'compliance'">
                      <button type="button" class="comp-btn c" [class.active]="formJuridica.get(campo.id)?.value === 'C'" (click)="formJuridica.get(campo.id)?.setValue('C')">C</button>
                      <button type="button" class="comp-btn nc" [class.active]="formJuridica.get(campo.id)?.value === 'NC'" (click)="formJuridica.get(campo.id)?.setValue('NC')">NC</button>
                      <button type="button" class="comp-btn na" [class.active]="formJuridica.get(campo.id)?.value === 'NA'" (click)="formJuridica.get(campo.id)?.setValue('NA')">NA</button>
                    </div>
                    <div class="selection-group" *ngIf="campo.tipo === 'check'">
                      <button type="button" class="select-box" [class.active]="formJuridica.get(campo.id)?.value === true" (click)="formJuridica.get(campo.id)?.setValue(true)">SÍ</button>
                      <button type="button" class="select-box no" [class.active]="formJuridica.get(campo.id)?.value === false" (click)="formJuridica.get(campo.id)?.setValue(false)">NO</button>
                    </div>
                  </div>
                </div>

                <h3 class="mt-5 mb-3 text-uppercase fw-bold">Veredicto Final del Evaluador</h3>
                <div class="verdict-grid">
                  <div class="verdict-card favorable" [class.selected]="finalVerdict() === 'APROBADO'" (click)="finalVerdict.set(verdicts.APROBADO)">
                    <mat-icon>check_circle</mat-icon><span>APROBADO</span>
                  </div>
                  <div class="verdict-card observed" [class.selected]="finalVerdict() === 'CON_OBSERVACIONES'" (click)="finalVerdict.set(verdicts.CON_OBSERVACIONES)">
                    <mat-icon>error_outline</mat-icon><span>CON OBSERVACIONES</span>
                  </div>
                  <div class="verdict-card negative" [class.selected]="finalVerdict() === 'NO_APROBADO'" (click)="finalVerdict.set(verdicts.NO_APROBADO)">
                    <mat-icon>cancel</mat-icon><span>NO APROBADO</span>
                  </div>
                </div>

                <div class="upload-section mt-5">
                   <h4>Adjuntar Informe / Acta Firmada (PDF)</h4>
                   <p class="small text-muted mb-3">Suba el respaldo oficial de su evaluación para los archivos del CEISH.</p>
                   <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
                   <div class="file-chip mt-2" *ngIf="isSigned()">
                     <mat-icon>description</mat-icon><span>Documento listo: {{ selectedFile?.name }}</span>
                   </div>
                </div>

                <div class="final-actions mt-5">
                  <button mat-button matStepperPrevious>Revisar</button>
                  <button mat-flat-button class="submit-btn" [disabled]="!canSubmit() || isSubmitting()" (click)="onSubmit()">
                    <mat-icon *ngIf="!isSubmitting()">send</mat-icon>
                    <mat-spinner *ngIf="isSubmitting()" diameter="20" color="accent"></mat-spinner>
                    {{ isSubmitting() ? 'PROCESANDO...' : 'ENVIAR EVALUACIÓN AL COMITÉ' }}
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
                  <span class="n">{{ d.name || d.title }}</span>
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
      .header-content { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    }
    .protocol-meta { display: flex; flex-direction: column; .code { font-weight: 800; color: #003366; font-size: 0.75rem; } 
      .title { font-size: 1.1rem; font-weight: 700; margin: 2px 0; }
      .badge-anexo { font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; }
    }
    .main-layout { display: flex; }
    .form-body { flex: 1; max-width: 1000px; }
    .preview-panel { width: 450px; background: white; border-left: 1px solid #e2e8f0; height: calc(100vh - 80px); position: sticky; top: 80px; padding: 1.5rem; overflow-y: auto; }
    
    .step-card { padding: 2rem; border-radius: 20px; border: 1px solid #e2e8f0; background: white; }
    
    .criteria-grid { display: flex; flex-direction: column; gap: 1rem; }
    .criteria-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 0; border-bottom: 1px dashed #e2e8f0; 
      .criteria-label { flex: 1; margin-right: 1.5rem; strong { font-size: 0.95rem; display: block; margin-bottom: 4px; } p { margin: 0; line-height: 1.3; } }
    }

    .compliance-group { display: flex; gap: 4px; }
    .comp-btn { width: 42px; height: 42px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: white; font-weight: 800; cursor: pointer; transition: all 0.2s;
      &.c.active { background: #10b981; color: white; border-color: #10b981; }
      &.nc.active { background: #ef4444; color: white; border-color: #ef4444; }
      &.na.active { background: #64748b; color: white; border-color: #64748b; }
    }

    .selection-group { display: flex; gap: 8px; }
    .select-box { padding: 8px 16px; border-radius: 8px; border: 1.5px solid #e2e8f0; font-size: 0.75rem; font-weight: 800; cursor: pointer;
      &.active { background: #003366; color: white; border-color: #003366; }
      &.no.active { background: #ef4444; color: white; border-color: #ef4444; }
    }

    .verdict-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .verdict-card { padding: 1.5rem; border-radius: 12px; border: 2px solid #f1f5f9; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; } span { font-weight: 800; font-size: 0.7rem; }
      &.favorable { color: #10b981; &.selected { background: #10b981; color: white; } }
      &.observed { color: #f59e0b; &.selected { background: #f59e0b; color: white; } }
      &.negative { color: #ef4444; &.selected { background: #ef4444; color: white; } }
    }

    .submit-btn { background: #003366 !important; color: white !important; font-weight: 800; height: 52px; border-radius: 12px; padding: 0 2rem; width: 100%; }
    .doc-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px; border: 1px solid #edf2f7;
      .d-info { flex: 1; display: flex; flex-direction: column; .n { font-size: 0.85rem; font-weight: 700; color: #1e293b; } .t { font-size: 0.7rem; color: #94a3b8; font-weight: 600; } }
    }

    .full-width { width: 100%; }
    .file-chip { display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #166534; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; }
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
  isSigned = signal(false);
  isSubmitting = signal(false);
  progressValue = signal(25);
  finalVerdict = signal<EvaluationVerdict | null>(null);
  verdicts = EvaluationVerdict;

  formGeneral: FormGroup = this.fb.group({});
  formEtica: FormGroup = this.fb.group({});
  formTecnica: FormGroup = this.fb.group({});
  formJuridica: FormGroup = this.fb.group({});

  obsEtica = '';
  obsTecnica = '';
  
  protocolDocs = computed(() => this.protocolInfo()?.documents || []);

  ngOnInit() {
    this.evaluationId = this.route.snapshot.params['id'];
    this.loadInitialData();
  }

  loadInitialData() {
    // Primero obtenemos la tarea de evaluación para saber qué protocolo es
    this.evalRepo.getMyAssignments().subscribe(assignments => {
      const task = assignments.find(a => a.id === this.evaluationId);
      if (task) {
        this.protocolRepo.getById(task.protocolId).subscribe(protocol => {
          this.protocolInfo.set(protocol);
          // Determinamos el anexo según tipo de protocolo y si es expedita (asumimos por defecto basado en tipo)
          const esExpedita = protocol.type === ProtocolType.IO;
          this.currentAnexo.set(getAnexoPorTipo(protocol.type, esExpedita));
          this.initForms();
        });
      }
    });
  }

  initForms() {
    const anexo = this.currentAnexo();
    if (!anexo) return;

    anexo.campos.forEach(campo => {
      const control = new FormControl('', campo.obligatorio ? Validators.required : null);
      switch(campo.seccion) {
        case 'GENERAL': this.formGeneral.addControl(campo.id, control); break;
        case 'ETICA': this.formEtica.addControl(campo.id, control); break;
        case 'TECNICA': this.formTecnica.addControl(campo.id, control); break;
        case 'JURIDICA': this.formJuridica.addControl(campo.id, control); break;
      }
    });
  }

  hasSection(seccion: string): boolean {
    return this.currentAnexo()?.campos.some(c => c.seccion === seccion) || false;
  }

  getCamposPorSeccion(seccion: string) {
    return this.currentAnexo()?.campos.filter(c => c.seccion === seccion) || [];
  }

  onStepChange(event: any) { 
    const totalSteps = this.stepper._steps.length;
    this.progressValue.set(((event.selectedIndex + 1) / totalSteps) * 100); 
  }

  selectedFile: File | null = null;
  onFileUpload(files: File[]) { 
    if (files.length > 0) {
      this.selectedFile = files[0];
      this.isSigned.set(true); 
    }
  }

  canSubmit() {
    const vGeneral = this.hasSection('GENERAL') ? this.formGeneral.valid : true;
    const vTecnica = this.hasSection('TECNICA') ? this.formTecnica.valid : true;
    return vGeneral && this.formEtica.valid && vTecnica && this.formJuridica.valid && this.isSigned() && this.finalVerdict();
  }

  onSubmit() {
    if (!this.canSubmit()) return;
    this.isSubmitting.set(true);

    const formData = new FormData();
    const anexo = this.currentAnexo()!;
    
    // Mapeo dinámico según el Anexo Activo
    const evaluationData: any = {
      assignmentId: this.evaluationId,
      result: this.finalVerdict()
    };

    if (anexo.id === 'anexo9') {
      evaluationData.annex9 = {
        cumpleCriteriosExpedita: this.formGeneral.get('cumpleCriteriosExpedita')?.value,
        justificacion: this.formGeneral.get('justificacion')?.value,
        etica: { ...this.formEtica.value, observaciones: this.obsEtica }
      };
    } else if (anexo.id === 'anexo10' || anexo.id === 'anexo11') {
      const data: any = {
        etica: { ...this.formEtica.value, observaciones: this.obsEtica },
        metodologia: { ...this.formTecnica.value, observaciones: this.obsTecnica },
        legal: { ...this.formJuridica.value }
      };
      
      if (anexo.id === 'anexo11') {
        data.aprobacionArcsaVerificada = this.formJuridica.get('aprobacionArcsaVerificada')?.value;
        data.polizaSeguroVigente = this.formJuridica.get('polizaSeguroVigente')?.value;
        data.comentariosFarmaco = this.formTecnica.get('comentariosFarmaco')?.value;
        evaluationData.annex11 = data;
      } else {
        evaluationData.annex10 = data;
      }
    }

    formData.append('evaluationData', JSON.stringify(evaluationData));
    if (this.selectedFile) {
      formData.append('report', this.selectedFile);
    }

    this.submitEvaluationUC.execute(formData).subscribe({
      next: () => {
        this.snackBar.open('✅ Evaluación enviada al Comité.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/evaluations/list']);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.snackBar.open(`❌ Error: ${err.message || 'No se pudo enviar'}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
}
