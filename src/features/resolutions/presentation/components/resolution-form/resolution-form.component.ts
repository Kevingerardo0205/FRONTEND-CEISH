import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

export interface ResolutionFormValue {
  resolutionTypeId: number;
  validityYears: number;
  followUpPeriodDays: number;
  observations: string;
  majorObservations: string;
  minorObservations: string;
  correctionProcedure: string;
}

export interface EmitResolutionEvent {
  formValue: ResolutionFormValue;
  file: File | null;
}

@Component({
  selector: 'app-resolution-form',
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
    MatTooltipModule,
  ],
  template: `
    <div class="generator-layout" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
      <!-- Columna Izquierda: Vista Previa y Carga de Archivo -->
      <div class="preview-section">
        <div
          class="content-card shadow-soft p-4"
          style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);"
        >
          <h4
            class="preview-title d-flex align-items-center gap-2 mb-3"
            style="font-weight: 700; color: #1e293b;"
          >
            <mat-icon style="color: #64748b;">visibility</mat-icon>
            Vista Previa y Emisión
          </h4>

          <div
            class="document-preview-placeholder"
            style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;"
          >
            <div class="preview-art" style="margin-bottom: 16px;">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #94a3b8;"
                >picture_as_pdf</mat-icon
              >
            </div>
            <div class="active-preview-info">
              <span
                class="doc-type"
                style="display: block; font-weight: 700; font-size: 0.9rem; color: #334155;"
                >Resolución Consolidada Automática</span
              >
              <span class="doc-target" style="font-size: 0.8rem; color: #64748b;">{{
                protocol?.code || 'PRT-' + protocol?.id
              }}</span>
            </div>
          </div>

          <!-- Carga del PDF Firmado -->
          <div
            class="file-upload-zone p-3 text-center"
            style="border: 1px solid #cbd5e1; border-radius: 12px; background: #fafafa; margin-bottom: 24px;"
          >
            <mat-icon
              style="font-size: 32px; width: 32px; height: 32px; color: #64748b; margin-bottom: 8px;"
              >upload_file</mat-icon
            >
            <p
              class="small text-muted mb-3"
              *ngIf="!selectedFile()"
              style="font-size: 0.8rem; font-weight: 500;"
            >
              Cargue la Carta de Resolución PDF Firmada
            </p>

            <div
              *ngIf="selectedFile()"
              class="p-2 mb-3 rounded d-flex align-items-center justify-content-center gap-2"
              style="background-color: #f8fafc; border: 1px solid #e2e8f0;"
            >
              <mat-icon style="color: #10b981; font-size: 18px; width: 18px; height: 18px;"
                >check_circle</mat-icon
              >
              <span class="small fw-bold" style="font-size: 0.8rem; color: #475569;">{{
                selectedFile()?.name
              }}</span>
            </div>

            <button
              type="button"
              mat-stroked-button
              class="btn-sm w-100"
              (click)="fileInput.click()"
            >
              {{ selectedFile() ? 'Cambiar Archivo PDF' : 'Seleccionar PDF' }}
            </button>
            <input
              #fileInput
              type="file"
              (change)="onFileSelected($event)"
              accept="application/pdf"
              style="display: none;"
            />
          </div>

          <button
            type="button"
            mat-flat-button
            color="primary"
            class="w-100 py-2"
            [disabled]="form.invalid || isSubmitting"
            (click)="onSubmit()"
          >
            <mat-icon *ngIf="!isSubmitting">draw</mat-icon>
            <span>{{ isSubmitting ? 'Procesando...' : 'Emitir y Notificar' }}</span>
          </button>
        </div>
      </div>

      <!-- Columna Derecha: Configuración del Formulario -->
      <div
        class="content-card shadow-soft p-4"
        style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);"
      >
        <header
          class="section-header d-flex align-items-center gap-2 mb-4"
          style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;"
        >
          <mat-icon style="color: #64748b;">settings_suggest</mat-icon>
          <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #1e293b;">
            Configuración de la Resolución
          </h3>
        </header>

        <form [formGroup]="form">
          <!-- Tipo de Resolución -->
          <div class="mb-4">
            <label
              class="field-label"
              style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
              >Tipo de Dictamen / Resolución</label
            >
            <mat-form-field appearance="outline" class="w-100">
              <mat-select formControlName="resolutionTypeId">
                <mat-option [value]="1">Aprobación Definitiva</mat-option>
                <mat-option [value]="2">Aprobado con Observaciones</mat-option>
                <mat-option [value]="3">Rechazado / No Aprobado</mat-option>
              </mat-select>
              <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">gavel</mat-icon>
            </mat-form-field>
          </div>

          <!-- Campos de Vigencia y Seguimiento (Ocultar si es Rechazado) -->
          <ng-container *ngIf="form.get('resolutionTypeId')?.value !== 3">
            <div class="mb-3">
              <label
                class="field-label"
                style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
                >Vigencia de la Aprobación (Años)</label
              >
              <mat-form-field appearance="outline" class="w-100">
                <input
                  matInput
                  type="number"
                  formControlName="validityYears"
                  min="1"
                  (keydown)="preventMinus($event)"
                />
                <mat-icon matPrefix style="color: #64748b; margin-right: 8px;"
                  >calendar_today</mat-icon
                >
                <span matSuffix class="pe-3 text-muted fw-bold">Años</span>
                <mat-error *ngIf="form.get('validityYears')?.hasError('required')"
                  >La vigencia es obligatoria.</mat-error
                >
                <mat-error *ngIf="form.get('validityYears')?.hasError('min')"
                  >Debe ser mínimo 1 año.</mat-error
                >
              </mat-form-field>
            </div>

            <div class="mb-3">
              <label
                class="field-label"
                style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
                >Periodo de Seguimiento (Días)</label
              >
              <mat-form-field appearance="outline" class="w-100">
                <input
                  matInput
                  type="number"
                  formControlName="followUpPeriodDays"
                  min="1"
                  (keydown)="preventMinus($event)"
                />
                <mat-icon matPrefix style="color: #64748b; margin-right: 8px;"
                  >rotate_right</mat-icon
                >
                <span matSuffix class="pe-3 text-muted fw-bold">Días</span>
                <mat-error *ngIf="form.get('followUpPeriodDays')?.hasError('required')"
                  >El periodo de seguimiento es obligatorio.</mat-error
                >
                <mat-error *ngIf="form.get('followUpPeriodDays')?.hasError('min')"
                  >Debe ser mínimo 1 día.</mat-error
                >
              </mat-form-field>
            </div>
          </ng-container>

          <mat-divider class="my-4"></mat-divider>

          <!-- Dictamen: Aprobado (1) -->
          <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 1">
            <label
              class="field-label"
              style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
              >Observaciones Consolidadas del Comité *</label
            >
            <mat-form-field appearance="outline" class="w-100">
              <textarea
                matInput
                formControlName="observations"
                rows="5"
                placeholder="Detalle la fundamentación y observaciones para la aprobación..."
              ></textarea>
              <mat-error *ngIf="form.get('observations')?.hasError('required')"
                >Las observaciones consolidadas son obligatorias.</mat-error
              >
            </mat-form-field>
          </div>

          <!-- Dictamen: Aprobado con Observaciones (2) -->
          <ng-container *ngIf="form.get('resolutionTypeId')?.value === 2">
            <div class="field-group mb-3">
              <label
                class="field-label"
                style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
                >Observaciones Mayores *</label
              >
              <mat-form-field appearance="outline" class="w-100">
                <textarea
                  matInput
                  formControlName="majorObservations"
                  rows="4"
                  placeholder="Describa las observaciones metodológicas o éticas mayores..."
                ></textarea>
                <mat-error *ngIf="form.get('majorObservations')?.hasError('required')"
                  >Las observaciones mayores son obligatorias.</mat-error
                >
              </mat-form-field>
            </div>

            <div class="field-group mb-3">
              <label
                class="field-label"
                style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
                >Observaciones Menores (Opcional)</label
              >
              <mat-form-field appearance="outline" class="w-100">
                <textarea
                  matInput
                  formControlName="minorObservations"
                  rows="3"
                  placeholder="Describa las observaciones menores o sugerencias..."
                ></textarea>
              </mat-form-field>
            </div>

            <div class="field-group mb-2">
              <label
                class="field-label"
                style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
                >Procedimiento de Subsanación *</label
              >
              <mat-form-field appearance="outline" class="w-100">
                <textarea
                  matInput
                  formControlName="correctionProcedure"
                  rows="3"
                  placeholder="Ej: Subir los anexos correspondientes en la sección de Subsanación..."
                ></textarea>
                <mat-error *ngIf="form.get('correctionProcedure')?.hasError('required')"
                  >El procedimiento de subsanación es obligatorio.</mat-error
                >
              </mat-form-field>
            </div>
          </ng-container>

          <!-- Dictamen: Rechazado (3) -->
          <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 3">
            <label
              class="field-label"
              style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;"
              >Justificación del Rechazo *</label
            >
            <mat-form-field appearance="outline" class="w-100">
              <textarea
                matInput
                formControlName="majorObservations"
                rows="5"
                placeholder="Fundamente detalladamente las razones éticas o científicas del rechazo..."
              ></textarea>
              <mat-error *ngIf="form.get('majorObservations')?.hasError('required')"
                >La justificación del rechazo es obligatoria.</mat-error
              >
              <mat-error *ngIf="form.get('majorObservations')?.hasError('minlength')"
                >La justificación debe tener al menos 20 caracteres.</mat-error
              >
            </mat-form-field>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ResolutionFormComponent implements OnInit {
  @Input() protocol!: ProtocolEntity | null;
  @Input() isSubmitting = false;
  @Output() onEmit = new EventEmitter<EmitResolutionEvent>();

  selectedFile = signal<File | null>(null);

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      resolutionTypeId: [1, Validators.required],
      validityYears: [1, [Validators.required, Validators.min(1)]],
      followUpPeriodDays: [180, [Validators.required, Validators.min(1)]],
      observations: ['', Validators.required],
      majorObservations: [''],
      minorObservations: [''],
      correctionProcedure: [''],
    });
  }

  ngOnInit() {
    this.form.get('resolutionTypeId')?.valueChanges.subscribe((typeId) => {
      this.updateValidators(Number(typeId));
    });
  }

  private updateValidators(typeId: number) {
    const obsCtrl = this.form.get('observations');
    const majorObsCtrl = this.form.get('majorObservations');
    const correctionProcedureCtrl = this.form.get('correctionProcedure');

    obsCtrl?.clearValidators();
    majorObsCtrl?.clearValidators();
    correctionProcedureCtrl?.clearValidators();

    if (typeId === 1) {
      obsCtrl?.setValidators([Validators.required]);
    } else if (typeId === 2) {
      majorObsCtrl?.setValidators([Validators.required]);
      correctionProcedureCtrl?.setValidators([Validators.required]);
    } else if (typeId === 3) {
      majorObsCtrl?.setValidators([Validators.required, Validators.minLength(20)]);
    }

    obsCtrl?.updateValueAndValidity();
    majorObsCtrl?.updateValueAndValidity();
    correctionProcedureCtrl?.updateValueAndValidity();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  preventMinus(event: KeyboardEvent) {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  resetForm() {
    this.form.reset({
      resolutionTypeId: 1,
      validityYears: 1,
      followUpPeriodDays: 180,
      observations: '',
      majorObservations: '',
      minorObservations: '',
      correctionProcedure: '',
    });
    this.selectedFile.set(null);
    this.updateValidators(1);
  }

  onSubmit() {
    if (this.form.valid) {
      this.onEmit.emit({
        formValue: this.form.value,
        file: this.selectedFile(),
      });
    }
  }
}
