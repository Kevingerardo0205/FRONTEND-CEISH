
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    <div class="login-wrapper">
      <!-- Decoración de fondo dinámica -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      
      <div class="login-container">
        <mat-card class="login-card glass-effect animate-in">
          <div class="brand-header">
            <div class="logo-box">
              <mat-icon class="brand-icon">security</mat-icon>
            </div>
            <h1 class="main-title">CEISH-ESPOCH</h1>
            <p class="subtitle">Comité de Ética de Investigación en Seres Humanos</p>
          </div>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="modern-form">
              <div class="input-group">
                <mat-form-field appearance="outline" class="full-width custom-field">
                  <mat-label>Correo Institucional</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="nombre.apellido@espoch.edu.ec" autocomplete="email">
                  <mat-icon matPrefix>alternate_email</mat-icon>
                  @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                    <mat-error>El email es obligatorio</mat-error>
                  }
                  @if (loginForm.get('email')?.hasError('email')) {
                    <mat-error>Ingresa un formato de correo válido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width custom-field">
                  <mat-label>Contraseña</mat-label>
                  <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="••••••••" autocomplete="current-password">
                  <mat-icon matPrefix>key</mat-icon>
                  <button mat-icon-button matSuffix (click)="togglePasswordVisibility()" type="button" aria-label="Toggle password visibility">
                    <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                    <mat-error>La contraseña es obligatoria</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="forgot-link">
                <a routerLink="/auth/forgot-password">¿Olvidaste tu contraseña?</a>
              </div>

              @if (errorMessage()) {
                <div class="error-banner animate-shake">
                  <mat-icon>error_outline</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <button mat-flat-button color="primary" type="submit" 
                      class="full-width login-btn" 
                      [disabled]="loginForm.invalid || isLoading() || isLocked()">
                @if (isLoading()) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else {
                  <span>{{ isLocked() ? 'Cuenta Bloqueada' : 'Acceder al Sistema' }}</span>
                }
              </button>

              <div class="divider">
                <span>o</span>
              </div>

              <div class="register-section">
                <span>¿No tienes una cuenta?</span>
                <a routerLink="/auth/register" class="register-link">Regístrate ahora</a>
              </div>
            </form>
          </mat-card-content>

          @if (attempts() > 0 && !isLocked()) {
            <div class="security-info">
              <mat-icon>shield</mat-icon>
              <span>Intento {{ attempts() }} de 3 permitidos</span>
            </div>
          }
        </mat-card>
      </div>

      <footer class="login-footer">
        <p>© 2026 Escuela Superior Politécnica de Chimborazo</p>
        <div class="footer-links">
          <a href="#">Privacidad</a>
          <a href="#">Soporte Técnico</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      position: relative;
      overflow: hidden;
      padding: 1rem;
    }

    /* Elementos decorativos animados */
    .blob {
      position: absolute;
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, rgba(0, 51, 102, 0.1) 0%, rgba(26, 82, 135, 0.05) 100%);
      filter: blur(80px);
      border-radius: 50%;
      z-index: 0;
      animation: float 20s infinite alternate ease-in-out;
    }

    .blob-1 { top: -100px; left: -100px; background: rgba(0, 51, 102, 0.08); }
    .blob-2 { bottom: -100px; right: -100px; background: rgba(220, 38, 38, 0.05); }

    @keyframes float {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(30px, 30px) scale(1.1); }
    }

    .login-container {
      width: 100%;
      max-width: 460px;
      position: relative;
      z-index: 10;
    }

    .login-card {
      padding: 3rem 2rem;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
    }

    .glass-effect {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 2.5rem;

      .logo-box {
        width: 72px;
        height: 72px;
        background: linear-gradient(135deg, #003366 0%, #1a5287 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 51, 102, 0.3);

        .brand-icon { color: white; font-size: 36px; width: 36px; height: 36px; }
      }

      .main-title {
        font-size: 2rem;
        font-weight: 800;
        color: #003366;
        margin: 0;
        letter-spacing: -1px;
      }

      .subtitle {
        color: #64748b;
        font-size: 0.95rem;
        margin-top: 0.5rem;
        font-weight: 500;
        line-height: 1.4;
      }
    }

    .modern-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .custom-field {
      ::ng-deep .mat-mdc-form-field-flex {
        border-radius: 14px !important;
        background: #f1f5f9 !important;
      }
      ::ng-deep .mat-mdc-form-field-outline { opacity: 0.5; }
    }

    .forgot-link {
      text-align: right;
      margin-top: -0.5rem;
      a {
        font-size: 0.85rem;
        font-weight: 600;
        color: #003366;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .login-btn {
      height: 56px;
      border-radius: 16px;
      font-size: 1.1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #003366 0%, #001f3f 100%) !important;
      margin-top: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -5px rgba(0, 51, 102, 0.4);
      }

      &:active:not(:disabled) { transform: translateY(0); }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fff1f2;
      border: 1px solid #ffe4e6;
      color: #be123c;
      padding: 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
      &::before, &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e2e8f0;
      }
      span { padding: 0 1rem; }
    }

    .register-section {
      text-align: center;
      font-size: 0.95rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .register-link {
        color: #003366;
        font-weight: 700;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .security-info {
      margin-top: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #94a3b8;
      font-size: 0.85rem;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .login-footer {
      margin-top: 3rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.85rem;
      z-index: 10;
      
      p { margin-bottom: 0.5rem; }
      .footer-links {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        a { color: #64748b; text-decoration: none; &:hover { color: #003366; } }
      }
    }

    .animate-in {
      animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  attempts = signal(0);
  isLocked = signal(false);
  hidePassword = signal(true);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLocked()) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.loginUseCase.execute(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard/home']);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          
          const errorMsg = err.message || '';
          if (errorMsg.includes('verificar') || errorMsg.includes('verify') || err.status === 403) {
            this.openOtpDialog(this.loginForm.value.email);
            return;
          }

          this.attempts.update(a => a + 1);
          this.errorMessage.set(err.message || 'Credenciales incorrectas');

          if (this.attempts() >= 3) {
            this.isLocked.set(true);
            this.errorMessage.set('Cuenta bloqueada temporalmente por seguridad.');
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  private openOtpDialog(email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { email },
      panelClass: 'modern-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onSubmit();
      }
    });
  }
}
