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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, filter, map } from 'rxjs/operators';

import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
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
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      
      <!-- VISTA A: BANDEJA DE PROTOCOLOS EVALUADOS -->
      <ng-container *ngIf="!selectedProtocol()">
        <header class="page-header mb-4">
          <div class="title-section">
            <div class="breadcrumb-chip">CEISH / Secretaría / Resoluciones</div>
            <h1 class="page-title">Bandeja de Resoluciones</h1>
            <p class="page-subtitle">Protocolos con evaluaciones de pares completadas listos para dictamen final</p>
          </div>
        </header>

        <main class="content-card shadow-soft p-4">
          <div class="table-responsive">
            <table class="w-100 tray-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título del Protocolo</th>
                  <th>Investigador Principal</th>
                  <th>Fecha de Recepción</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of pendingProtocols()">
                  <td class="fw-bold text-primary">{{ p.code || ('PRT-' + p.id) }}</td>
                  <td class="protocol-title-cell" [matTooltip]="p.title">{{ p.title }}</td>
                  <td>{{ p.principalInvestigator || 'No asignado' }}</td>
                  <td>{{ p.submissionDate | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="text-center">
                    <span class="badge-status-evaluado">EVALUADO</span>
                  </td>
                  <td class="text-center">
                    <button mat-flat-button color="primary" class="emit-action-btn" (click)="onSelectProtocol(p)">
                      <mat-icon>gavel</mat-icon>
                      <span>Emitir Dictamen</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="pendingProtocols().length === 0">
                  <td colspan="6" class="text-center text-muted py-5">
                    <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 8px;">inbox</mat-icon>
                    <p class="m-0 fw-bold">No hay protocolos pendientes de resolución consolidada</p>
                    <p class="small text-muted">Los protocolos aparecerán aquí cuando todos sus evaluadores asignados finalicen sus informes.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </ng-container>

      <!-- VISTA B: GENERADOR COMPLETO DE RESOLUCIÓN -->
      <ng-container *ngIf="selectedProtocol()">
        <!-- Header Seccion con botón de retorno -->
        <div class="page-header d-flex align-items-center gap-3 mb-4">
          <button mat-icon-button class="back-btn" (click)="onClearSelection()" matTooltip="Volver a la bandeja">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <div class="breadcrumb-chip">CEISH / Secretaría / Resoluciones / Emisión</div>
            <h1 class="page-title">Emitir Resolución Consolidada</h1>
            <p class="page-subtitle">{{ selectedProtocol()?.title }}</p>
          </div>
          <span class="protocol-badge ms-auto">{{ selectedProtocol()?.code || ('PRT-' + selectedProtocol()?.id) }}</span>
        </div>

        <div class="generator-layout animate-slide-up">
          <!-- Form Section -->
          <main class="form-section">
            <form [formGroup]="form" class="content-card shadow-soft p-4">
              <header class="section-header mb-4">
                <mat-icon>settings_suggest</mat-icon>
                <h3>Configuración de la Resolución</h3>
              </header>
              
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="field-label">Vigencia (Años)</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <input matInput type="number" formControlName="validityYears">
                  </mat-form-field>
                </div>

                <div class="col-md-6">
                  <label class="field-label">Periodo Seguimiento (Días)</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <input matInput type="number" formControlName="followUpPeriodDays">
                  </mat-form-field>
                </div>
              </div>

              <mat-divider class="my-4"></mat-divider>

              <!-- Consolidated Observations -->
              <div class="field-group mb-3">
                <label class="field-label">Observaciones Consolidadas del Comité</label>
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <textarea matInput formControlName="observations" rows="8" placeholder="Detalle la fundamentación y observaciones del comité ético-científico para la resolución consolidada..."></textarea>
                </mat-form-field>
              </div>
            </form>

            <!-- LISTA DE INFORMES DE EVALUADORES (INSUMO DE REDACCIÓN) -->
            <div class="content-card shadow-soft p-4 mt-4" *ngIf="evaluationsList().length > 0">
              <header class="section-header mb-3 d-flex align-items-center gap-2">
                <mat-icon color="primary">rate_review</mat-icon>
                <h3 class="m-0">Informes de Evaluadores (Insumo)</h3>
              </header>
              <p class="small text-muted mb-3">Descargue los informes oficiales individuales subidos por cada uno de los evaluadores de la versión activa.</p>
              
              <div class="table-responsive">
                <table class="w-100 table-evaluations">
                  <thead>
                    <tr style="border-bottom: 2px solid #f1f5f9; text-align: left; font-size: 0.75rem; color: #64748b; font-weight: 800;">
                      <th style="padding: 10px 8px; text-transform: uppercase;">Evaluador</th>
                      <th style="padding: 10px 8px; text-transform: uppercase; text-align: center;">Dictamen Par</th>
                      <th style="padding: 10px 8px; text-transform: uppercase;">Observaciones</th>
                      <th style="padding: 10px 8px; text-transform: uppercase; text-align: right;">Descarga de Informe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ev of evaluationsList()" style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 8px; font-weight: bold; color: #1e293b; font-size: 0.85rem;">
                        Par Evaluador ({{ getProfileLabel(ev.evaluatorProfile?.name || ev.evaluatorProfile) }})
                      </td>
                      <td style="padding: 12px 8px; text-align: center;">
                        <span class="badge-result" [ngClass]="ev.verdict?.toLowerCase() || 'pendiente'">
                          {{ (ev.verdict || 'PENDIENTE').replace('_', ' ') }}
                        </span>
                      </td>
                      <td style="padding: 12px 8px; font-size: 0.8rem; color: #64748b; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [matTooltip]="ev.generalObservations || ev.observations">
                        {{ ev.generalObservations || ev.observations || 'Sin observaciones generales redactadas.' }}
                      </td>
                      <td style="padding: 12px 8px; text-align: right;">
                        <button type="button" mat-icon-button color="warn" (click)="downloadEvaluatorPdf(ev.id)" matTooltip="Descargar Reporte PDF">
                          <mat-icon style="font-size: 20px;">picture_as_pdf</mat-icon>
                        </button>
                        <button type="button" mat-icon-button color="primary" (click)="downloadEvaluatorDocx(ev.id)" matTooltip="Descargar Word DOCX">
                          <mat-icon style="font-size: 20px;">description</mat-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
                <div class="active-preview-info">
                  <span class="doc-type">Resolución Consolidada Automática</span>
                  <span class="doc-target">{{ selectedProtocol()?.code || ('PRT-' + selectedProtocol()?.id) }}</span>
                </div>
              </div>

              <!-- Carga de Carta Firmada Real -->
              <div class="file-upload-zone mt-3 p-3 border rounded text-center" style="border-style: dashed !important; background: #fafafa; border-radius: 12px; border-color: #cbd5e1;">
                <mat-icon style="font-size: 28px; width: 28px; height: 28px; color: #94a3b8;">upload_file</mat-icon>
                <p class="small text-muted mb-2" *ngIf="!selectedFile()" style="font-size: 0.75rem;">Cargue la Carta de Resolución PDF Firmada</p>
                <p class="small text-success fw-bold mb-2" *ngIf="selectedFile()" style="font-size: 0.75rem;">📄 {{ selectedFile()?.name }}</p>
                <button type="button" mat-stroked-button color="primary" class="btn-sm" style="line-height: 28px; height: 28px; font-size: 0.7rem; font-weight: 700;" (click)="fileInput.click()">
                  Seleccionar PDF
                </button>
                <input #fileInput type="file" (change)="onFileSelected($event)" accept="application/pdf" style="display: none;" />
              </div>

              <div class="preview-actions d-flex flex-column gap-3 mt-4">
                <button type="button" mat-flat-button class="emit-btn" 
                        [disabled]="form.invalid || isSubmitting()"
                        (click)="onGenerate()">
                  <mat-icon>draw</mat-icon>
                  {{ isSubmitting() ? 'Procesando...' : 'Firmar y Notificar' }}
                </button>
              </div>

              <div class="security-note mt-3">
                <mat-icon>security</mat-icon>
                <span>Al emitir, el backend determinará de manera automática el estado final del protocolo sumando los votos de los evaluadores.</span>
              </div>
            </div>
          </aside>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .breadcrumb-chip { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .page-title { font-size: 2rem; font-weight: 900; color: #1e293b; margin: 0.25rem 0; }
    .page-subtitle { font-size: 1rem; color: #64748b; margin: 0; font-style: italic; }

    .generator-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .content-card {
      background: white;
      border-radius: 24px;
      border: 1px solid #e2e8f0;
    }

    .tray-table {
      border-collapse: collapse;
      width: 100%;
      th {
        padding: 1.25rem 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 800;
        border-bottom: 2px solid #f1f5f9;
        text-align: left;
      }
      td {
        padding: 1.25rem 1rem;
        font-size: 0.9rem;
        color: #334155;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }
      tr:hover {
        background-color: #f8fafc;
      }
    }
    
    .protocol-title-cell {
      font-weight: 600;
      color: #1e293b;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-status-evaluado {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .emit-action-btn {
      border-radius: 10px;
      font-weight: 700;
      padding: 0 1.25rem;
      height: 40px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .back-btn {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
    }

    .protocol-badge {
      background: #003366;
      color: white;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #003366;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
      h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
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

    .badge-result {
      padding: 3px 10px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      &.aprobado { background: #dcfce7; color: #166534; }
      &.no_aprobado, &.rechazado { background: #fee2e2; color: #991b1b; }
      &.con_observaciones, &.aprobado_condicionado, &.pendiente_subsanacion { background: #fef3c7; color: #92400e; }
      &.pendiente { background: #f1f5f9; color: #475569; }
    }

    .table-evaluations {
      border-collapse: collapse;
      td { padding: 12px 8px; vertical-align: middle; }
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
  private protocolRepo = inject(IProtocolRepositoryPort);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private s3StorageService = inject(S3StorageService);

  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);

  pendingProtocols = signal<ProtocolEntity[]>([]);
  selectedProtocol = signal<ProtocolEntity | null>(null);
  evaluationsList = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    validityYears: [1, [Validators.required, Validators.min(1)]],
    followUpPeriodDays: [180, [Validators.required, Validators.min(1)]],
    observations: ['', Validators.required]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['protocolId']) {
        const pIdNum = Number(params['protocolId']);
        this.loadSelectedProtocol(String(pIdNum));
      } else {
        this.selectedProtocol.set(null);
        this.loadPendingProtocols();
      }
    });
  }

  loadPendingProtocols() {
    this.protocolRepo.getProtocolsByStatusId(14).subscribe({
      next: (list) => {
        this.pendingProtocols.set(list || []);
      },
      error: () => this.snackBar.open('❌ Error al cargar la bandeja de protocolos evaluados.', 'Cerrar')
    });
  }

  loadSelectedProtocol(id: string) {
    this.protocolRepo.getById(id).subscribe({
      next: (protocol) => {
        this.onSelectProtocol(protocol);
      },
      error: () => this.snackBar.open('❌ Error al cargar el protocolo seleccionado.', 'Cerrar')
    });
  }

  onSelectProtocol(protocol: ProtocolEntity) {
    this.selectedProtocol.set(protocol);
    this.form.patchValue({
      validityYears: 1,
      followUpPeriodDays: 180,
      observations: ''
    });
    this.selectedFile.set(null);

    // Cargar informes de evaluación asociados
    this.evaluationRepo.getByProtocolId(protocol.id).subscribe({
      next: (list) => {
        this.evaluationsList.set(list || []);
      },
      error: (err) => {
        console.error('Error al obtener evaluaciones del protocolo:', err);
        this.evaluationsList.set([]);
      }
    });
  }

  onClearSelection() {
    this.selectedProtocol.set(null);
    this.evaluationsList.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: null },
      queryParamsHandling: 'merge'
    });
    this.loadPendingProtocols();
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

  getProfileLabel(profile: string): string {
    if (!profile) return 'General';
    const profileStr = String(profile).toUpperCase();
    const map: any = {
      'METODOLOGIA': 'Metodológico',
      'BIOETICA': 'de Bioética',
      'LEGAL': 'de Aspectos Jurídicos'
    };
    return map[profileStr] || profile;
  }

  downloadEvaluatorPdf(evaluationId: any) {
    if (!evaluationId) return;
    this.evaluationRepo.getDocumentDownloadUrl(String(evaluationId)).subscribe({
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
    this.evaluationRepo.getDocxDownloadUrl(String(evaluationId)).subscribe({
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

  onGenerate() {
    const protocol = this.selectedProtocol();
    if (this.form.valid && protocol) {
      this.isSubmitting.set(true);
      const formValue = this.form.value;
      const protocolIdNum = Number(protocol.id);

      // 1. Generar la ruta/key para el Acta Consolidada
      const s3Key = `protocols/${protocolIdNum}/resolutions/Carta_Resolucion_Consolidada.pdf`;
      const fileToUpload = this.selectedFile() || new File([new Blob(['Acta de Resolución'], { type: 'application/pdf' })], 'Carta_Resolucion_Consolidada.pdf', { type: 'application/pdf' });

      // 2. Solicitar URL firmada y realizar la subida a Cloudflare R2
      this.s3StorageService.getUploadUrl(s3Key, 'application/pdf').pipe(
        switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter(upRes => upRes.success),
          map(() => urlRes.key)
        )),
        switchMap(uploadedKey => {
          const payload = {
            protocolId: protocolIdNum,
            validityYears: Number(formValue.validityYears),
            followUpPeriodDays: Number(formValue.followUpPeriodDays),
            observations: formValue.observations,
            pdfLetterPath: uploadedKey
          };

          return this.resolutionRepo.submitResolution(payload);
        })
      ).subscribe({
        next: (res) => {
          this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', { duration: 5000 });
          this.form.reset();
          this.selectedFile.set(null);
          this.isSubmitting.set(false);
          this.onClearSelection();
        },
        error: (err) => {
          console.error('Error submitting resolution:', err);
          if (err.status === 409) {
            this.snackBar.open('⚠️ El expediente de este protocolo ya ha sido versionado o modificado por otra transacción concurrente. Por favor, recargue la página.', 'Cerrar', { duration: 8000 });
          } else {
            this.snackBar.open('❌ Error al procesar la resolución', 'Cerrar', { duration: 5000 });
          }
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
