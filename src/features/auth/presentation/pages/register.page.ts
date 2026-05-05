import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepperModule } from '@angular/material/stepper';

import { RegisterInvestigadorUseCase } from '../../use-cases';
import { RegisterInvestigadorRequest } from '../../domain/entities/register.request';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OtpVerificationDialogComponent } from '../components/otp-verification/otp-verification-dialog.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatToolbarModule,
    MatStepperModule,
    MatDialogModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-register-layout">
      <!-- HEADER -->
      <mat-toolbar class="register-toolbar shadow-sm">
        <div class="toolbar-content">
          <div class="brand-section">
            <div class="logo-box">
              <mat-icon>verified_user</mat-icon>
            </div>
            <div class="brand-text">
              <span class="main-title">CEISH - ESPOCH</span>
              <span class="sub-title">Comité de Ética de Investigación en Seres Humanos</span>
            </div>
          </div>
          <span class="spacer"></span>
          <button mat-button color="primary" routerLink="/auth/login" class="back-btn">
            <mat-icon>arrow_back</mat-icon> VOLVER AL LOGIN
          </button>
        </div>
      </mat-toolbar>

      <main class="register-main-content">
        <div class="content-header animate-fade-in">
          <h1 class="page-title">Registro de Investigador</h1>
          <p class="page-subtitle">Siga los pasos para completar su registro en la plataforma.</p>
        </div>

        <mat-card class="register-stepper-card shadow-soft animate-fade-in">
          <mat-stepper [linear]="true" #stepper class="custom-stepper">
            
            <!-- PASO 1: IDENTIFICACIÓN -->
            <mat-step [stepControl]="registerForm.get('stepOne')!">
              <ng-template matStepLabel>Identificación</ng-template>
              <form [formGroup]="$any(registerForm.get('stepOne'))" class="step-content p-4">
                <div class="section-info mb-4">
                  <mat-icon class="section-icon">fingerprint</mat-icon>
                  <div>
                    <h3 class="m-0">Datos de Identidad</h3>
                    <p class="text-muted small m-0">Seleccione su documento y nacionalidad.</p>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="field-label">Tipo de documento</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-select formControlName="documentType" placeholder="---SELECCIONE---">
                        <mat-option value="Cédula">Cédula de Identidad</mat-option>
                        <mat-option value="Pasaporte">Pasaporte</mat-option>
                      </mat-select>
                      <mat-error>Campo requerido</mat-error>
                    </mat-form-field>
                  </div>

                  <div class="col-md-6">
                    <label class="field-label">Número de Documento</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <input matInput formControlName="nationalId" placeholder="Ej: 1850463392">
                      <mat-error *ngIf="registerForm.get('stepOne.nationalId')?.hasError('required')">Campo requerido</mat-error>
                      <mat-error *ngIf="registerForm.get('stepOne.nationalId')?.hasError('invalidCedula')">Número inválido</mat-error>
                    </mat-form-field>
                  </div>

                  <div class="col-md-12">
                    <label class="field-label">Nacionalidad</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-select formControlName="nationality" placeholder="---SELECCIONE UNA NACIONALIDAD---">
                        <mat-option value="Ecuatoriana">Ecuatoriana</mat-option>
                        <mat-option value="Extranjera">Extranjera</mat-option>
                      </mat-select>
                      <mat-error>Campo requerido</mat-error>
                    </mat-form-field>
                  </div>
                </div>

                <div class="step-actions mt-4">
                  <button mat-flat-button color="primary" matStepperNext class="next-btn">
                    SIGUIENTE <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- PASO 2: INFORMACIÓN PERSONAL -->
            <mat-step [stepControl]="registerForm.get('stepTwo')!">
              <ng-template matStepLabel>Información Personal</ng-template>
              <form [formGroup]="$any(registerForm.get('stepTwo'))" class="step-content p-4">
                <div class="section-info mb-4">
                  <mat-icon class="section-icon">person</mat-icon>
                  <div>
                    <h3 class="m-0">Datos Personales</h3>
                    <p class="text-muted small m-0">Ingrese sus nombres completos y contacto.</p>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="field-label">Primer nombre</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <input matInput formControlName="firstName">
                      <mat-error>Campo requerido</mat-error>
                    </mat-form-field>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Segundo nombre</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <input matInput formControlName="middleName">
                    </mat-form-field>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Primer apellido</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <input matInput formControlName="firstLastName">
                      <mat-error>Campo requerido</mat-error>
                    </mat-form-field>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Segundo apellido</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <input matInput formControlName="secondLastName">
                    </mat-form-field>
                  </div>
                  <div class="col-md-12">
                    <label class="field-label">Teléfono / Celular</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-icon matPrefix>phone</mat-icon>
                      <input matInput formControlName="phone" placeholder="0998887776" 
                             maxlength="10" (keypress)="onKeyPressNumber($event)">
                      <mat-error>Debe tener 10 dígitos</mat-error>
                    </mat-form-field>
                  </div>
                </div>

                <div class="step-actions mt-4 d-flex gap-2">
                  <button mat-stroked-button matStepperPrevious>ATRÁS</button>
                  <button mat-flat-button color="primary" matStepperNext class="next-btn">
                    SIGUIENTE <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- PASO 3: SEGURIDAD Y TÉRMINOS -->
            <mat-step [stepControl]="registerForm.get('stepThree')!">
              <ng-template matStepLabel>Seguridad</ng-template>
              <form [formGroup]="$any(registerForm.get('stepThree'))" class="step-content p-4">
                <div class="section-info mb-4">
                  <mat-icon class="section-icon">security</mat-icon>
                  <div>
                    <h3 class="m-0">Cuenta y Seguridad</h3>
                    <p class="text-muted small m-0">Configure su acceso y acepte los reglamentos.</p>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-md-12">
                    <label class="field-label">Email Institucional / Personal</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-icon matPrefix>email</mat-icon>
                      <input matInput formControlName="email" type="email">
                      <mat-error>Email inválido o requerido</mat-error>
                    </mat-form-field>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Contraseña</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-icon matPrefix>lock</mat-icon>
                      <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
                      <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                        <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                      </button>
                      <mat-error>Mínimo 8 caracteres</mat-error>
                    </mat-form-field>
                  </div>
                  <div class="col-md-6">
                    <label class="field-label">Confirmar contraseña</label>
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-icon matPrefix>lock_clock</mat-icon>
                      <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="confirmPassword">
                      <mat-error *ngIf="registerForm.get('stepThree')?.hasError('mismatch')">No coinciden</mat-error>
                    </mat-form-field>
                  </div>
                </div>

                <div class="legal-box p-3 rounded-3 mt-4 border bg-light">
                  <mat-checkbox formControlName="acceptsTerms" class="d-block mb-1">
                    <span class="small-text fw-bold">ACEPTO TÉRMINOS Y CONDICIONES</span>
                  </mat-checkbox>
                  <mat-checkbox formControlName="acceptsRegulations" class="d-block">
                    <span class="small-text fw-bold">ACEPTO EL REGLAMENTO INTERNO</span>
                  </mat-checkbox>
                </div>

                <div class="step-actions mt-5 d-flex gap-2">
                  <button mat-stroked-button matStepperPrevious>ATRÁS</button>
                  <button mat-flat-button color="primary" class="flex-grow-1 submit-btn" 
                          [disabled]="registerForm.invalid || isLoading" (click)="onSubmit()">
                    <span *ngIf="!isLoading">FINALIZAR REGISTRO</span>
                    <mat-progress-spinner *ngIf="isLoading" diameter="24" mode="indeterminate" class="mx-auto"></mat-progress-spinner>
                  </button>
                </div>
              </form>
            </mat-step>

          </mat-stepper>
        </mat-card>

        <footer class="register-footer mt-5 text-center">
          <p class="text-muted small">&copy; 2026 Escuela Superior Politécnica de Chimborazo.</p>
        </footer>
      </main>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .dashboard-register-layout {
      min-height: 100vh;
      background-color: #f8fafc;
    }

    .register-toolbar {
      background: white;
      height: 72px;
      padding: 0 2.5rem;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 1000;
      .toolbar-content { display: flex; align-items: center; width: 100%; max-width: 1200px; margin: 0 auto; }
      .brand-section { display: flex; align-items: center; gap: 1rem; }
      .logo-box { width: 42px; height: 42px; background: vars.$color-primary; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
      .brand-text { display: flex; flex-direction: column; .main-title { font-weight: 800; font-size: 1.1rem; color: #1e293b; } .sub-title { font-size: 0.7rem; color: #64748b; } }
    }

    .register-main-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    .content-header { margin-bottom: 2rem; .page-title { font-size: 2rem; font-weight: 800; color: #1e293b; } .page-subtitle { color: #64748b; } }

    .register-stepper-card {
      border-radius: 20px;
      padding: 1rem;
      border: none;
    }

    .section-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #f8fafc;
      border-radius: 15px;
      .section-icon { width: 40px; height: 40px; font-size: 40px; color: vars.$color-accent; }
      h3 { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
    }

    .field-label { display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px; }

    .submit-btn {
      height: 54px;
      font-weight: 800;
      border-radius: 12px;
      background-color: vars.$color-primary !important;
    }

    .next-btn { height: 48px; font-weight: 700; border-radius: 10px; padding: 0 2rem; }

    .small-text { font-size: 0.75rem; color: #475569; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    ::ng-deep .mat-step-header .mat-step-icon-selected { background-color: vars.$color-primary !important; }
    ::ng-deep .mat-step-header .mat-step-label.mat-step-label-selected { color: vars.$color-primary; font-weight: 800; }
  `]
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly registerUseCase = inject(RegisterInvestigadorUseCase);
  private readonly dialog = inject(MatDialog);

  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor() {
    this.registerForm = this.fb.group({
      stepOne: this.fb.group({
        documentType: ['', Validators.required],
        nationalId: ['', [Validators.required]],
        nationality: ['', Validators.required]
      }),
      stepTwo: this.fb.group({
        firstName: ['', Validators.required],
        middleName: [''],
        firstLastName: ['', Validators.required],
        secondLastName: [''],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
      }),
      stepThree: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        acceptsTerms: [false, Validators.requiredTrue],
        acceptsRegulations: [false, Validators.requiredTrue]
      }, { validators: this.passwordMatchValidator })
    });

    // Re-vincular validador de cédula al primer grupo
    this.registerForm.get('stepOne.nationalId')?.setValidators([
      Validators.required, 
      this.documentoValidator.bind(this)
    ]);
  }

  // Restricción física: Solo números
  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  documentoValidator(control: any) {
    if (!control.value) return null;
    
    try {
      const stepOne = this.registerForm?.get('stepOne') as FormGroup;
      if (!stepOne) return null;
      
      const tipo = stepOne.get('documentType')?.value;
      
      if (tipo === 'Cédula') {
        const cedula = control.value;
        
        // Validación básica de longitud y caracteres
        if (!/^[0-9]{10}$/.test(cedula)) return { invalidCedula: true };
        
        const provincia = parseInt(cedula.substring(0, 2), 10);
        if (provincia < 1 || provincia > 24) return { invalidCedula: true };
        
        const digitoRegion = parseInt(cedula.substring(2, 3), 10);
        if (digitoRegion >= 6) return { invalidCedula: true };
        
        const ultimoDigito = parseInt(cedula.substring(9, 10), 10);
        let suma = 0;
        for (let i = 0; i < 9; i++) {
          let val = parseInt(cedula.substring(i, i + 1), 10);
          if (i % 2 === 0) {
            val = val * 2;
            if (val > 9) val -= 9;
          }
          suma += val;
        }
        
        const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
        return digitoVerificador === ultimoDigito ? null : { invalidCedula: true };
      }
      return null;
    } catch (error) {
      console.error('Error en validador de documento:', error);
      return { validationError: true };
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      const rawData = this.registerForm.value;
      
      // Construir el payload exacto eliminando campos no deseados por el backend (confirmPassword)
      const { confirmPassword, ...securityData } = rawData.stepThree;
      
      const payload: RegisterInvestigadorRequest = {
        ...rawData.stepOne,
        ...rawData.stepTwo,
        ...securityData
      };

      console.log('[RegisterPage] Enviando payload al backend:', payload);

      this.registerUseCase.execute(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          const msg = response?.message || 'Registro exitoso. Verifique su correo.';
          this.snackBar.open(`✅ ${msg}`, 'Cerrar', { 
            duration: 4000,
            panelClass: ['snackbar-success']
          });
          
          // REDIRIGIR A LA PÁGINA DE VERIFICACIÓN OTP
          this.router.navigate(['/auth/confirm-email'], { 
            queryParams: { email: payload.email } 
          });
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.message || 'Intente de nuevo más tarde';
          this.snackBar.open(`❌ Error: ${errorMessage}`, 'Entendido', { 
            duration: 6000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
