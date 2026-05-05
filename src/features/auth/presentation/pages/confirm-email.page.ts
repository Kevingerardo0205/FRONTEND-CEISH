import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VerifyOtpUseCase } from '../../use-cases';

@Component({
  selector: 'app-confirm-email-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  template: `
    <div class="otp-container">
      <mat-card class="otp-card animate-fade-in">
        <div class="otp-header">
          <div class="icon-circle">
            <mat-icon>mark_email_read</mat-icon>
          </div>
          <h1>Verifique su cuenta</h1>
          <p class="subtitle">Hemos enviado un código de 6 dígitos a:</p>
          <div class="email-badge">{{ email }}</div>
        </div>

        <mat-card-content>
          <form [formGroup]="otpForm" (ngSubmit)="onVerify()" class="otp-form">
            <div class="otp-inputs" formArrayName="code">
              @for (control of codeControls.controls; track $index) {
                <input
                  #otpInput
                  type="text"
                  [formControlName]="$index"
                  maxlength="1"
                  class="otp-field"
                  (keyup)="onKeyUp($event, $index)"
                  (keypress)="onKeyPressNumber($event)"
                  autocomplete="off"
                  inputmode="numeric"
                />
              }
            </div>

            @if (errorMessage) {
              <div class="error-message">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <button mat-flat-button color="primary" class="verify-btn" 
                    [disabled]="otpForm.invalid || isLoading">
              @if (!isLoading) {
                VERIFICAR CUENTA
              } @else {
                <mat-progress-spinner diameter="24" mode="indeterminate"></mat-progress-spinner>
              }
            </button>
          </form>

          <div class="resend-section">
            <p>¿No recibiste el código?</p>
            <button mat-button color="primary" [disabled]="resendDisabled" (click)="onResend()">
              {{ resendDisabled ? 'Reenviar en ' + timer + 's' : 'Reenviar nuevo código' }}
            </button>
          </div>
        </mat-card-content>

        <mat-card-footer>
          <a routerLink="/auth/login" class="back-link">
            <mat-icon>arrow_back</mat-icon> Volver al inicio de sesión
          </a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .otp-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      padding: 1rem;
    }

    .otp-card {
      max-width: 450px;
      width: 100%;
      padding: 2.5rem 1.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    }

    .otp-header {
      text-align: center;
      margin-bottom: 2rem;

      .icon-circle {
        width: 64px;
        height: 64px;
        background: #e0f2fe;
        color: #0369a1;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        mat-icon { font-size: 32px; width: 32px; height: 32px; }
      }

      h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
      .subtitle { color: #64748b; margin: 0; }
      .email-badge { 
        display: inline-block;
        margin-top: 0.5rem;
        background: #f1f5f9;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        color: #0f172a;
        font-weight: 700;
        font-size: 0.9rem;
      }
    }

    .otp-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .otp-inputs {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }

    .otp-field {
      width: 50px;
      height: 60px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 800;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      transition: all 0.2s;

      &:focus {
        border-color: #0369a1;
        background: white;
        box-shadow: 0 0 0 4px rgba(3, 105, 161, 0.1);
        outline: none;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #e11d48;
      background: #fff1f2;
      padding: 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .verify-btn {
      height: 56px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: 0.5px;
    }

    .resend-section {
      text-align: center;
      margin-top: 1.5rem;
      p { color: #64748b; font-size: 0.875rem; margin-bottom: 0.25rem; }
    }

    .back-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      color: #64748b;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      &:hover { color: #0f172a; }
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ConfirmEmailPage implements OnInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly verifyOtpUseCase = inject(VerifyOtpUseCase);

  otpForm: FormGroup;
  email: string = '';
  isLoading = false;
  errorMessage = '';
  resendDisabled = false;
  timer = 60;

  constructor() {
    this.otpForm = this.fb.group({
      code: this.fb.array(Array(6).fill('').map(() => new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]$')
      ])))
    });
  }

  get codeControls() {
    return this.otpForm.get('code') as FormArray;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      if (!this.email) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onKeyUp(event: any, index: number) {
    const inputs = this.otpInputs.toArray();
    
    // Si se presiona Backspace y el campo está vacío, ir al anterior
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      inputs[index - 1].nativeElement.focus();
    } 
    // Si se ingresó un número, ir al siguiente
    else if (event.target.value && index < 5) {
      inputs[index + 1].nativeElement.focus();
    }

    // Si el formulario está completo, podrías disparar el envío automáticamente
    if (this.otpForm.valid && index === 5) {
      this.onVerify();
    }
  }

  onVerify() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const otpCode = this.otpForm.value.code.join('');
      
      this.verifyOtpUseCase.execute(this.email, otpCode).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('✅ ¡Cuenta verificada! Ya puede iniciar sesión.', 'Entendido', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Código incorrecto. Intente de nuevo.';
          // Limpiar campos en caso de error para reintento
          this.otpForm.reset();
          this.otpInputs.first.nativeElement.focus();
        }
      });
    }
  }

  onResend() {
    this.resendDisabled = true;
    this.startTimer();
    // Aquí iría la llamada al caso de uso de reenviar OTP si existiera
    this.snackBar.open('📬 Nuevo código enviado a su correo.', 'Cerrar', { duration: 3000 });
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
