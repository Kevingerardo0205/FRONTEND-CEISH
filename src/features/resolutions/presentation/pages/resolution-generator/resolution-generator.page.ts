import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, filter, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

@Component({
  selector: 'app-resolution-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Header Seccion -->
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Presidenta / Resoluciones</div>
          <h1 class="page-title">Generador de Resoluciones</h1>
          <p class="page-subtitle">Emisión de dictámenes oficiales y anexos institucionales</p>
        </div>
      </div>

      <div class="generator-layout">
        <!-- Form Section -->
        <main class="form-section">
          <form [formGroup]="form" class="content-card shadow-soft p-4">
            <header class="section-header mb-4">
              <mat-icon>settings_suggest</mat-icon>
              <h3>Configuración del Documento</h3>
            </header>
            
            <div class="row g-3">
              <div class="col-md-6">
                <label class="field-label">Protocolo a Resolver</label>
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <mat-select formControlName="protocolId" placeholder="Seleccione un protocolo">
                    <mat-option value="2026-IO-001">2026-IO-001: Impacto COVID-19</mat-option>
                    <mat-option value="2026-EC-002">2026-EC-002: Ensayo Clínico Vacuna X</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="col-md-6">
                <label class="field-label">Tipo de Resolución</label>
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <mat-select formControlName="resolutionType" placeholder="Seleccione el tipo de anexo">
                    <mat-option value="APPROVAL">Aprobación Definitiva (Anexos 13/14)</mat-option>
                    <mat-option value="CONDITIONAL">Aprobación Condicionada (Anexo 15)</mat-option>
                    <mat-option value="REJECTION">No Aprobación (Anexo 16)</mat-option>
                    <mat-option value="EXEMPTION">Exención de Revisión (Anexo 12)</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Dynamic Fields Section -->
            <div class="dynamic-fields animate-slide-up" *ngIf="form.get('resolutionType')?.value">
              <h4 class="section-sub-title mb-3">
                <mat-icon>edit_note</mat-icon>
                Campos Específicos del Dictamen
              </h4>
              
              <!-- Conditional Fields -->
              <ng-container *ngIf="form.get('resolutionType')?.value === 'CONDITIONAL'">
                <div class="field-group mb-3">
                  <label class="field-label">Observaciones Mayores</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <textarea matInput formControlName="majorObservations" rows="3" placeholder="Detalle las correcciones obligatorias..."></textarea>
                  </mat-form-field>
                </div>
                <div class="field-group mb-3">
                  <label class="field-label">Observaciones Menores</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <textarea matInput formControlName="minorObservations" rows="3" placeholder="Sugerencias de mejora..."></textarea>
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
                <div class="field-group">
                  <label class="field-label">Justificación Ética y Metodológica</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <textarea matInput formControlName="rejectionJustification" rows="6" placeholder="Detalle los motivos del rechazo conforme a la normativa..."></textarea>
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
                    <label class="field-label">Periodicidad de Informes</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <input matInput type="number" formControlName="reportPeriodicityMonths">
                      <span matSuffix class="pe-3">meses</span>
                    </mat-form-field>
                  </div>
                </div>
              </ng-container>
            </div>
          </form>
        </main>

        <!-- Preview Section -->
        <aside class="preview-section">
          <div class="content-card shadow-soft p-4 sticky-preview">
            <h4 class="preview-title">
              <mat-icon>visibility</mat-icon>
              Vista Previa y Emisión
            </h4>
            
            <div class="document-preview-placeholder">
              <div class="preview-art">
                <mat-icon>picture_as_pdf</mat-icon>
                <div class="pulse-ring"></div>
              </div>
              <p *ngIf="!form.get('resolutionType')?.value" class="text-muted">Seleccione un tipo de resolución para generar el borrador PDF</p>
              <div *ngIf="form.get('resolutionType')?.value" class="active-preview-info">
                <span class="doc-type">{{ getResolutionLabel(form.get('resolutionType')?.value) }}</span>
                <span class="doc-target">Protocolo: {{ form.get('protocolId')?.value }}</span>
              </div>
            </div>

            <!-- Carga de Acta Firmada Real -->
            <div class="file-upload-zone mt-3 p-3 border rounded text-center" style="border-style: dashed !important; background: #fafafa; border-radius: 12px; border-color: #cbd5e1;">
              <mat-icon style="font-size: 28px; width: 28px; height: 28px; color: #94a3b8;">upload_file</mat-icon>
              <p class="small text-muted mb-2" *ngIf="!selectedFile()" style="font-size: 0.75rem;">Cargue el Acta PDF Firmada (Anexo 12/Anexo 15)</p>
              <p class="small text-success fw-bold mb-2" *ngIf="selectedFile()" style="font-size: 0.75rem;">📄 {{ selectedFile()?.name }}</p>
              <button type="button" mat-stroked-button color="primary" class="btn-sm" style="line-height: 28px; height: 28px; font-size: 0.7rem; font-weight: 700;" (click)="fileInput.click()">
                Seleccionar PDF
              </button>
              <input #fileInput type="file" (change)="onFileSelected($event)" accept="application/pdf" style="display: none;" />
            </div>

            <div class="preview-actions d-flex flex-column gap-3 mt-4">
              <button type="button" mat-stroked-button color="primary" class="preview-btn" [disabled]="form.invalid || isSubmitting()">
                <mat-icon>open_in_new</mat-icon>
                Visualizar Borrador
              </button>
              <button type="button" mat-flat-button class="emit-btn" 
                      [disabled]="form.invalid || isSubmitting()"
                      (click)="onGenerate()">
                <mat-icon>draw</mat-icon>
                {{ isSubmitting() ? 'Procesando...' : 'Firmar y Notificar' }}
              </button>
            </div>

            <div class="security-note mt-3">
              <mat-icon>security</mat-icon>
              <span>Al emitir, se generará una firma electrónica vinculada a su perfil de Presidenta.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1rem; }

    .breadcrumb-chip {
      background: rgba(0, 51, 102, 0.05);
      color: #003366;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .page-title { font-size: 1.85rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .page-subtitle { color: #64748b; font-size: 0.95rem; }

    .generator-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .content-card {
      background: white;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon { color: #003366; }
      h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; }
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

    .sticky-preview {
      position: sticky;
      top: 1rem;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1.5rem;
      mat-icon { color: #003366; }
    }

    .document-preview-placeholder {
      background: #f8fafc;
      border: 2px dashed #e2e8f0;
      border-radius: 20px;
      padding: 2.5rem 1.5rem;
      text-align: center;

      .preview-art {
        position: relative;
        width: 64px;
        height: 64px;
        background: white;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        mat-icon { font-size: 32px; width: 32px; height: 32px; color: #ef4444; }
      }

      .active-preview-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
        .doc-type { font-weight: 800; color: #1e293b; font-size: 0.95rem; }
        .doc-target { font-size: 0.8rem; color: #64748b; font-weight: 600; }
      }
    }

    .preview-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      border-width: 2px;
    }

    .emit-btn {
      height: 52px;
      background: #10b981 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
    }

    .security-note {
      display: flex;
      gap: 8px;
      background: #fffbeb;
      padding: 12px;
      border-radius: 12px;
      color: #92400e;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.4;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1100px) {
      .generator-layout { grid-template-columns: 1fr; }
      .sticky-preview { position: static; }
    }
  `]
})
export class ResolutionGeneratorPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private resolutionRepo = inject(IResolutionRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private s3StorageService = inject(S3StorageService);

  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);

  form: FormGroup = this.fb.group({
    protocolId: ['', Validators.required],
    resolutionType: ['', Validators.required],
    // Conditional
    majorObservations: [''],
    minorObservations: [''],
    deadlineDays: [30],
    // Rejection
    rejectionJustification: [''],
    // Approval
    validityMonths: [12],
    reportPeriodicityMonths: [6]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['protocolId']) {
        this.form.get('protocolId')?.setValue(params['protocolId']);
      }
    });

    this.form.get('resolutionType')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
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
      'CONDITIONAL': 'Aprobación Condicionada',
      'REJECTION': 'No Aprobación',
      'EXEMPTION': 'Exención de Revisión'
    };
    return labels[type] || '';
  }

  private updateValidators(type: string) {
    ['majorObservations', 'rejectionJustification'].forEach(control => {
      this.form.get(control)?.clearValidators();
      this.form.get(control)?.updateValueAndValidity();
    });

    if (type === 'CONDITIONAL') {
      this.form.get('majorObservations')?.setValidators([Validators.required]);
    } else if (type === 'REJECTION') {
      this.form.get('rejectionJustification')?.setValidators([Validators.required, Validators.minLength(20)]);
    }
    
    this.form.updateValueAndValidity();
  }

  onGenerate() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formValue = this.form.value;

      // 1. Generar la ruta/key para el Acta Consolidada
      const protocolIdNum = Number(formValue.protocolId);
      const s3Key = `protocols/${protocolIdNum}/resolutions/Carta_Resolucion_Consolidada.pdf`;
      
      // Si el usuario no cargó un archivo, creamos uno mock
      const fileToUpload = this.selectedFile() || new File([new Blob(['Acta de Resolución'], { type: 'application/pdf' })], 'Carta_Resolucion_Consolidada.pdf', { type: 'application/pdf' });

      // 2. Solicitar URL firmada y realizar la subida a Cloudflare R2
      this.s3StorageService.getUploadUrl(s3Key, 'application/pdf').pipe(
        switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter(upRes => upRes.success),
          map(() => urlRes.key)
        )),
        switchMap(uploadedKey => {
          // Map resolution type to backend resolutionTypeId
          let resolutionTypeId = 1; // Aprobación Definitiva
          if (formValue.resolutionType === 'CONDITIONAL') resolutionTypeId = 4; // Pendiente de subsanación
          if (formValue.resolutionType === 'REJECTION') resolutionTypeId = 2; // No aprobado / rechazado
          if (formValue.resolutionType === 'EXEMPTION') resolutionTypeId = 3; // Exención de revisión

          const payload = {
            protocolId: protocolIdNum,
            resolutionTypeId: resolutionTypeId,
            validityYears: formValue.validityMonths ? Math.round(formValue.validityMonths / 12) : 1,
            followUpPeriodDays: formValue.reportPeriodicityMonths ? formValue.reportPeriodicityMonths * 30 : 180,
            majorObservations: formValue.majorObservations || formValue.rejectionJustification || '',
            minorObservations: formValue.minorObservations || '',
            correctionProcedure: formValue.resolutionType === 'CONDITIONAL' ? 'Subir los anexos correspondientes corregidos en la sección de Subsanación en formato PDF.' : '',
            pdfLetterPath: uploadedKey,
            resolutionLabel: this.getResolutionLabel(formValue.resolutionType)
          };

          return this.resolutionRepo.submitResolution(payload);
        })
      ).subscribe({
        next: (res) => {
          this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', { duration: 5000 });
          
          // Map resolution type to final status for local event broker
          let finalStatus = ProtocolStatus.APPROVED;
          if (formValue.resolutionType === 'REJECTION') finalStatus = ProtocolStatus.REJECTED;
          if (formValue.resolutionType === 'CONDITIONAL') finalStatus = ProtocolStatus.OBSERVED;

          this.notificationBroker.publish('PROTOCOL_STATUS_UPDATED', {
            protocolId: formValue.protocolId,
            status: finalStatus
          });

          this.form.reset();
          this.selectedFile.set(null);
          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard/home']);
        },
        error: (err) => {
          console.error('Error submitting resolution:', err);
          this.snackBar.open('❌ Error al procesar la resolución', 'Cerrar', { duration: 5000 });
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
