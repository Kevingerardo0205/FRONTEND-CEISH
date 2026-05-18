import { Component, inject, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { SetupAccountUseCase } from '../../use-cases';
import { SetupAccountRequest } from '../../domain/entities/setup-account.request';

@Component({
  selector: 'app-setup-account-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatInputModule,
    MatDividerModule,
    RouterModule
  ],
  template: `
    <div class="setup-container">
      <mat-card class="setup-card animate-fade-in">
        <div class="setup-header">
          <div class="icon-circle">
            <mat-icon>person_add_alt</mat-icon>
          </div>
          <h1>Configurar Cuenta</h1>
          <p class="subtitle">Bienvenido al sistema CEISH. Por favor, ingrese el código enviado a su correo y configure su contraseña.</p>
          <div class="email-badge">{{ email }}</div>
        </div>

        <mat-card-content>
          <form [formGroup]="setupForm" (ngSubmit)="onSubmit()" class="setup-form">
            
            <div class="section-label">Código de Verificación (OTP)</div>
            <div class="otp-inputs" formArrayName="otp">
              @for (control of otpControls.controls; track $index) {
                <input
                  #otpInput
                  type="text"
                  [formControlName]="$index"
                  maxlength="1"
                  class="otp-field"
                  (keyup)="onOtpKeyUp($event, $index)"
                  (keypress)="onKeyPressNumber($event)"
                  autocomplete="off"
                  inputmode="numeric"
                />
              }
            </div>

            <mat-divider class="my-4"></mat-divider>

            <div class="section-label">Nueva Contraseña</div>
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error>Mínimo 8 caracteres</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Confirmar Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="confirmPassword">
              <mat-error *ngIf="setupForm.hasError('mismatch')">Las contraseñas no coinciden</mat-error>
            </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <button mat-flat-button color="primary" class="submit-btn" 
                    [disabled]="setupForm.invalid || isLoading">
              @if (!isLoading) {
                ACTIVAR CUENTA
              } @else {
                <mat-progress-spinner diameter="24" mode="indeterminate"></mat-progress-spinner>
              }
            </button>
          </form>
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
    .setup-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      padding: 1rem;
    }

    .setup-card {
      max-width: 500px;
      width: 100%;
      padding: 2.5rem 1.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    }

    .setup-header {
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
      .subtitle { color: #64748b; margin: 0; font-size: 0.9rem; }
      .email-badge { 
        display: inline-block;
        margin-top: 0.75rem;
        background: #f1f5f9;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        color: #0369a1;
        font-weight: 700;
        font-size: 0.9rem;
      }
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-label {
      font-size: 0.8rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .otp-inputs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .otp-field {
      width: 45px;
      height: 55px;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 800;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
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

    .submit-btn {
      height: 56px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1rem;
      margin-top: 1rem;
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

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SetupAccountPage implements OnInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly setupAccountUC = inject(SetupAccountUseCase);

  setupForm: FormGroup;
  email: string = '';
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor() {
    this.setupForm = this.fb.group({
      otp: this.fb.array(Array(6).fill('').map(() => new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]$')
      ]))),
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get otpControls() {
    return this.setupForm.get('otp') as FormArray;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      if (!this.email) {
        this.snackBar.open('⚠️ Enlace de invitación inválido. Falta el correo.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/auth/login']);
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onOtpKeyUp(event: any, index: number) {
    const inputs = this.otpInputs.toArray();
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      inputs[index - 1].nativeElement.focus();
    } else if (event.target.value && index < 5) {
      inputs[index + 1].nativeElement.focus();
    }
  }

  onSubmit() {
    if (this.setupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const payload: SetupAccountRequest = {
        email: this.email,
        otp: this.setupForm.value.otp.join(''),
        password: this.setupForm.value.password
      };

      this.setupAccountUC.execute(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('✅ Cuenta configurada con éxito. Ya puede iniciar sesión.', 'Entendido', {
            duration: 6000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message || 'Código incorrecto o error al activar cuenta.';
          this.setupForm.get('otp')?.reset();
          this.otpInputs.first.nativeElement.focus();
        }
      });
    }
  }
}
