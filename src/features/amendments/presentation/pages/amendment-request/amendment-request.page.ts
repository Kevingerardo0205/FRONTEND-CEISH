import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AmendmentType,
  AmendmentSeverity,
  AmendmentDocument,
} from '../../../domain/entities/amendment.entity';
import { LoadApprovedProtocolsUseCase } from '../../../application/load-approved-protocols.use-case';
import { CreateAmendmentUseCase } from '../../../application/create-amendment.use-case';
import { ApprovedProtocolOption } from '../../../domain/ports/amendment-repository.port';

@Component({
  selector: 'app-amendment-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container animate-fade-in">
      <header
        class="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"
      >
        <div>
          <div class="badge-chip d-inline-flex align-items-center gap-1 mb-1">
            <mat-icon class="small-icon">note_add</mat-icon>
            <span>FORMULARIO OFICIAL ANEXO 23/24</span>
          </div>
          <h1 class="m-0 title">Solicitud de Enmienda a Protocolo Aprobado</h1>
          <p class="subtitle text-muted m-0">
            Presente modificaciones a investigaciones vigentes ante el Comité de Ética en
            Investigación en Seres Humanos (CEISH).
          </p>
        </div>

        <button mat-stroked-button color="primary" routerLink="/amendments">
          <mat-icon>arrow_back</mat-icon>
          Volver al Listado
        </button>
      </header>

      <form
        [formGroup]="form"
        class="card shadow-sm border-0 rounded-4 p-4 p-md-5"
        (ngSubmit)="onSubmit()"
      >
        <!-- SECCIÓN 1: SELECCIÓN DE PROTOCOLO -->
        <div class="section-block mb-4">
          <div class="section-title-wrap d-flex align-items-center gap-2 mb-3">
            <div class="step-num">1</div>
            <h2 class="section-title m-0">Selección del Protocolo Base</h2>
          </div>

          @if (loadingProtocols()) {
            <div class="d-flex align-items-center gap-2 text-muted small p-3 bg-light rounded-3">
              <mat-spinner diameter="20"></mat-spinner>
              <span>Cargando protocolos aprobados disponibles...</span>
            </div>
          } @else {
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Protocolo de Investigación Aprobado</mat-label>
              <mat-select
                formControlName="protocolId"
                (selectionChange)="onProtocolSelected($event.value)"
              >
                @for (p of approvedProtocols(); track p.id) {
                  <mat-option [value]="p.id">
                    <strong>{{ p.code }}</strong> — {{ p.title }} ({{ p.investigatorName }})
                  </mat-option>
                }
              </mat-select>
              <mat-icon matSuffix class="text-muted">folder_special</mat-icon>
              <mat-error *ngIf="form.get('protocolId')?.hasError('required')">
                Debe seleccionar el protocolo al que aplicará la enmienda
              </mat-error>
            </mat-form-field>
          }
        </div>

        <!-- SECCIÓN 2: CLASIFICACIÓN DE LA ENMIENDA -->
        <div class="section-block mb-4">
          <div class="section-title-wrap d-flex align-items-center gap-2 mb-3">
            <div class="step-num">2</div>
            <h2 class="section-title m-0">Tipo y Severidad de la Modificación</h2>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Categoría de la Enmienda</mat-label>
                <mat-select formControlName="type">
                  <mat-option [value]="AmendmentType.METHODOLOGY"
                    >Metodología y Objetivos</mat-option
                  >
                  <mat-option [value]="AmendmentType.INFORMED_CONSENT"
                    >Consentimiento / Asentimiento Informado</mat-option
                  >
                  <mat-option [value]="AmendmentType.INVESTIGATION_TEAM"
                    >Equipo de Investigación</mat-option
                  >
                  <mat-option [value]="AmendmentType.SCHEDULE"
                    >Cronograma y Plazos de Ejecución</mat-option
                  >
                  <mat-option [value]="AmendmentType.BUDGET"
                    >Presupuesto y Financiamiento</mat-option
                  >
                  <mat-option [value]="AmendmentType.SAMPLE_SIZE"
                    >Tamaño Muestral o Criterios Inclusión/Exclusión</mat-option
                  >
                  <mat-option [value]="AmendmentType.OTHER">Otras Modificaciones</mat-option>
                </mat-select>
                <mat-icon matSuffix class="text-muted">category</mat-icon>
                <mat-error>Seleccione la categoría de la enmienda</mat-error>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-6">
              <label class="severity-label small fw-bold text-dark d-block mb-2"
                >Clasificación Bioética:</label
              >
              <mat-radio-group formControlName="severity" class="d-flex flex-column gap-2">
                <mat-radio-button [value]="AmendmentSeverity.NON_SUBSTANTIAL" color="primary">
                  <span class="small">
                    <strong>Modificación Menor (No Sustancial):</strong> Cambios administrativos o
                    de forma que no incrementan el riesgo para los sujetos participantes.
                  </span>
                </mat-radio-button>
                <mat-radio-button [value]="AmendmentSeverity.SUBSTANTIAL" color="warn">
                  <span class="small">
                    <strong>Modificación Sustancial:</strong> Cambios que pueden afectar la
                    seguridad física/mental de los participantes o alterar el balance
                    beneficio-riesgo.
                  </span>
                </mat-radio-button>
              </mat-radio-group>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: JUSTIFICACIÓN Y CONSIDERACIONES ÉTICAS -->
        <div class="section-block mb-4">
          <div class="section-title-wrap d-flex align-items-center gap-2 mb-3">
            <div class="step-num">3</div>
            <h2 class="section-title m-0">Justificación e Impacto Bioético</h2>
          </div>

          <mat-form-field appearance="outline" class="w-100 mb-3">
            <mat-label>Justificación Metodológica y Científica</mat-label>
            <textarea
              matInput
              formControlName="justification"
              rows="4"
              placeholder="Describa detalladamente los motivos científicos o técnicos por los que se requiere realizar esta modificación..."
            >
            </textarea>
            <mat-error *ngIf="form.get('justification')?.hasError('required')">
              La justificación es obligatoria
            </mat-error>
            <mat-error *ngIf="form.get('justification')?.hasError('minlength')">
              La justificación debe tener al menos 20 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Evaluación de Riesgo / Impacto sobre los Participantes</mat-label>
            <textarea
              matInput
              formControlName="ethicalImpactDescription"
              rows="3"
              placeholder="Explique si la enmienda altera los riesgos para los participantes, si requiere nuevo consentimiento informado o medidas de bioseguridad..."
            >
            </textarea>
            <mat-error *ngIf="form.get('ethicalImpactDescription')?.hasError('required')">
              La evaluación del impacto bioético es requerida
            </mat-error>
          </mat-form-field>
        </div>

        <!-- SECCIÓN 4: DOCUMENTACIÓN ADJUNTA (CONTROL DE CAMBIOS + VERSIÓN LIMPIA) -->
        <div class="section-block mb-4">
          <div class="section-title-wrap d-flex align-items-center gap-2 mb-3">
            <div class="step-num">4</div>
            <h2 class="section-title m-0">Archivos Adjuntos Requeridos</h2>
          </div>

          <div class="upload-zone p-4 rounded-3 text-center border-dashed mb-3">
            <mat-icon class="upload-icon text-primary mb-2">cloud_upload</mat-icon>
            <h4 class="m-0 fw-bold">Adjuntar Archivos de la Enmienda</h4>
            <p class="small text-muted mb-3">
              Suba la versión del protocolo con <strong>Control de Cambios resaltado</strong> y la
              <strong>Versión Limpia final</strong> (PDF o DOCX, máx 25MB).
            </p>

            <input
              #fileInput
              type="file"
              multiple
              class="d-none"
              (change)="onFilesSelected($event)"
              accept=".pdf,.doc,.docx"
            />
            <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()">
              <mat-icon>attach_file</mat-icon>
              Seleccionar Archivos
            </button>
          </div>

          @if (attachedFiles().length > 0) {
            <div class="attached-files-list d-flex flex-column gap-2">
              @for (file of attachedFiles(); track file.name; let idx = $index) {
                <div
                  class="file-row p-2 rounded-2 border bg-white d-flex align-items-center justify-content-between"
                >
                  <div class="d-flex align-items-center gap-2">
                    <mat-icon class="text-primary small-icon">description</mat-icon>
                    <span class="small fw-bold">{{ file.name }}</span>
                    <span class="badge bg-secondary-subtle text-secondary small">{{
                      file.type
                    }}</span>
                  </div>
                  <button
                    mat-icon-button
                    color="warn"
                    type="button"
                    (click)="removeFile(idx)"
                    aria-label="Eliminar archivo"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- ACCIONES -->
        <div class="actions-footer d-flex justify-content-end gap-3 pt-3 border-top">
          <button mat-button type="button" routerLink="/amendments">Cancelar</button>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="btn-submit"
            [disabled]="form.invalid || submitting()"
          >
            @if (submitting()) {
              <mat-spinner diameter="20" class="me-2 d-inline-block"></mat-spinner>
              <span>Enviando...</span>
            } @else {
              <ng-container>
                <mat-icon>send</mat-icon>
                <span>Enviar Solicitud de Enmienda</span>
              </ng-container>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .badge-chip {
        background: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #003366;
      }

      .card {
        background: white;
        border: 1px solid #e2e8f0;
      }

      .step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #003366;
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .section-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
      }

      .upload-zone {
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        .upload-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
        }
      }

      .w-100 {
        width: 100%;
      }
      .small-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .btn-submit {
        background-color: #003366 !important;
        color: white !important;
        border-radius: 10px;
        font-weight: 700;
        padding: 0 24px;
        height: 46px;
      }
    `,
  ],
})
export class AmendmentRequestPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly loadApprovedProtocolsUseCase = inject(LoadApprovedProtocolsUseCase);
  private readonly createAmendmentUseCase = inject(CreateAmendmentUseCase);

  readonly AmendmentType = AmendmentType;
  readonly AmendmentSeverity = AmendmentSeverity;

  readonly loadingProtocols = signal<boolean>(true);
  readonly submitting = signal<boolean>(false);
  readonly approvedProtocols = signal<ApprovedProtocolOption[]>([]);
  readonly attachedFiles = signal<
    { name: string; type: 'TRACKED_CHANGES' | 'CLEAN_VERSION' | 'OTHER'; file?: File }[]
  >([]);

  form: FormGroup = this.fb.group({
    protocolId: ['', Validators.required],
    type: [AmendmentType.METHODOLOGY, Validators.required],
    severity: [AmendmentSeverity.NON_SUBSTANTIAL, Validators.required],
    justification: ['', [Validators.required, Validators.minLength(20)]],
    ethicalImpactDescription: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.loadProtocols();
  }

  loadProtocols(): void {
    this.loadingProtocols.set(true);
    this.loadApprovedProtocolsUseCase.execute().subscribe({
      next: (protocols) => {
        this.approvedProtocols.set(protocols);
        this.loadingProtocols.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar protocolos aprobados', 'Cerrar', { duration: 3000 });
        this.loadingProtocols.set(false);
      },
    });
  }

  onProtocolSelected(protocolId: string): void {
    // Protocolo seleccionado
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files).map((f, i) => {
        const type: 'TRACKED_CHANGES' | 'CLEAN_VERSION' | 'OTHER' =
          i === 0 ? 'TRACKED_CHANGES' : i === 1 ? 'CLEAN_VERSION' : 'OTHER';
        return {
          name: f.name,
          type,
          file: f,
        };
      });
      this.attachedFiles.update((current) => [...current, ...newFiles]);
    }
  }

  removeFile(index: number): void {
    this.attachedFiles.update((files) => files.filter((_, idx) => idx !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const protocolId = this.form.value.protocolId;
    const selectedProtocol = this.approvedProtocols().find((p) => p.id === protocolId);

    this.submitting.set(true);

    this.createAmendmentUseCase
      .execute({
        protocolId,
        protocolCode: selectedProtocol?.code || `CEISH-${protocolId}`,
        protocolTitle: selectedProtocol?.title || 'Protocolo de Investigación',
        type: this.form.value.type,
        severity: this.form.value.severity,
        justification: this.form.value.justification,
        ethicalImpactDescription: this.form.value.ethicalImpactDescription,
        documents: this.attachedFiles(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open(
            'Solicitud de enmienda enviada exitosamente al Comité CEISH',
            'Cerrar',
            {
              duration: 4000,
              panelClass: ['success-snackbar'],
            },
          );
          this.router.navigate(['/amendments']);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open('Error al enviar la solicitud de enmienda', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }
}
