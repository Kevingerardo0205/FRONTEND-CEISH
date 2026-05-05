import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-adverse-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/follow-up/adverse-events">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-area">
          <h1>Reporte de Evento Adverso</h1>
          <p>Notificación de EAG / RAGI (Anexo 20/21)</p>
        </div>
      </header>

      <mat-stepper [linear]="true" class="modern-stepper">
        
        <mat-step [stepControl]="subjectForm">
          <ng-template matStepLabel>Datos del Sujeto</ng-template>
          <form [formGroup]="subjectForm" class="step-content">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Protocolo Afectado</mat-label>
                <mat-select formControlName="protocolId">
                  <mat-option value="2026-EC-002">2026-EC-002: Ensayo Clínico Vacuna X</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Código Anónimo del Sujeto</mat-label>
                <input matInput formControlName="subjectId" placeholder="Ej: SUB-001">
                <mat-error>El código es obligatorio y debe seguir el patrón (Ej: SUB-001)</mat-error>
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Edad</mat-label>
                  <input matInput type="number" formControlName="age">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Sexo</mat-label>
                  <mat-select formControlName="gender">
                    <mat-option value="M">Masculino</mat-option>
                    <mat-option value="F">Femenino</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
            
            <div class="actions">
              <button mat-flat-button color="primary" matStepperNext>Siguiente</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="eventForm">
          <ng-template matStepLabel>Detalles del Evento</ng-template>
          <form [formGroup]="eventForm" class="step-content">
            <div class="form-grid">
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Inicio</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Conocimiento (Inv.)</mat-label>
                  <input matInput [matDatepicker]="knowledgePicker" formControlName="knowledgeDate" [max]="maxReportDate">
                  <mat-datepicker-toggle matIconSuffix [for]="knowledgePicker"></mat-datepicker-toggle>
                  <mat-datepicker #knowledgePicker></mat-datepicker>
                  <mat-hint>El reporte debe hacerse ≤ 48h desde el conocimiento</mat-hint>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Gravedad del Evento</mat-label>
                <mat-select formControlName="severity">
                  <mat-option value="LEVE">Leve (No interfiere con actividades normales)</mat-option>
                  <mat-option value="MODERADO">Moderado (Interfiere con algunas actividades)</mat-option>
                  <mat-option value="GRAVE">Grave (Peligro de muerte, hospitalización, discapacidad)</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descripción Clínica Detallada</mat-label>
                <textarea matInput formControlName="description" rows="4" placeholder="Describa los síntomas y evolución..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Acciones Tomadas</mat-label>
                <textarea matInput formControlName="actionsTaken" rows="3" placeholder="Tratamiento administrado, suspensión de dosis, etc."></textarea>
              </mat-form-field>
            </div>

            <div class="actions mt-2">
              <button mat-button matStepperPrevious>Atrás</button>
              <button mat-flat-button color="primary" matStepperNext>Siguiente</button>
            </div>
          </form>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>Confirmación</ng-template>
          <div class="step-content text-center">
            <mat-icon class="alert-icon">notification_important</mat-icon>
            <h3>Revise la información antes de enviar</h3>
            <p>Este reporte será enviado inmediatamente al CEISH y a la ARCSA (si aplica).</p>
            
            <div class="actions justify-center mt-4">
              <button mat-button matStepperPrevious>Modificar</button>
              <button mat-flat-button color="warn" (click)="onSubmit()">
                <mat-icon>send</mat-icon> Enviar Reporte Urgente
              </button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .modern-stepper { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .step-content { padding: 2rem; }
    .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full-width { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .justify-center { justify-content: center; }
    .mt-2 { margin-top: 1.5rem; }
    .mt-4 { margin-top: 2.5rem; }
    .text-center { text-align: center; }
    .alert-icon { font-size: 64px; width: 64px; height: 64px; color: #dc2626; margin-bottom: 1rem; }
  `]
})
export class AdverseEventFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  maxReportDate = new Date();

  subjectForm: FormGroup = this.fb.group({
    protocolId: ['', Validators.required],
    subjectId: ['', [Validators.required, Validators.pattern(/^SUB-\d{3}$/)]],
    age: ['', Validators.required],
    gender: ['', Validators.required]
  });

  eventForm: FormGroup = this.fb.group({
    startDate: ['', Validators.required],
    knowledgeDate: [new Date(), Validators.required],
    severity: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    actionsTaken: ['', Validators.required]
  });

  ngOnInit() {
    this.maxReportDate.setDate(this.maxReportDate.getDate() + 2); // Máximo 2 días en el futuro/pasado para reportar
  }

  onSubmit() {
    // Aquí iría el caso de uso para guardar el reporte
    this.snackBar.open('Evento Adverso reportado exitosamente. Se ha notificado al CEISH.', 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/dashboard/follow-up/adverse-events']);
  }
}
