import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { filter, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-evaluation-consolidation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="consolidation-container animate-fade-in">
      <header class="page-header mb-4">
        <div class="d-flex align-items-center gap-3">
          <button mat-icon-button routerLink="/dashboard/evaluations/assignment" class="back-btn" aria-label="Volver a la bandeja de asignación">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <div class="breadcrumb">Evaluación / Consolidación de Dictámenes</div>
            <h1 class="page-title">Resumen de Sesión (Anexo 12)</h1>
            <p class="page-subtitle">{{ protocol()?.title }}</p>
          </div>
        </div>
        <span class="protocol-badge">{{ protocol()?.code | protocolCode }}</span>
      </header>

      <div class="row g-4">
        <!-- Dashboard Izquierdo: Estado Global -->
        <div class="col-lg-4">
          <div class="summary-card shadow-soft p-4">
            <h3 class="fw-bold mb-4">Análisis de Unanimidad</h3>
            
            <div class="unanimity-indicator mb-5" [ngClass]="isUnanimous() ? 'unanimous' : 'discrepancy'">
              <mat-icon>{{ isUnanimous() ? 'verified' : 'gavel' }}</mat-icon>
              <div class="text">
                <strong>{{ isUnanimous() ? 'UNANIMIDAD DETECTADA' : 'EXISTEN DISCREPANCIAS' }}</strong>
                <p>{{ isUnanimous() ? 'Todos los evaluadores coinciden en el veredicto.' : 'Se requiere debate en sesión de Pleno.' }}</p>
              </div>
            </div>

            <div class="traffic-light-container">
              <div class="light-item" [class.active]="countVerdict('APROBADO') > 0">
                <div class="light green"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('APROBADO') }}</span>
                  <span class="label">Informes Favorables</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="countVerdict('CON_OBSERVACIONES') > 0 || countVerdict('APROBADO_CONDICIONADO') > 0">
                <div class="light yellow"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('CON_OBSERVACIONES') + countVerdict('APROBADO_CONDICIONADO') }}</span>
                  <span class="label">Con Observaciones</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="countVerdict('NO_APROBADO') > 0">
                <div class="light red"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('NO_APROBADO') }}</span>
                  <span class="label">Informes Negativos</span>
                </div>
              </div>
            </div>

            <div class="action-box mt-5 pt-4 border-top">
              <h4 class="small fw-bold text-muted text-uppercase mb-3">Acción Sugerida</h4>
              <button mat-flat-button class="btn-finalize w-100" (click)="onProceedToResolution()" aria-label="Generar Acta Resolutiva final para el protocolo">
                <mat-icon>description</mat-icon> COMPLETAR DICTAMEN
              </button>
            </div>
          </div>
        </div>

        <!-- Matriz Comparativa Derecha & Formulario -->
        <div class="col-lg-8">
          <div class="matrix-card shadow-soft">
            <div class="card-header p-3 bg-dark text-white d-flex justify-content-between align-items-center">
              <h4 class="m-0 fw-bold">Comparativa de Criterios Técnicos</h4>
              <span class="small opacity-75">Dictámenes recibidos: {{ evaluations().length }}</span>
            </div>
            
            <div class="matrix-body p-4">
              <div class="table-responsive">
                <table class="comparison-matrix">
                  <thead>
                    <tr>
                      <th>Evaluador / Área</th>
                      <th class="text-center">Ética</th>
                      <th class="text-center">Metodología</th>
                      <th class="text-center">Legal</th>
                      <th class="text-center">Dictamen Final</th>
                      <th class="text-center">Documentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ev of evaluations()">
                      <td class="evaluator-name">
                        <strong>{{ ev.evaluatorName || 'Experto ' + ev.id }}</strong>
                        <span class="small d-block text-muted">{{ ev.evaluatorProfile }}</span>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.ethicsResult)">{{ getStatusIcon(ev.ethicsResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.methodologyResult)">{{ getStatusIcon(ev.methodologyResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.legalResult)">{{ getStatusIcon(ev.legalResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <span class="badge-verdict" [ngClass]="ev.verdict.toLowerCase()">{{ ev.verdict }}</span>
                      </td>
                      <td class="text-center">
                        <div class="doc-download-row">
                          <button type="button" mat-icon-button color="warn" (click)="downloadEvaluatorPdf(ev.id)" matTooltip="Descargar Reporte PDF Oficial">
                            <mat-icon>picture_as_pdf</mat-icon>
                          </button>
                          <button type="button" mat-icon-button color="primary" (click)="downloadEvaluatorDocx(ev.id)" matTooltip="Descargar Word DOCX Editable">
                            <mat-icon>description</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Bloque de Observaciones Consolidadas -->
              <div class="consolidated-obs mt-5">
                <h4 class="fw-bold mb-3 d-flex align-items-center gap-2">
                  <mat-icon color="primary">speaker_notes</mat-icon>
                  Compendio de Observaciones para el Pleno
                </h4>
                
                <div class="obs-timeline">
                  @for (ev of evaluations(); track ev.id) {
                    @if (ev.observations) {
                      <div class="obs-item">
                        <div class="obs-author">{{ ev.evaluatorName }} ({{ ev.evaluatorProfile }})</div>
                        <div class="obs-text">{{ ev.observations }}</div>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario de Emisión de Dictamen Consolidado (Screen 1) -->
          <div class="content-card shadow-soft p-4 mt-4 dictamen-card">
            <header class="section-header mb-4">
              <mat-icon>gavel</mat-icon>
              <h3 class="m-0 fw-bold">Emisión de Dictamen Consolidado</h3>
            </header>

            <form [formGroup]="form">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="field-label">Tipo de Resolución / Dictamen</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                      <mat-select formControlName="resolutionType" placeholder="Seleccione el dictamen">
                        <mat-option value="APPROVAL">Aprobación Definitiva (Anexos 13/14)</mat-option>
                        <mat-option value="CONDITIONAL">Aprobación Condicionada / Subsanación (Anexo 15)</mat-option>
                        <mat-option value="REJECTION">No Aprobación (Anexo 16)</mat-option>
                      </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <!-- Dynamic Fields -->
              <div class="dynamic-fields mt-4 animate-slide-up" *ngIf="form.get('resolutionType')?.value">
                <h4 class="section-sub-title mb-3">
                  <mat-icon>edit_note</mat-icon>
                  Campos Específicos del Dictamen
                </h4>

                <!-- Conditional Fields -->
                <ng-container *ngIf="form.get('resolutionType')?.value === 'CONDITIONAL'">
                  <div class="field-group mb-3">
                    <label class="field-label">Observaciones Mayores (Obligatorias)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="majorObservations" rows="3" placeholder="Detalle las correcciones obligatorias que debe realizar el investigador..."></textarea>
                    </mat-form-field>
                  </div>
                  <div class="field-group mb-3">
                    <label class="field-label">Observaciones Menores</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="minorObservations" rows="3" placeholder="Sugerencias no condicionantes para el investigador..."></textarea>
                    </mat-form-field>
                  </div>
                  <div class="field-group mb-3">
                    <label class="field-label">Procedimiento de Subsanación (Instrucciones)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="correctionProcedure" rows="3" placeholder="Detalle los pasos o archivos que debe cargar el investigador para subsanar..."></textarea>
                    </mat-form-field>
                  </div>
                  <div class="col-md-4">
                    <label class="field-label">Plazo de Subsanación (Días)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <input matInput type="number" formControlName="deadlineDays">
                      <span matSuffix class="pe-3">días</span>
                    </mat-form-field>
                  </div>
                </ng-container>

                <!-- Rejection Fields -->
                <ng-container *ngIf="form.get('resolutionType')?.value === 'REJECTION'">
                  <div class="field-group mb-3">
                    <label class="field-label">Justificación Ética y Metodológica del Rechazo (Obligatoria)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="rejectionJustification" rows="5" placeholder="Detalle los motivos fundados del rechazo conforme a los criterios del CEISH..."></textarea>
                    </mat-form-field>
                  </div>
                </ng-container>

                <!-- Approval Fields -->
                <ng-container *ngIf="form.get('resolutionType')?.value === 'APPROVAL'">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="field-label">Vigencia de la Aprobación</label>
                      <mat-form-field appearance="outline" class="full-width custom-field">
                        <input matInput type="number" formControlName="validityMonths">
                        <span matSuffix class="pe-3">meses</span>
                      </mat-form-field>
                    </div>
                    <div class="col-md-6">
                      <label class="field-label">Periodicidad de Informes de Seguimiento</label>
                      <mat-form-field appearance="outline" class="full-width custom-field">
                        <input matInput type="number" formControlName="reportPeriodicityMonths">
                        <span matSuffix class="pe-3">meses</span>
                      </mat-form-field>
                    </div>
                  </div>
                </ng-container>
              </div>

              <!-- Upload and Submit Section -->
              <mat-divider class="my-4" *ngIf="form.get('resolutionType')?.value"></mat-divider>
              
              <div class="row align-items-center g-3" *ngIf="form.get('resolutionType')?.value">
                <div class="col-md-7">
                  <div class="file-upload-zone p-3 border rounded text-center" style="border-style: dashed !important; background: #fafafa; border-color: #cbd5e1; border-radius: 12px;">
                    <mat-icon style="font-size: 28px; width: 28px; height: 28px; color: #94a3b8;">upload_file</mat-icon>
                    <p class="small text-muted mb-2" *ngIf="!selectedFile()" style="font-size: 0.75rem;">Cargue el Acta PDF Firmada (Anexo 12/Anexo 15)</p>
                    <p class="small text-success fw-bold mb-2" *ngIf="selectedFile()" style="font-size: 0.75rem;">📄 {{ selectedFile()?.name }}</p>
                    <button type="button" mat-stroked-button color="primary" class="btn-sm" style="line-height: 28px; height: 28px; font-size: 0.7rem; font-weight: 700;" (click)="fileInput.click()">
                      Seleccionar PDF
                    </button>
                    <input #fileInput type="file" (change)="onFileSelected($event)" accept="application/pdf" style="display: none;" />
                  </div>
                </div>
                
                <div class="col-md-5">
                  <button type="button" mat-flat-button class="w-100 emit-btn" 
                          [disabled]="form.invalid || isSubmitting()"
                          (click)="onEmitResolution()">
                    <mat-icon>draw</mat-icon>
                    {{ isSubmitting() ? 'Procesando...' : 'Firmar y Notificar' }}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .consolidation-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .breadcrumb { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .protocol-badge { background: #003366; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; }
    .page-title { font-size: 2rem; font-weight: 900; color: #1e293b; margin: 0.25rem 0; }
    .page-subtitle { font-size: 1rem; color: #64748b; margin: 0; font-style: italic; }

    .summary-card { background: white; border-radius: 24px; border: 1px solid #e2e8f0; position: sticky; top: 100px; }
    
    .unanimity-indicator {
      display: flex; gap: 12px; padding: 1.5rem; border-radius: 16px; align-items: center;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
      &.unanimous { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      &.discrepancy { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
      strong { font-size: 1rem; display: block; line-height: 1.2; }
      p { margin: 0; font-size: 0.75rem; font-weight: 600; }
    }

    .traffic-light-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .light-item { display: flex; align-items: center; gap: 1rem; opacity: 0.3; transition: all 0.3s;
      &.active { opacity: 1; }
      .light { width: 22px; height: 22px; border-radius: 50%; }
      .green { background: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.4); }
      .yellow { background: #f59e0b; box-shadow: 0 0 15px rgba(245,158,11,0.4); }
      .red { background: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.4); }
      .light-text { display: flex; flex-direction: column; .count { font-size: 1.75rem; font-weight: 900; line-height: 1; color: #1e293b; } .label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; } }
    }

    .matrix-card { background: white; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
    .comparison-matrix {
      width: 100%; border-collapse: collapse;
      th { padding: 1.25rem; font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 2px solid #f1f5f9; }
      td { padding: 1.25rem; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .evaluator-name { strong { color: #1e293b; font-size: 0.95rem; } }
    }

    .badge-verdict {
      padding: 4px 12px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      &.aprobado { background: #dcfce7; color: #166534; }
      &.no_aprobado { background: #fee2e2; color: #991b1b; }
      &.con_observaciones, &.aprobado_condicionado { background: #fef3c7; color: #92400e; }
    }

    .status-ok { color: #10b981; }
    .status-warn { color: #f59e0b; }
    .status-err { color: #ef4444; }

    .obs-timeline { display: flex; flex-direction: column; gap: 1rem; }
    .obs-item { 
      background: #f8fafc; 
      padding: 1.25rem; 
      border-radius: 12px; 
      border: 1px solid #e2e8f0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      
      .obs-author { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .obs-text { font-size: 0.9rem; color: #1e293b; line-height: 1.4; }
    }
    
    .obs-item:hover {
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      border-color: #cbd5e1;
    }
 
    .btn-finalize { 
      background: #003366 !important; 
      color: white !important; 
      height: 54px; 
      border-radius: 12px; 
      font-weight: 800;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .btn-finalize:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
    }

    .content-card {
      background: white;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      mat-icon { color: #003366; }
      h3 { font-size: 1.25rem; color: #1e293b; }
    }

    .field-label { 
      display: block; 
      font-size: 0.8rem; 
      font-weight: 700; 
      color: #334155; 
      margin-bottom: 8px; 
    }

    ::ng-deep .custom-field {
      width: 100%;
      .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 12px !important;
      }
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing {
        border-color: transparent !important;
      }
    }

    .emit-btn {
      height: 54px;
      background: #10b981 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
    }

    .section-sub-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #475569;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .doc-download-row {
      display: flex;
      justify-content: center;
      gap: 6px;
      button {
        width: 34px;
        height: 34px;
        line-height: 34px;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }
  `]
})
export class EvaluationConsolidationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  
  private evalRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private resolutionRepo = inject(IResolutionRepositoryPort);
  private s3StorageService = inject(S3StorageService);
  private notificationBroker = inject(NotificationBrokerService);
  private destroyRef = inject(DestroyRef);

  protocolId = '';
  protocol = signal<any>(null);
  evaluations = signal<any[]>([]);
  isUnanimous = signal(true);
  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);

  form: FormGroup = this.fb.group({
    resolutionType: ['', Validators.required],
    // Conditional
    majorObservations: [''],
    minorObservations: [''],
    correctionProcedure: [''],
    deadlineDays: [30],
    // Rejection
    rejectionJustification: [''],
    // Approval
    validityMonths: [12],
    reportPeriodicityMonths: [6]
  });

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    this.loadConsolidation();

    this.form.get('resolutionType')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  loadConsolidation() {
    // 1. Obtener datos del protocolo para el encabezado
    this.protocolRepo.getById(this.protocolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.protocol.set(p));
 
    // 2. Consumir el nuevo endpoint de Consolidación (Anexo 12)
    this.evalRepo.consolidateEvaluation(this.protocolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = res.data || res;
          const rawList = Array.isArray(data.evaluations) ? data.evaluations : [];
          const normalized = rawList.map((ev: any) => ({
            ...ev,
            verdict: ev.verdict || ev.result || 'APROBADO',
            ethicsResult: ev.ethicsResult || ev.ethicalAspects || ev.result || 'APROBADO',
            methodologyResult: ev.methodologyResult || ev.methodologicalAspects || ev.result || 'APROBADO',
            legalResult: ev.legalResult || ev.legalAspects || ev.result || 'APROBADO',
            evaluatorProfile: ev.evaluatorProfile || 'Evaluador',
            evaluatorName: ev.evaluatorName || ('Evaluador #' + (ev.evaluatorId || ev.id || ''))
          }));
          this.evaluations.set(normalized);
          this.isUnanimous.set(data.isUnanimous ?? true);
        },
        error: (err) => {
          this.snackBar.open('❌ Error al cargar la consolidación', 'Cerrar');
        }
      });
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.snackBar.open('⚠️ Solo se permiten archivos PDF.', 'Cerrar', { duration: 3000 });
        return;
      }
      this.selectedFile.set(file);
    }
  }

  getResolutionLabel(type: string): string {
    const labels: any = {
      'APPROVAL': 'Aprobación Definitiva',
      'CONDITIONAL': 'Aprobación con Observaciones',
      'REJECTION': 'No Aprobación / Rechazado'
    };
    return labels[type] || '';
  }

  private updateValidators(type: string) {
    ['majorObservations', 'rejectionJustification', 'correctionProcedure'].forEach(control => {
      this.form.get(control)?.clearValidators();
      this.form.get(control)?.updateValueAndValidity();
    });

    if (type === 'CONDITIONAL') {
      this.form.get('majorObservations')?.setValidators([Validators.required]);
      this.form.get('correctionProcedure')?.setValidators([Validators.required]);
    } else if (type === 'REJECTION') {
      this.form.get('rejectionJustification')?.setValidators([Validators.required, Validators.minLength(20)]);
    }
    
    this.form.updateValueAndValidity();
  }

  onProceedToResolution() {
    const el = document.querySelector('.dictamen-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onEmitResolution() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formValue = this.form.value;
      const protocolIdNum = Number(this.protocolId);

      // 1. Generar la key/ruta en R2
      const s3Key = `protocols/${protocolIdNum}/resolutions/Carta_Resolucion_Consolidada.pdf`;
      const fileToUpload = this.selectedFile() || new File([new Blob(['Acta de Resolución Consolidada'], { type: 'application/pdf' })], 'Carta_Resolucion_Consolidada.pdf', { type: 'application/pdf' });

      // 2. Solicitar URL firmada y subir a R2
      this.s3StorageService.getUploadUrl(s3Key, 'application/pdf').pipe(
        switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter(upRes => upRes.success),
          map(() => urlRes.key)
        )),
        switchMap(uploadedKey => {
          let resolutionTypeId = 1; // Aprobación Definitiva
          if (formValue.resolutionType === 'CONDITIONAL') resolutionTypeId = 2; // Aprobado con Observaciones / Subsanación
          if (formValue.resolutionType === 'REJECTION') resolutionTypeId = 3; // Rechazado

          const payload = {
            protocolId: protocolIdNum,
            resolutionTypeId: resolutionTypeId,
            validityYears: formValue.validityMonths ? Math.round(formValue.validityMonths / 12) : 1,
            followUpPeriodDays: formValue.reportPeriodicityMonths ? formValue.reportPeriodicityMonths * 30 : 180,
            majorObservations: formValue.majorObservations || formValue.rejectionJustification || '',
            minorObservations: formValue.minorObservations || '',
            correctionProcedure: formValue.resolutionType === 'CONDITIONAL' ? formValue.correctionProcedure : '',
            pdfLetterPath: uploadedKey,
            resolutionLabel: this.getResolutionLabel(formValue.resolutionType)
          };

          return this.resolutionRepo.submitResolution(payload);
        })
      ).subscribe({
        next: (res) => {
          this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', { duration: 5000 });
          
          let finalStatus = ProtocolStatus.APPROVED;
          if (formValue.resolutionType === 'REJECTION') finalStatus = ProtocolStatus.REJECTED;
          if (formValue.resolutionType === 'CONDITIONAL') finalStatus = ProtocolStatus.OBSERVED;

          this.notificationBroker.publish('PROTOCOL_STATUS_UPDATED', {
            protocolId: this.protocolId,
            status: finalStatus
          });

          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard/home']);
        },
        error: (err) => {
          console.error('[ConsolidationPage] Error al emitir resolución:', err);
          if (err.status === 409) {
            this.snackBar.open('⚠️ El expediente de este protocolo ya ha sido versionado o modificado por otra transacción concurrente. Por favor, recargue la página.', 'Cerrar', { duration: 8000 });
          } else {
            this.snackBar.open('❌ Error al registrar el dictamen consolidado.', 'Cerrar', { duration: 5000 });
          }
          this.isSubmitting.set(false);
        }
      });
    }
  }

  countVerdict(verdict: string): number {
    return this.evaluations().filter(e => e.verdict === verdict).length;
  }

  getStatusIcon(result: string): string {
    if (result === 'APROBADO') return 'check_circle';
    if (result === 'NO_APROBADO') return 'cancel';
    return 'error';
  }

  getStatusClass(result: string): string {
    if (result === 'APROBADO') return 'status-ok';
    if (result === 'NO_APROBADO') return 'status-err';
    return 'status-warn';
  }

  downloadEvaluatorPdf(evaluationId: any) {
    if (!evaluationId) return;
    this.evalRepo.getDocumentDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el PDF.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el PDF de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }

  downloadEvaluatorDocx(evaluationId: any) {
    if (!evaluationId) return;
    this.evalRepo.getDocxDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el Word DOCX.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el Word DOCX de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }
}
