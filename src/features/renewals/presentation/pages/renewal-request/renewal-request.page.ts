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
  selector: 'app-renewal-request',
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
        <h1>Solicitud de Renovación</h1>
        <p>Extensión de vigencia de aprobación (Anexo 25)</p>
      </header>

      <form [formGroup]="form" class="card" (ngSubmit)="onSubmit()">
        <div class="alert info-alert">
          <mat-icon>info</mat-icon>
          <span>Para solicitar la renovación, debe estar al día con los informes de avance y no tener eventos adversos pendientes de resolución.</span>
        </div>

        <div class="form-grid mt-4">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Protocolo a Renovar</mat-label>
            <mat-select formControlName="protocolId">
              <mat-option value="2025-IO-010">2025-IO-010: Estudio Longitudinal (Vence en 15 días)</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Período Solicitado (Meses)</mat-label>
              <input matInput type="number" formControlName="requestedMonths" min="1" max="12" value="12">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Justificación de Renovación</mat-label>
            <textarea matInput formControlName="justification" rows="4" placeholder="Explique por qué requiere extender la investigación..."></textarea>
          </mat-form-field>
        </div>

        <div class="upload-section mt-4">
          <div class="upload-box">
            <mat-icon>upload_file</mat-icon>
            <p>Adjunte el Informe de Progreso Resumido</p>
            <button mat-stroked-button type="button">Subir PDF</button>
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
    .row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .full-width { width: 100%; }
    .mt-4 { margin-top: 2rem; }
    .upload-box { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem; text-align: center; background: #f8fafc; mat-icon { font-size: 32px; width: 32px; height: 32px; color: #94a3b8; } p { color: #64748b; margin: 1rem 0; } }
    .actions { display: flex; justify-content: flex-end; }
    .alert { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 8px; font-weight: 500; }
    .info-alert { background-color: #e0f2fe; color: #0f172a; border-left: 4px solid #0284c7; mat-icon { color: #0284c7; } }
  `]
})
export class RenewalRequestPage {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    protocolId: ['', Validators.required],
    requestedMonths: [12, [Validators.required, Validators.min(1), Validators.max(12)]],
    justification: ['', [Validators.required, Validators.minLength(20)]]
  });

  onSubmit() {
    this.snackBar.open('Solicitud de renovación enviada.', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
    this.form.reset();
  }
}
