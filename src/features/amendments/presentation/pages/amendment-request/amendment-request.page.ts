import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-amendment-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Solicitud de Enmienda</h1>
        <p>Modificación a protocolo aprobado (Anexo 23/24)</p>
      </header>

      <form [formGroup]="form" class="card" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Protocolo Aprobado</mat-label>
            <mat-select formControlName="protocolId">
              <mat-option value="2025-IO-010">2025-IO-010: Estudio Longitudinal</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Enmienda</mat-label>
            <mat-select formControlName="type">
              <mat-option value="METHODOLOGY">Cambios en Metodología</mat-option>
              <mat-option value="TEAM">Cambios en Equipo Investigador</mat-option>
              <mat-option value="SCHEDULE">Extensión de Cronograma</mat-option>
              <mat-option value="BUDGET">Modificación de Presupuesto</mat-option>
              <mat-option value="OTHER">Otros</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Justificación Detallada</mat-label>
            <textarea matInput formControlName="justification" rows="5" placeholder="Explique las razones de la enmienda..."></textarea>
          </mat-form-field>
        </div>

        <div class="upload-section mt-4">
          <div class="upload-box">
            <mat-icon>cloud_upload</mat-icon>
            <p>Adjuntar documentos modificados (con control de cambios y versión limpia)</p>
            <button mat-stroked-button type="button">Seleccionar Archivos</button>
          </div>
        </div>

        <div class="actions mt-4">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Enviar Solicitud</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; h1 { margin: 0; color: #003366; } p { color: #64748b; } }
    .card { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .full-width { width: 100%; }
    .mt-4 { margin-top: 2rem; }
    .upload-box { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem; text-align: center; background: #f8fafc; mat-icon { font-size: 32px; width: 32px; height: 32px; color: #94a3b8; } p { color: #64748b; margin: 1rem 0; } }
    .actions { display: flex; justify-content: flex-end; }
  `]
})
export class AmendmentRequestPage {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    protocolId: ['', Validators.required],
    type: ['', Validators.required],
    justification: ['', [Validators.required, Validators.minLength(20)]]
  });

  onSubmit() {
    this.snackBar.open('Solicitud de enmienda enviada al CEISH.', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
    this.form.reset();
  }
}
