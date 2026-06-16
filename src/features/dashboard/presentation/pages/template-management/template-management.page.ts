import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { switchMap, filter, map } from 'rxjs/operators';

import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

@Component({
  selector: 'app-template-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-admin-container animate-fade-in">
      
      <header class="main-header mb-4">
        <div class="header-info">
          <div class="breadcrumb-chip">Administración / Plantillas</div>
          <h1>Configuración de Plantillas</h1>
          <p>Gestione los formatos de documentos y anexos dinámicos en Cloudflare R2</p>
        </div>
      </header>

      <!-- KPI Section -->
      <section class="kpi-grid mb-5">
        <div class="stat-card shadow-soft p-4" style="border-left: 4px solid #003366;">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box" style="background: rgba(0, 51, 102, 0.05); color: #003366;">
              <mat-icon>folder</mat-icon>
            </div>
            <div>
              <span class="label text-muted small fw-bold text-uppercase">Total Plantillas</span>
              <h3 class="fw-bold m-0 mt-1">{{ templates().length }}</h3>
            </div>
          </div>
        </div>

        <div class="stat-card shadow-soft p-4" style="border-left: 4px solid #10b981;">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box" style="background: rgba(16, 185, 129, 0.05); color: #10b981;">
              <mat-icon>cloud_done</mat-icon>
            </div>
            <div>
              <span class="label text-muted small fw-bold text-uppercase">Con Archivo Asociado</span>
              <h3 class="fw-bold m-0 mt-1">{{ activeTemplatesCount() }}</h3>
            </div>
          </div>
        </div>

        <div class="stat-card shadow-soft p-4" style="border-left: 4px solid #ef4444;">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box" style="background: rgba(239, 68, 68, 0.05); color: #ef4444;">
              <mat-icon>cloud_off</mat-icon>
            </div>
            <div>
              <span class="label text-muted small fw-bold text-uppercase">Sin Archivo (.docx)</span>
              <h3 class="fw-bold m-0 mt-1">{{ templates().length - activeTemplatesCount() }}</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Layout -->
      <div class="management-layout">
        <!-- Templates List -->
        <main class="table-section shadow-soft p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="section-title">Listado de Plantillas de Base</h2>
            <div class="spinner-placeholder" *ngIf="isUploading()">
              <div class="d-flex align-items-center gap-2 text-primary small fw-bold">
                <mat-icon class="spin-animation">sync</mat-icon>
                <span>Subiendo plantilla...</span>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="templates-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre descriptivo</th>
                  <th>Ruta del Archivo</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of templates()">
                  <td class="fw-bold text-dark">{{ t.code }}</td>
                  <td>{{ t.name }}</td>
                  <td>
                    <span *ngIf="t.filePath" class="badge-path" [matTooltip]="t.filePath">
                      <mat-icon style="font-size: 14px; width:14px; height:14px;">link</mat-icon>
                      {{ t.filePath.split('/').pop() }}
                    </span>
                    <span *ngIf="!t.filePath" class="badge-no-file">
                      Sin archivo (.docx)
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="actions-row">
                      <button mat-icon-button color="primary" (click)="triggerUpload(t.code)" matTooltip="Subir/Actualizar archivo (.docx)">
                        <mat-icon>upload_file</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" [disabled]="!t.filePath" (click)="downloadFile(t.code)" matTooltip="Descargar Plantilla Actual">
                        <mat-icon>download</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="templates().length === 0">
                  <td colspan="4" class="text-center text-muted py-4">
                    No existen plantillas registradas en el sistema.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        <!-- Form Sidebar -->
        <aside class="form-section">
          <div class="content-card shadow-soft p-4">
            <header class="section-header mb-4">
              <mat-icon>post_add</mat-icon>
              <h3>Nueva Plantilla</h3>
            </header>
            <p class="small text-muted mb-4">Registre el código y nombre de la nueva plantilla. Posteriormente podrá asociarle el archivo Word (.docx).</p>

            <form [formGroup]="form" (ngSubmit)="onCreateTemplate()">
              <div class="mb-3">
                <label class="field-label">Código de Plantilla (MAYÚSCULAS)</label>
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <input matInput formControlName="code" placeholder="E.g. ACTA_APROBACION" (input)="onCodeInput($event)">
                  <mat-error *ngIf="form.get('code')?.hasError('pattern')">Solo letras, números y guiones bajos.</mat-error>
                </mat-form-field>
              </div>

              <div class="mb-3">
                <label class="field-label">Nombre / Descripción</label>
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <input matInput formControlName="name" placeholder="E.g. Acta de Aprobación de Protocolo">
                </mat-form-field>
              </div>

              <button mat-flat-button color="primary" class="w-100 py-3 mt-3" style="border-radius: 12px; font-weight: 800;" [disabled]="form.invalid || isSubmitting()">
                {{ isSubmitting() ? 'Registrando...' : 'Registrar Plantilla' }}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>

    <!-- Hidden File Input for uploads -->
    <input #fileInput type="file" (change)="onFileSelected($event)" accept=".docx" style="display: none;" />
  `,
  styles: [`
    .dashboard-admin-container {
      padding: 2.5rem;
      background-color: #f8fafc;
      min-height: 100vh;
    }
    .main-header {
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
        margin-bottom: 0.75rem;
      }
      h1 { font-size: 2.25rem; font-weight: 900; color: #1e293b; margin: 0; letter-spacing: -1px; }
      p { color: #64748b; font-size: 1.1rem; margin-top: 0.25rem; font-weight: 500; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }
    .stat-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      .icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon { font-size: 24px; width: 24px; height: 24px; }
      }
    }

    .management-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .table-section {
      background: white;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
    }

    .section-title { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0; }

    .templates-table {
      width: 100%;
      border-collapse: collapse;
      th {
        padding: 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 800;
        border-bottom: 2px solid #f1f5f9;
        text-align: left;
      }
      td {
        padding: 1rem;
        font-size: 0.85rem;
        color: #475569;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }
    }

    .badge-path {
      background: #f0fdf4;
      color: #166534;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-no-file {
      background: #fee2e2;
      color: #991b1b;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .actions-row {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .form-section {
      position: sticky;
      top: 2rem;
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
      color: #003366;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
      h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
    }

    .field-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
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

    .spin-animation {
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1100px) {
      .management-layout { grid-template-columns: 1fr; }
      .form-section { position: relative; top: 0; }
    }
  `]
})
export class TemplateManagementPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private documentRepo = inject(IDocumentRepositoryPort);
  private s3StorageService = inject(S3StorageService);

  templates = signal<any[]>([]);
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadTargetCode = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
    name: ['', Validators.required]
  });

  activeTemplatesCount = computed(() => {
    return this.templates().filter(t => !!t.filePath).length;
  });

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.documentRepo.getTemplates().subscribe({
      next: (list) => {
        this.templates.set(list || []);
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.snackBar.open('❌ Error al cargar la lista de plantillas.', 'Cerrar');
      }
    });
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    this.form.get('code')?.setValue(input.value, { emitEvent: false });
  }

  onCreateTemplate() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const formValue = this.form.value;

      this.documentRepo.createTemplateMetadata(formValue.code, formValue.name).subscribe({
        next: () => {
          this.snackBar.open('✅ Metadatos de la plantilla creados con éxito.', 'Cerrar', { duration: 4000 });
          this.form.reset();
          this.isSubmitting.set(false);
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Error creating template:', err);
          this.snackBar.open('❌ Error al registrar metadatos de la plantilla.', 'Cerrar');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  triggerUpload(code: string) {
    this.uploadTargetCode.set(code);
    const hiddenFileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (hiddenFileInput) {
      hiddenFileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    const code = this.uploadTargetCode();

    if (!file || !code) return;

    if (file.name.split('.').pop()?.toLowerCase() !== 'docx') {
      this.snackBar.open('⚠️ Solo se permiten archivos Word (.docx).', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isUploading.set(true);
    const s3Key = `templates/${code.toLowerCase()}_template.docx`;

    // 1. Obtener URL firmada
    this.s3StorageService.getUploadUrl(s3Key, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').pipe(
      // 2. Subir a S3
      switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
        filter(upRes => upRes.success),
        map(() => urlRes.key)
      )),
      // 3. Asociar en base de datos
      switchMap(uploadedKey => this.documentRepo.associateTemplateFile(code, uploadedKey))
    ).subscribe({
      next: () => {
        this.snackBar.open(`✅ Archivo .docx asociado con éxito a la plantilla ${code}.`, 'Cerrar', { duration: 5000 });
        this.isUploading.set(false);
        this.uploadTargetCode.set(null);
        this.loadTemplates();
        event.target.value = ''; // Reset input file
      },
      error: (err) => {
        console.error('Error uploading template file:', err);
        this.snackBar.open('❌ Error al subir y asociar el archivo de la plantilla.', 'Cerrar');
        this.isUploading.set(false);
        this.uploadTargetCode.set(null);
        event.target.value = ''; // Reset input file
      }
    });
  }

  downloadFile(code: string) {
    this.documentRepo.downloadTemplate(code).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          window.open(`/api/documents/templates/${code}/download`, '_blank');
        }
      },
      error: () => {
        window.open(`/api/documents/templates/${code}/download`, '_blank');
      }
    });
  }
}
