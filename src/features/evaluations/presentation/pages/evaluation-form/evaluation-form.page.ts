import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <button mat-icon-button routerLink="/evaluations/list">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-area">
          <h1>Informe de Evaluación Técnica/Ética</h1>
          <p>Protocolo: {{ protocolCode() }}</p>
        </div>
      </header>

      <mat-stepper [linear]="true" class="modern-stepper">
        <!-- Step 1: Criterios Técnicos -->
        <mat-step [stepControl]="technicalForm">
          <ng-template matStepLabel>Criterios Técnicos</ng-template>
          <form [formGroup]="technicalForm" class="step-content">
            <div class="criteria-list">
              <div class="criteria-item">
                <p>1. ¿El diseño del estudio es adecuado para responder a la pregunta de investigación?</p>
                <mat-radio-group formControlName="designAdequate">
                  <mat-radio-button value="yes">Sí</mat-radio-button>
                  <mat-radio-button value="no">No</mat-radio-button>
                  <mat-radio-button value="na">N/A</mat-radio-button>
                </mat-radio-group>
              </div>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observaciones Técnicas</mat-label>
                <textarea matInput formControlName="technicalObservations" rows="4"></textarea>
              </mat-form-field>
            </div>
            
            <div class="actions">
              <button mat-flat-button color="primary" matStepperNext>Siguiente</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Criterios Éticos -->
        <mat-step [stepControl]="ethicalForm">
          <ng-template matStepLabel>Criterios Éticos</ng-template>
          <form [formGroup]="ethicalForm" class="step-content">
            <div class="criteria-list">
              <div class="criteria-item">
                <p>1. ¿El proceso de consentimiento informado es completo y comprensible?</p>
                <mat-radio-group formControlName="consentClear">
                  <mat-radio-button value="yes">Sí</mat-radio-button>
                  <mat-radio-button value="no">No</mat-radio-button>
                </mat-radio-group>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observaciones Éticas</mat-label>
                <textarea matInput formControlName="ethicalObservations" rows="4"></textarea>
              </mat-form-field>
            </div>
            
            <div class="actions">
              <button mat-button matStepperPrevious>Atrás</button>
              <button mat-flat-button color="primary" matStepperNext>Siguiente</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Dictamen Final -->
        <mat-step>
          <ng-template matStepLabel>Dictamen</ng-template>
          <div class="step-content">
            <h3>Resolución Sugerida</h3>
            <mat-radio-group [(ngModel)]="finalDecision" class="decision-group">
              <mat-radio-button value="APPROVED">Aprobado</mat-radio-button>
              <mat-radio-button value="OBSERVED">Observado (Requiere cambios)</mat-radio-button>
              <mat-radio-button value="REJECTED">Rechazado</mat-radio-button>
            </mat-radio-group>

            <div class="actions mt-4">
              <button mat-button matStepperPrevious>Atrás</button>
              <button mat-flat-button color="accent" (click)="onSubmit()">Enviar Informe Final</button>
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
    .criteria-list { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 2rem; }
    .criteria-item { p { font-weight: 500; margin-bottom: 1rem; } }
    .full-width { width: 100%; }
    .decision-group { display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0; }
    .actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .mt-4 { margin-top: 2rem; }
  `]
})
export class EvaluationFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  protocolCode = signal('Cargando...');
  finalDecision = 'APPROVED';

  technicalForm: FormGroup = this.fb.group({
    designAdequate: ['yes', Validators.required],
    technicalObservations: ['', Validators.required]
  });

  ethicalForm: FormGroup = this.fb.group({
    consentClear: ['yes', Validators.required],
    ethicalObservations: ['', Validators.required]
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    // En una app real, cargaríamos el protocolo aquí
    this.protocolCode.set('2026-IO-001');
  }

  onSubmit() {
    this.snackBar.open('Informe de evaluación enviado con éxito', 'Cerrar', { duration: 3000 });
    this.router.navigate(['/evaluations/list']);
  }
}
