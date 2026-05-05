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
    <div class="page-container">
      <header class="page-header">
        <div class="title-area">
          <h1>Generador de Resoluciones</h1>
          <p>Emisión de dictámenes oficiales (Anexos 13, 14, 15, 16)</p>
        </div>
      </header>

      <div class="generator-layout">
        <!-- Form Section -->
        <main class="form-section">
          <form [formGroup]="form" class="card">
            <h3>Configuración del Documento</h3>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Protocolo a Resolver</mat-label>
                <mat-select formControlName="protocolId">
                  <mat-option value="2026-IO-001">2026-IO-001: Impacto COVID-19</mat-option>
                  <mat-option value="2026-EC-002">2026-EC-002: Ensayo Clínico Vacuna X</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tipo de Resolución</mat-label>
                <mat-select formControlName="resolutionType">
                  <mat-option value="APPROVAL">Aprobación Definitiva (Anexos 13/14)</mat-option>
                  <mat-option value="CONDITIONAL">Aprobación Condicionada (Anexo 15)</mat-option>
                  <mat-option value="REJECTION">No Aprobación (Anexo 16)</mat-option>
                  <mat-option value="EXEMPTION">Exención de Revisión (Anexo 12)</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Dynamic Fields Section -->
            <div class="dynamic-fields" *ngIf="form.get('resolutionType')?.value">
              <h4 class="section-title">Campos Específicos</h4>
              
              <!-- Conditional Fields -->
              <ng-container *ngIf="form.get('resolutionType')?.value === 'CONDITIONAL'">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Observaciones Mayores</mat-label>
                  <textarea matInput formControlName="majorObservations" rows="3"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Observaciones Menores</mat-label>
                  <textarea matInput formControlName="minorObservations" rows="3"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Plazo de Subsanación (Días)</mat-label>
                  <input matInput type="number" formControlName="deadlineDays" value="30">
                </mat-form-field>
              </ng-container>

              <!-- Rejection Fields -->
              <ng-container *ngIf="form.get('resolutionType')?.value === 'REJECTION'">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Justificación Ética y Metodológica (Detallada)</mat-label>
                  <textarea matInput formControlName="rejectionJustification" rows="5"></textarea>
                </mat-form-field>
              </ng-container>

              <!-- Approval Fields -->
              <ng-container *ngIf="form.get('resolutionType')?.value === 'APPROVAL'">
                <div class="row">
                  <mat-form-field appearance="outline">
                    <mat-label>Vigencia (Meses)</mat-label>
                    <input matInput type="number" formControlName="validityMonths" value="12">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Periodicidad de Informes (Meses)</mat-label>
                    <input matInput type="number" formControlName="reportPeriodicityMonths" value="6">
                  </mat-form-field>
                </div>
              </ng-container>
            </div>

          </form>
        </main>

        <!-- Preview Section -->
        <aside class="preview-section">
          <div class="card status-card">
            <h4>Vista Previa y Emisión</h4>
            <div class="document-preview-placeholder">
              <mat-icon>picture_as_pdf</mat-icon>
              <p *ngIf="!form.get('resolutionType')?.value">Seleccione un tipo de resolución para previsualizar</p>
              <p *ngIf="form.get('resolutionType')?.value" class="active-preview">Generando borrador para {{ form.get('protocolId')?.value }}...</p>
            </div>

            <div class="action-buttons mt-4">
              <button mat-stroked-button color="primary" class="full-width-btn" [disabled]="form.invalid">
                <mat-icon>visibility</mat-icon>
                Ver PDF
              </button>
              <button mat-flat-button class="approve-btn full-width-btn mt-2" 
                      [disabled]="form.invalid"
                      (click)="onGenerate()">
                <mat-icon>verified</mat-icon>
                Firmar y Notificar
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease-out; }
    .page-header { margin-bottom: 2rem; h1 { margin: 0; font-size: 1.8rem; color: #003366; } p { color: #64748b; margin-top: 0.5rem; } }
    
    .generator-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start; }
    @media (max-width: 960px) { .generator-layout { grid-template-columns: 1fr; } }

    .card { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; h3 { margin-top: 0; color: #003366; } }
    
    .form-grid { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full-width { width: 100%; }
    .half-width { width: 50%; }
    .my-4 { margin: 2rem 0; }
    .mt-4 { margin-top: 2rem; }
    .mt-2 { margin-top: 1rem; }
    
    .section-title { font-weight: 700; color: #475569; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }

    .status-card { h4 { margin: 0 0 1.5rem; font-weight: 800; color: #003366; } }
    .document-preview-placeholder {
      background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 3rem 1rem; text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem; }
      p { color: #64748b; font-size: 0.9rem; margin: 0; }
      .active-preview { color: #003366; font-weight: 600; }
    }

    .full-width-btn { width: 100%; padding: 0.5rem; }
    .approve-btn { background-color: #10b981; color: white; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ResolutionGeneratorPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

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
    // Dynamic validation handling
    this.form.get('resolutionType')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  private updateValidators(type: string) {
    // Reset validators
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
      this.snackBar.open('Resolución generada, firmada y notificada exitosamente.', 'Cerrar', {
        duration: 4000,
        panelClass: ['success-snackbar']
      });
      this.form.reset();
    }
  }
}
