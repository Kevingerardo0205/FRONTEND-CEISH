import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginUseCase } from '../../application/use-cases/login.use-case';

@Component({
  selector: 'app-auth-page',
  template: `
    <div class="login-page">
      <div class="login-card card">
        <div class="text-center mb-2">
          <img src="assets/icons/espoch_logo.png" alt="Logo ESPOCH" style="height: 100px; margin-bottom: 1rem;">
          <h2>CEISH - ESPOCH</h2>
          <p class="text-muted">Inicia sesión para acceder al sistema</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-1">
            <label class="form-label">Email Institucional</label>
            <input 
              type="email" 
              class="form-control" 
              formControlName="email"
              placeholder="usuario@espoch.edu.ec"
              [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            >
          </div>

          <div class="mb-1">
            <label class="form-label">Contraseña</label>
            <input 
              type="password" 
              class="form-control" 
              formControlName="password"
              placeholder="••••••••"
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            >
          </div>

          <!-- Mensaje de Retroalimentación Mejorado -->
          <div *ngIf="errorMessage" class="alert alert-danger mt-1">
            <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
          </div>

          <button 
            type="submit" 
            class="btn btn-primary mt-1" 
            style="width: 100%;"
            [disabled]="loginForm.invalid || isLoading || isLocked"
          >
            {{ isLoading ? 'Procesando...' : (isLocked ? 'Cuenta Bloqueada' : 'Iniciar Sesión') }}
          </button>
        </form>

        <div class="text-center mt-1">
          <p *ngIf="attempts > 0 && !isLocked" class="text-muted" style="font-size: 0.8rem;">
            Intentos fallidos: {{ attempts }} de 3
          </p>
          <a href="#" class="text-muted" style="font-size: 0.85rem;">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { 
      min-height: 100vh; display: flex; align-items: center; justify-content: center; 
      background: linear-gradient(135deg, #003366 0%, #001f3f 100%);
    }
    .login-card { width: 400px; padding: 2.5rem; }
    h2 { color: #003366; }
    .alert-danger { background-color: #fce8e8; color: #a94442; border: 1px solid #ebccd1; padding: 10px; border-radius: 4px; }
  `],
  standalone: false
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
        next: () => {
          this.isLoading = false;
          // Forzar navegación al dashboard
          this.router.navigate(['/auth/admin-usuarios']).then(nav => {
            if (!nav) console.error('Fallo en la navegación');
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.attempts++;
          this.errorMessage = err.message; // Mensaje mejorado desde el repositorio

          if (this.attempts >= 3) {
            this.isLocked = true;
            this.errorMessage = 'Has superado el número de intentos. Cuenta bloqueada temporalmente.';
          }
        }
      });
    }
  }
}
