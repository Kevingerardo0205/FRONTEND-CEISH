import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoginUseCase } from '../use-cases';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card mat-elevation-z8">
        <mat-card-header class="login-header">
          <div class="login-logo-container">
            <mat-icon class="login-icon">verified_user</mat-icon>
          </div>
          <mat-card-title>CEISH - ESPOCH</mat-card-title>
          <mat-card-subtitle>Inicia sesión para acceder al sistema</mat-card-subtitle>
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
              <input matInput type="password" formControlName="password" placeholder="••••••••">
              <mat-icon matPrefix>lock</mat-icon>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="loginForm.invalid || isLoading || isLocked">
              <span *ngIf="!isLoading">{{ isLocked ? 'Cuenta Bloqueada' : 'Iniciar Sesión' }}</span>
              <mat-spinner *ngIf="isLoading" diameter="24"></mat-spinner>
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <p *ngIf="attempts > 0 && !isLocked" class="attempts-text">Intentos fallidos: {{ attempts }} de 3</p>
          <a mat-button color="accent" href="#">¿Olvidaste tu contraseña?</a>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 2rem 1rem;
      border-radius: 12px;
    }
    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2rem;
    }
    .login-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1e3c72;
    }
    .login-logo-container {
      margin-bottom: 1rem;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      height: 48px;
      font-size: 1.1rem;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #fce8e8;
      color: #a94442;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .login-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 1.5rem;
    }
    .attempts-text {
      color: #666;
      font-size: 0.85rem;
      margin: 0;
    }
  `]
})
export class AuthPage {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  attempts = 0;
  isLocked = false;

  constructor(
    private fb: FormBuilder,
    private loginUseCase: LoginUseCase,
    private router: Router
  ) {
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
        next: (response: any) => {
          console.log('Login exitoso, navegando al dashboard...', response);
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.attempts++;
          this.errorMessage = err.message || 'Error al iniciar sesión';

          if (this.attempts >= 3) {
            this.isLocked = true;
            this.errorMessage = 'Has superado el número de intentos. Cuenta bloqueada temporalmente.';
          }
        }
      });
    }
  }
}
