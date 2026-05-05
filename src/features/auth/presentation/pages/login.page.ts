import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoginUseCase } from '../../use-cases';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OtpVerificationDialogComponent } from '../components/otp-verification/otp-verification-dialog.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterLink
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card mat-elevation-z8">
        <mat-card-header class="login-header">
          <div class="login-logo-container">
            <mat-icon class="login-icon">verified_user</mat-icon>
          </div>
          <mat-card-title>CEISH - ESPOCH</mat-card-title>
          <mat-card-subtitle>Panel de Control Administrativo</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Institucional</mat-label>
              <input matInput type="email" formControlName="email" placeholder="usuario@espoch.edu.ec">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">El email es requerido</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Formato de email inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="••••••••">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="loginForm.invalid || isLoading || isLocked">
              <span *ngIf="!isLoading">{{ isLocked ? 'Cuenta Bloqueada' : 'Iniciar Sesión' }}</span>
              <mat-spinner *ngIf="isLoading" diameter="24" class="spinner-inline"></mat-spinner>
            </button>

            <div class="register-link mt-4 text-center">
              <span class="text-muted small">¿Aún no tienes cuenta? </span>
              <a routerLink="/auth/register" class="fw-bold text-primary small text-decoration-none">regístrate</a>
            </div>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <p *ngIf="attempts > 0 && !isLocked" class="attempts-text">Intentos fallidos: {{ attempts }} de 3</p>
          <a mat-button color="accent" href="#" class="forgot-btn">¿Olvidaste tu contraseña?</a>
        </mat-card-footer>
      </mat-card>

      <div class="login-background-text">
        <span>ESPOCH</span>
        <span>CEISH</span>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0f172a;
      background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
      background-size: 40px 40px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 1.5rem;
      border-radius: 16px;
      z-index: 10;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 2.5rem;

      mat-card-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; color: #1e293b; }
      mat-card-subtitle { margin-top: 0.5rem; color: #64748b; font-size: 1rem; }
    }

    .login-logo-container {
      width: 64px;
      height: 64px;
      background-color: #eff6ff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;

      .login-icon { font-size: 32px; width: 32px; height: 32px; color: #2563eb; }
    }

    .login-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .full-width { width: 100%; }

    .submit-btn {
      height: 52px;
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 1.5rem;
      border-radius: 12px;
    }

    .spinner-inline { display: inline-block; }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background-color: #fef2f2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 10px;
      margin-top: 1rem;
      font-size: 0.9rem;
      border: 1px solid #fee2e2;
    }

    .login-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2rem;

      .attempts-text { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.5rem; }
      .forgot-btn { font-weight: 500; }
    }

    .register-link {
      a { transition: all 0.2s ease; &:hover { color: #1d4ed8 !important; } }
    }

    .login-background-text {
      position: absolute;
      bottom: -20px;
      right: -20px;
      display: flex;
      flex-direction: column;
      line-height: 0.8;
      font-size: 15rem;
      font-weight: 900;
      color: rgba(255,255,255,0.02);
      user-select: none;
      pointer-events: none;
    }
  `]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  attempts = 0;
  isLocked = false;
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLocked) {
      this.isLoading = true;
      this.errorMessage = '';

      this.loginUseCase.execute(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Redirección basada en roles
          const user = response.user;
          const userRole = user?.rol?.toUpperCase();

          if (userRole === 'INVESTIGADOR') {
            this.router.navigate(['/investigador']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          
          // Detectar si el error es por falta de verificación de correo
          const errorMsg = err.message || '';
          if (errorMsg.includes('verificar') || errorMsg.includes('verify') || err.status === 403) {
            this.openOtpDialog(this.loginForm.value.email);
            return;
          }

          this.attempts++;
          this.errorMessage = err.message || 'Credenciales incorrectas';

          if (this.attempts >= 3) {
            this.isLocked = true;
            this.errorMessage = 'Cuenta bloqueada temporalmente por seguridad.';
          }
        }
      });
    }
  }

  private openOtpDialog(email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { email }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se verificó con éxito, intentamos el login de nuevo automáticamente
        this.onSubmit();
      }
    });
  }
}
