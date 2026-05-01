import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ValidationContext } from '../../../strategies/validation-context';
import { SubmitProtocolUseCase } from '../../../application/use-cases/submit-protocol.use-case';

@Component({
  selector: 'app-protocol-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatStepperModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule,
    FileUploaderComponent
  ],
  template: `
    <div class="protocol-form-container">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/investigator">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-area">
          <h1>Registro de Nuevo Protocolo</h1>
          <p>Siga los pasos para formalizar su solicitud ante el CEISH</p>
        </div>
      </header>

      <mat-stepper #stepper class="modern-stepper" [linear]="true">
        
        <!-- Step 1: Información General -->
        <mat-step [stepControl]="infoForm">
          <ng-template matStepLabel>Información Básica</ng-template>
          <form [formGroup]="infoForm" class="step-content">
            <div class="form-grid">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Título Completo del Proyecto</mat-label>
                <textarea matInput formControlName="title" placeholder="Ej: Estudio epidemiológico de..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de Protocolo (PET 2023)</mat-label>
                <mat-select formControlName="type">
                  <mat-option [value]="ProtocolType.IO">Investigación Observacional (IO)</mat-option>
                  <mat-option [value]="ProtocolType.EI">Especial Intervención (EI)</mat-option>
                  <mat-option [value]="ProtocolType.EC">Ensayo Clínico (EC)</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="actions-row">
              <button mat-flat-button color="primary" matStepperNext [disabled]="infoForm.invalid">Siguiente</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Carga de Documentación -->
        <mat-step>
          <ng-template matStepLabel>Documentación</ng-template>
          <div class="step-content">
            <div class="requirements-box">
              <h4>Documentos Requeridos para {{ infoForm.get('type')?.value }}</h4>
              <ul class="doc-checklist">
                <li *ngFor="let doc of requiredDocs()">
                  <mat-icon [class.check-active]="isDocLoaded(doc.type)">
                    {{ isDocLoaded(doc.type) ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <span>{{ doc.label }}</span>
                </li>
              </ul>
            </div>

            <app-file-uploader (upload)="onFilesUploaded($event)"></app-file-uploader>

            <div class="actions-row mt-2">
              <button mat-button matStepperPrevious>Atrás</button>
              <button mat-flat-button color="primary" matStepperNext [disabled]="!isDocumentationComplete()">Siguiente</button>
            </div>
          </div>
        </mat-step>

        <!-- Step 3: Revisión y Envío -->
        <mat-step>
          <ng-template matStepLabel>Finalizar</ng-template>
          <div class="step-content review-step">
            <mat-icon class="success-icon">verified_user</mat-icon>
            <h3>Todo listo para el envío</h3>
            <p>Al hacer clic en enviar, su protocolo será remitido a Secretaría para la validación documental.</p>
            
            <div class="review-card">
              <p><strong>Título:</strong> {{ infoForm.get('title')?.value }}</p>
              <p><strong>Tipo:</strong> {{ infoForm.get('type')?.value }}</p>
              <p><strong>Archivos:</strong> {{ uploadedFiles().length }} documentos cargados</p>
            </div>

            <div class="actions-row">
              <button mat-button matStepperPrevious>Atrás</button>
              <button mat-flat-button class="submit-btn" (click)="onSubmit()">Enviar al CEISH</button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .protocol-form-container { max-width: 900px; margin: 0 auto; animation: slideUp 0.4s ease-out; }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #003366; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .modern-stepper {
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    .step-content { padding: 2rem; }
    
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      .full-width { width: 100%; }
    }

    .requirements-box {
      background: #f0f7ff;
      padding: 1.5rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      h4 { margin: 0 0 1rem; color: #003366; font-weight: 700; }
    }

    .doc-checklist {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.85rem;
        color: #475569;
        mat-icon { font-size: 18px; width: 18px; height: 18px; color: #cbd5e1; }
        .check-active { color: #10b981; }
      }
    }

    .review-step {
      text-align: center;
      .success-icon { font-size: 64px; width: 64px; height: 64px; color: #4DB6AC; margin-bottom: 1rem; }
      .review-card { background: #f8fafc; padding: 1.5rem; border-radius: 16px; margin: 2rem 0; text-align: left; }
    }

    .actions-row { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
    .submit-btn { background-color: #4DB6AC; color: white; font-weight: 700; padding: 0 2rem; }
    .mt-2 { margin-top: 2rem; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProtocolFormComponent {
  private fb = inject(FormBuilder);
  private submitUseCase = inject(SubmitProtocolUseCase);
  private validationContext = new ValidationContext();

  ProtocolType = ProtocolType;

  infoForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(10)]],
    type: [ProtocolType.IO, [Validators.required]]
  });

  uploadedFiles = signal<File[]>([]);

  requiredDocs = computed(() => {
    const type = this.infoForm.get('type')?.value;
    return this.validationContext.getStrategy(type).getRequiredDocuments();
  });

  onFilesUploaded(files: File[]) {
    this.uploadedFiles.set(files);
  }

  isDocLoaded(type: string): boolean {
    // En una implementación real, el uploader debería asignar el tipo a cada archivo
    return this.uploadedFiles().length > 0; // Simplificación para el demo
  }

  isDocumentationComplete(): boolean {
    return this.uploadedFiles().length > 0;
  }

  onSubmit() {
    this.submitUseCase.execute(this.infoForm.value, this.uploadedFiles()).subscribe({
      next: (res) => console.log('Protocolo enviado:', res),
      error: (err) => alert(err.message)
    });
  }
}
