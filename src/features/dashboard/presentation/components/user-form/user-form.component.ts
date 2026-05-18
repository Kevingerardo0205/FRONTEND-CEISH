import { Component, input, output, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { GetRolesUseCase } from '@features/dashboard/use-cases';

@Component({
  selector: 'app-user-registration-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatChipsModule
  ],
  template: `
    <div class="high-end-card">
      <header class="form-header">
        <div class="header-icon">
          <mat-icon>{{ userToEdit() ? 'manage_accounts' : 'person_add' }}</mat-icon>
        </div>
        <div>
          <h2>{{ userToEdit() ? 'Modificar Perfil' : 'Registro de Profesional' }}</h2>
          <p>{{ userToEdit() ? 'Actualice los accesos y datos del usuario' : 'Gestión de nuevos integrantes al sistema' }}</p>
        </div>
      </header>

      <form [formGroup]="userForm" (ngSubmit)="submit()" class="animate-fade-in">

        <!-- BANNER INFORMATIVO: INVITACIÓN -->
        <div class="info-banner mb-4" *ngIf="!userToEdit()">
          <mat-icon>mail_outline</mat-icon>
          <div class="info-content">
            <strong>Flujo de Invitación Activo</strong>
            <p>Al registrar al usuario, el sistema enviará automáticamente un correo con un código de seguridad (OTP) para que configure su propia contraseña.</p>
          </div>
        </div>

        <div class="field-container">
          <label class="field-label">Cédula / ID Nacional</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="cedula" placeholder="Ej: 0601234567" maxlength="10">
            <mat-icon matSuffix class="text-muted">fingerprint</mat-icon>
            <mat-error>Ingrese una cédula válida</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Nombre Completo</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="nombre" placeholder="Ej: Dra. María López">
            <mat-icon matSuffix class="text-muted">badge</mat-icon>
            <mat-error>El nombre es obligatorio (min 5 carácteres)</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Correo Institucional</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="email" placeholder="usuario@espoch.edu.ec" type="email">
            <mat-icon matSuffix class="text-muted">alternate_email</mat-icon>
            <mat-error>Ingrese un correo válido</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Roles del Sistema</label>
          <mat-form-field appearance="outline" class="custom-field">
            <mat-select formControlName="roles" placeholder="--- SELECCIONE ROLES ---" multiple>
              <mat-option *ngFor="let r of availableRoles" [value]="r.code">
                {{ r.label }}
              </mat-option>
            </mat-select>
            <mat-icon matSuffix class="text-muted">admin_panel_settings</mat-icon>
            <mat-error>Seleccione al menos un rol</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container">
          <label class="field-label">Perfil Académico / Cargo</label>
          <mat-form-field appearance="outline" class="custom-field">
            <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
            <mat-icon matSuffix class="text-muted">work_outline</mat-icon>
            <mat-error>Campo requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="field-container d-flex align-items-center justify-content-between py-2" *ngIf="userToEdit()">
          <label class="field-label m-0">Estado de la cuenta</label>
          <div class="d-flex align-items-center gap-2">
            <span [class.text-primary]="userForm.get('activo')?.value" [class.text-muted]="!userForm.get('activo')?.value" class="small fw-bold">
              {{ userForm.get('activo')?.value ? 'ACTIVA' : 'REVOCADA' }}
            </span>
            <mat-slide-toggle formControlName="activo" color="primary"></mat-slide-toggle>
          </div>
        </div>

        <div class="actions-stack mt-4">
          <button mat-flat-button class="submit-btn" type="submit" [disabled]="userForm.invalid || isLoading()">
            <mat-spinner *ngIf="isLoading()" diameter="20" class="me-2"></mat-spinner>
            <span>{{ userToEdit() ? 'Guardar Cambios' : 'Confirmar Registro' }}</span>
          </button>
          <button mat-button class="cancel-btn" type="button" (click)="onCancel()">
            Descartar cambios
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .high-end-card {
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
      position: sticky;
      top: 2rem;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2.5rem;

      .header-icon {
        width: 48px; height: 48px;
        background: rgba(0, 51, 102, 0.05);
        color: vars.$color-primary;
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 24px; width: 24px; height: 24px; }
      }

      h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
      p { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 500; }
    }

    .info-banner {
      display: flex;
      gap: 12px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 16px;
      border-radius: 16px;
      color: #0369a1;
      mat-icon { color: #0ea5e9; }
      .info-content {
        strong { display: block; font-size: 0.85rem; margin-bottom: 2px; }
        p { margin: 0; font-size: 0.75rem; line-height: 1.4; color: #075985; }
      }
    }

    .field-container {
      margin-bottom: 1.5rem;
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
        box-shadow: 0 0 0 2px vars.$color-primary;
      }
    }

    .actions-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .submit-btn {
      height: 52px;
      background-color: vars.$color-primary !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 51, 102, 0.2); }
    }

    .cancel-btn {
      height: 48px;
      color: #64748b;
      font-weight: 600;
      border-radius: 12px;
      &:hover { background-color: #f1f5f9; color: vars.$color-primary; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserRegistrationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  userToEdit = input<UserAdmin | null>(null);
  isLoading = signal<boolean>(false);

  save = output<UserAdmin>();
  cancel = output<void>();

  readonly availableRoles = [
    { code: 'ADMIN_TI', label: 'Administrador TI' },
    { code: 'SECRETARIA', label: 'Secretaría' },
    { code: 'PRESIDENTE', label: 'Presidente/a' },
    { code: 'EVALUADOR', label: 'Evaluador' },
    { code: 'INVESTIGADOR', label: 'Investigador' }
  ];

  userForm: FormGroup = this.fb.group({
    cedula: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    roles: [[], [Validators.required, Validators.minLength(1)]],
    perfil: ['', [Validators.required]],
    activo: [true]
  });

  constructor() {
    effect(() => {
      const user = this.userToEdit();
      if (user) {
        this.userForm.patchValue({
          cedula: user.cedula || '',
          nombre: user.nombre,
          email: user.email,
          roles: user.roles || [user.rol],
          perfil: user.perfil,
          activo: user.activo !== false
        });
      } else {
        this.userForm.reset({ roles: [], activo: true });
      }
    });
  }

  ngOnInit() {}

  onCancel() {
    this.userForm.reset();
    this.cancel.emit();
  }

  submit() {
    if (this.userForm.valid) {
      const formVal = this.userForm.value;
      // El backend espera roles[], pero para compatibilidad con la interfaz UserAdmin 
      // seteamos rol como el primero del array.
      this.save.emit({
        ...this.userToEdit(),
        ...formVal,
        rol: formVal.roles[0]
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}

