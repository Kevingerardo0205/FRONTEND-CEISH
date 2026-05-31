import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ResetPasswordUseCase } from '../../use-cases';

@Component({
  selector: 'app-reset-password-page',
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
    <div class="reset-layout animate-fade-in">
      <!-- HEADER -->
      <mat-toolbar class="reset-toolbar shadow-sm">
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

      <main class="reset-main">
        <mat-card class="reset-card shadow-soft">
          <header class="reset-header text-center">
            <div class="icon-circle">
              <mat-icon>lock_open</mat-icon>
            </div>
            <h1>Restablecer Contraseña</h1>
            <p class="subtitle">Ingrese el código de seguridad enviado a su correo y configure su nueva clave.</p>
            <div class="email-badge mt-2" *ngIf="email()">{{ email() }}</div>
          </header>

          <mat-card-content class="pt-4">
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
              
              <!-- CÓDIGO OTP -->
              <div class="field-container mb-3">
                <label class="field-label">Código de Seguridad (OTP)</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput formControlName="code" placeholder="Ej: 123456" maxlength="6" autocomplete="off">
                  <mat-icon matSuffix class="text-muted">pin</mat-icon>
                  <mat-error *ngIf="resetForm.get('code')?.hasError('required')">El código es obligatorio</mat-error>
                  <mat-error *ngIf="resetForm.get('code')?.hasError('pattern')">El código debe ser de 6 dígitos numéricos</mat-error>
                </mat-form-field>
              </div>

              <!-- NUEVA CONTRASEÑA -->
              <div class="field-container mb-3">
                <label class="field-label">Nueva Contraseña</label>
                <mat-form-field appearance="outline" class="w-100 custom-field">
                  <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Mínimo 8 caracteres">
                  <button mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())" type="button" class="btn-eye" aria-label="Toggle password visibility">
                    <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="resetForm.get('password')?.hasError('required')">La contraseña es obligatoria</mat-error>
                  <mat-error *ngIf="resetForm.get('password')?.hasError('minlength')">La contraseña debe tener mínimo 8 caracteres</mat-error>
                </mat-form-field>
              </div>

              <button mat-flat-button class="submit-btn w-100 mt-4" type="submit" [disabled]="resetForm.invalid || isLoading()">
                <mat-spinner *ngIf="isLoading()" diameter="20" class="me-2"></mat-spinner>
                <span>{{ isLoading() ? 'Restableciendo...' : 'Restablecer e Iniciar Sesión' }}</span>
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .reset-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .reset-toolbar {
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

    .reset-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .reset-card {
      max-width: 500px;
      width: 100%;
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
    }

    .reset-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2rem;

      .icon-circle {
        width: 64px;
        height: 64px;
        background: rgba(16, 185, 129, 0.05);
        color: #10b981;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        mat-icon { font-size: 32px; width: 32px; height: 32px; }
      }

      h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; letter-spacing: -0.5px; }
      .subtitle { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.5; font-weight: 500; }
      
      .email-badge {
        background: #f1f5f9;
        color: #334155;
        font-family: 'Fira Code', monospace;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 9999px;
        border: 1px solid #e2e8f0;
      }
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

    .btn-eye {
      color: #94a3b8;
    }

    .submit-btn {
      height: 52px;
      background-color: #10b981 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
      transition: all 0.2s ease;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25); }
    }

    .text-center { text-align: center; }
    .w-100 { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1.5rem; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resetUseCase = inject(ResetPasswordUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isLoading = signal<boolean>(false);
  hidePassword = signal<boolean>(true);
  email = signal<string>('');

  resetForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'] || '';
      this.email.set(emailParam);
      if (!emailParam) {
        console.warn('[ResetPasswordPage] Correo no provisto en queryParams.');
      }
    });
  }

  onSubmit() {
    if (this.resetForm.valid && this.email()) {
      this.isLoading.set(true);
      const { code, password } = this.resetForm.value;

      this.resetUseCase.execute(this.email(), code, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('🎉 Contraseña restablecida con éxito. Inicie sesión.', 'Entendido', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open('❌ Código inválido o expirado. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      if (!this.email()) {
        this.snackBar.open('⚠️ Falta el correo de la cuenta. Inicie el proceso nuevamente.', 'Cerrar', { duration: 5000 });
      }
      this.resetForm.markAllAsTouched();
    }
  }
}
