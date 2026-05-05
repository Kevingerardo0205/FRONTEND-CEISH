import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VerifyOtpUseCase } from '../../../use-cases';

interface DialogData {
  email: string;
}

@Component({
  selector: 'app-otp-verification-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="otp-premium-wrapper">
      <div class="glass-header">
        <div class="icon-circle">
          <mat-icon>shield_lock</mat-icon>
        </div>
        <h2 mat-dialog-title class="m-0">Verificación de Seguridad</h2>
        <p class="subtitle">Protegiendo tu cuenta institucional</p>
      </div>
      
      <mat-dialog-content class="dialog-content pt-4">
        <div class="info-card">
          <p class="instruction-text">
            Hemos enviado un código de acceso a:
            <span class="email-badge">{{ data.email }}</span>
          </p>
        </div>

        <form [formGroup]="otpForm" (ngSubmit)="onVerify()" class="otp-form mt-4">
          <div class="otp-input-container">
            <mat-form-field appearance="outline" class="full-width custom-otp-field">
              <mat-label>Código de 6 dígitos</mat-label>
              <input matInput formControlName="code" placeholder="· · · · · ·" 
                     maxlength="6" class="otp-main-input" 
                     (keypress)="onKeyPressNumber($event)">
              <mat-icon matSuffix color="primary">key</mat-icon>
              <mat-hint>Ingrese el código recibido en su bandeja</mat-hint>
            </mat-form-field>
          </div>

          <div *ngIf="errorMessage" class="error-glass animate-shake">
            <mat-icon>warning</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="actions-group mt-5">
            <button mat-flat-button class="premium-verify-btn" 
                    [disabled]="otpForm.invalid || isLoading">
              <div class="btn-content" *ngIf="!isLoading">
                <span>VERIFICAR AHORA</span>
                <mat-icon>verified</mat-icon>
              </div>
              <mat-progress-spinner *ngIf="isLoading" diameter="24" mode="indeterminate" class="white-spinner"></mat-progress-spinner>
            </button>
            
            <button mat-button type="button" class="cancel-link" (click)="onClose()">
              Cancelar inicio de sesión
            </button>
          </div>
        </form>

        <div class="resend-footer mt-4">
          <div class="divider"></div>
          <p class="small text-muted mb-2">¿No recibiste nada?</p>
          <button mat-stroked-button class="resend-btn" [disabled]="resendDisabled" (click)="onResend()">
            <mat-icon>refresh</mat-icon>
            {{ resendDisabled ? 'Reintentar en ' + timer + 's' : 'Reenviar Código' }}
          </button>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .otp-premium-wrapper {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      text-align: center;
    }

    .glass-header {
      background: linear-gradient(135deg, #003366 0%, #1a5287 100%);
      padding: 2.5rem 1.5rem;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .icon-circle {
        width: 60px; height: 60px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 0.5rem;
        mat-icon { font-size: 32px; width: 32px; height: 32px; }
      }

      h2 { font-weight: 800; letter-spacing: -0.5px; font-size: 1.5rem; }
      .subtitle { opacity: 0.8; font-size: 0.85rem; font-weight: 500; margin: 0; }
    }

    .dialog-content { padding: 1.5rem 2rem; }

    .info-card {
      background: #f8fafc;
      border-radius: 16px;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      .instruction-text { margin: 0; color: #64748b; font-size: 0.9rem; }
      .email-badge { display: block; color: #003366; font-weight: 800; font-size: 0.95rem; margin-top: 0.25rem; }
    }

    .custom-otp-field {
      ::ng-deep .mat-mdc-form-field-flex { background-color: #f1f5f9 !important; border-radius: 12px !important; }
      ::ng-deep .mat-mdc-text-field-wrapper { padding-top: 8px !important; }
      .otp-main-input { 
        text-align: center; font-size: 1.75rem !important; 
        letter-spacing: 8px; font-weight: 900; color: #003366;
      }
    }

    .error-glass {
      background: rgba(225, 29, 72, 0.08);
      color: #be123c;
      padding: 0.75rem;
      border-radius: 12px;
      border: 1px solid rgba(225, 29, 72, 0.2);
      font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      margin-top: 1rem;
      font-weight: 600;
    }

    .premium-verify-btn {
      width: 100%;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #003366 0%, #001f3f 100%) !important;
      color: white !important;
      font-weight: 800;
      letter-spacing: 0.5px;
      box-shadow: 0 10px 15px -3px rgba(0, 51, 102, 0.3);
      transition: all 0.3s ease;

      .btn-content { display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(0, 51, 102, 0.4); }
      &:disabled { background: #94a3b8 !important; opacity: 0.7; }
    }

    .white-spinner ::ng-deep circle { stroke: white !important; }

    .cancel-link { margin-top: 1rem; color: #64748b !important; font-weight: 600; font-size: 0.85rem; }

    .resend-footer {
      .divider { height: 1px; background: #e2e8f0; margin-bottom: 1.5rem; }
      .resend-btn { 
        border-radius: 12px; font-weight: 700; color: #003366;
        mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
      }
    }

    .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `]
})
export class OtpVerificationDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly verifyOtpUseCase = inject(VerifyOtpUseCase);
  private readonly dialogRef = inject(MatDialogRef<OtpVerificationDialogComponent>);
  public readonly data: DialogData = inject(MAT_DIALOG_DATA);

  otpForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  resendDisabled = false;
  timer = 60;

  constructor() {
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onVerify() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.verifyOtpUseCase.execute(this.data.email, this.otpForm.value.code).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.dialogRef.close(true); // Éxito
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Código incorrecto';
        }
      });
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onResend() {
    this.resendDisabled = true;
    this.startTimer();
    console.log('Reenviando código a:', this.data.email);
  }

  private startTimer() {
    this.timer = 60;
    const interval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.resendDisabled = false;
        clearInterval(interval);
      }
    }, 1000);
  }
}
