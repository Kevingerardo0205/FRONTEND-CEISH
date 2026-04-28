import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserAdmin } from '@domain/entities/user-admin.entity';

@Component({
  selector: 'app-user-registration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="floating-card">
      <header class="form-header">
        <h2>{{ userToEdit() ? 'Modificar Perfil' : 'Registro de Profesional' }}</h2>
        <p>Complete los datos para la gestión de accesos</p>
      </header>

      <form [formGroup]="userForm" (ngSubmit)="submit()">
        <div class="field">
          <label>Nombre Completo</label>
          <mat-form-field appearance="outline">
            <input matInput formControlName="nombre" placeholder="Ej: Dra. María López">
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>
        </div>

        <div class="field">
          <label>Correo Institucional</label>
          <mat-form-field appearance="outline">
            <input matInput formControlName="email" placeholder="usuario@espoch.edu.ec">
            <mat-icon matPrefix>alternate_email</mat-icon>
          </mat-form-field>
        </div>

        <div class="row">
          <div class="field flex-1">
            <label>Rol asignado</label>
            <mat-form-field appearance="outline">
              <mat-select formControlName="rol">
                <mat-option value="ADMIN">ADMIN</mat-option>
                <mat-option value="INVESTIGADOR">INVESTIGADOR</mat-option>
                <mat-option value="EVALUADOR">EVALUADOR</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="field">
          <label>Perfil / Cargo</label>
          <mat-form-field appearance="outline">
            <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
          </mat-form-field>
        </div>

        <div class="actions">
          <button mat-flat-button class="submit-btn" type="submit" [disabled]="userForm.invalid">
            {{ userToEdit() ? 'Guardar Cambios' : 'Registrar Profesional' }}
          </button>
          <button mat-button class="cancel-btn" type="button" (click)="cancel.emit()">
            Descartar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .floating-card { 
      background: #ffffff; 
      padding: 2.5rem 2rem; 
      border-radius: 20px; 
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04); 
      border: 1px solid #e2e8f0; 
      position: sticky; 
      top: 2rem; 
    }
    
    .form-header { 
      margin-bottom: 2rem; 
      h2 { 
        margin: 0; 
        font-size: 1.25rem; 
        font-weight: 800; 
        color: #003366; 
        letter-spacing: -0.5px; 
      } 
      p { 
        margin: 0.25rem 0 0; 
        font-size: 0.8rem; 
        color: #64748b; 
        font-weight: 500; 
      } 
    }
    
    .field { 
      display: flex; 
      flex-direction: column; 
      gap: 0.5rem; 
      margin-bottom: 1.25rem; 
      label { 
        font-size: 0.7rem; 
        font-weight: 700; 
        color: #64748b; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
      } 
    }
    
    ::ng-deep { 
      .mat-mdc-form-field { width: 100%; } 
      .mat-mdc-text-field-wrapper { 
        background-color: #f8fafc !important; 
        border-radius: 10px !important; 
        transition: all 0.2s ease;
      } 
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing { 
        border-color: #e2e8f0 !important; 
      } 
      .mat-mdc-form-field-focus-overlay { background-color: transparent !important; } 
      
      .mat-mdc-form-field.mat-focused .mat-mdc-text-field-wrapper {
        background-color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.05);
      }
    }
    
    .row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    
    .actions { 
      display: flex; 
      flex-direction: column; 
      gap: 0.75rem; 
      margin-top: 2rem; 
    }
    
    .submit-btn { 
      background-color: #003366 !important; 
      color: #ffffff !important; 
      height: 48px; 
      border-radius: 12px; 
      font-weight: 700; 
      font-size: 0.9rem; 
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
      transition: all 0.3s ease !important;

      &:hover:not([disabled]) {
        background-color: #1a5287 !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 51, 102, 0.2);
      }
    }
    
    .cancel-btn { 
      height: 40px; 
      color: #64748b; 
      font-weight: 600; 
      border-radius: 10px;
      &:hover { background-color: #f1f5f9; color: #003366; }
    }
  `]
})
export class UserRegistrationFormComponent {
  private fb = inject(FormBuilder);
  
  userToEdit = input<UserAdmin | null>(null);
  save = output<UserAdmin>();
  cancel = output<void>();

  userForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['INVESTIGADOR', [Validators.required]],
    perfil: ['', [Validators.required]]
  });

  submit() {
    if (this.userForm.valid) {
      this.save.emit(this.userForm.value);
    }
  }
}
