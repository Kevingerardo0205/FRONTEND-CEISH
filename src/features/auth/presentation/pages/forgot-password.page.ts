import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ForgotPasswordUseCase } from '../../use-cases';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
    RouterModule
  ],
  template: `
    <div class="forgot-layout animate-fade-in">
      <!-- HEADER -->
      <mat-toolbar class="forgot-toolbar shadow-sm">
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
            <mat-icon>arrow_back</mat-icon> VOLVER
          </button>
        </div>
      </mat-toolbar>

      <main class="forgot-main">
        <mat-card class="forgot-card shadow-soft">
          <header class="forgot-header text-center">
            <div class="icon-circle">
              <mat-icon>lock_reset</mat-icon>
            </div>
            <h1>¿Olvidó su contraseña?</h1>
            <p class="subtitle">Ingrese su correo institucional. Le enviaremos un código de seguridad para restablecer su clave.</p>
          </header>

          <mat-card-content class="pt-4">
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="forgot-form">
              <div class="field-container">
                <label class="field-label">Correo Institucional</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="email" placeholder="usuario@espoch.edu.ec" type="email">
                  <mat-icon matSuffix class="text-muted">alternate_email</mat-icon>
                  <mat-error *ngIf="forgotForm.get('email')?.hasError('required')">El correo es obligatorio</mat-error>
                  <mat-error *ngIf="forgotForm.get('email')?.hasError('email')">Ingrese un correo institucional válido</mat-error>
                </mat-form-field>
              </div>

              <button mat-flat-button class="submit-btn w-100 mt-4" type="submit" [disabled]="forgotForm.invalid || isLoading()">
                <mat-spinner *ngIf="isLoading()" diameter="20" class="me-2"></mat-spinner>
                <span>{{ isLoading() ? 'Enviando código...' : 'Enviar Código de Seguridad' }}</span>
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .forgot-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .forgot-toolbar {
      background: white !important;
      height: 70px;
      padding: 0 2rem;

      .toolbar-content {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
      }
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .logo-box {
        width: 40px;
        height: 40px;
        background: #003366;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        .main-title { font-weight: 800; font-size: 1rem; color: #003366; letter-spacing: 0.5px; }
        .sub-title { font-size: 0.65rem; color: #64748b; font-weight: 600; }
      }
    }

    .back-btn {
      font-weight: 700;
      border-radius: 10px;
      color: #003366 !important;
    }

    .forgot-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .forgot-card {
      max-width: 500px;
      width: 100%;
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
    }

    .forgot-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2rem;

      .icon-circle {
        width: 64px;
        height: 64px;
        background: rgba(0, 51, 102, 0.05);
        color: #003366;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        mat-icon { font-size: 32px; width: 32px; height: 32px; }
      }

      h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; letter-spacing: -0.5px; }
      .subtitle { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.5; font-weight: 500; }
    }

    .field-container {
      .field-label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 8px;
      }
    }

    ::ng-deep .custom-field {
      width: 100%;
      .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 12px !important;
        padding: 0 12px !important;
      }
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing {
        border-color: transparent !important;
      }
      &.mat-focused .mat-mdc-text-field-wrapper {
        background-color: white !important;
        box-shadow: 0 0 0 2px #003366;
      }
    }

    .submit-btn {
      height: 52px;
      background-color: #003366 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
      transition: all 0.2s ease;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 51, 102, 0.2); }
    }

    .text-center { text-align: center; }
    .w-100 { width: 100%; }
    .mt-4 { margin-top: 1.5rem; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly forgotPasswordUseCase = inject(ForgotPasswordUseCase);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading.set(true);
      const email = this.forgotForm.value.email;

      this.forgotPasswordUseCase.execute(email).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('🔑 Código de recuperación enviado. Por favor revise su correo.', 'Entendido', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open('❌ Error al procesar su solicitud. Verifique el correo ingresado.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }
}
