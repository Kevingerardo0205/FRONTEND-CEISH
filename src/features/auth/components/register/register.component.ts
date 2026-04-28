import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegisterUserUseCase, UpdateUserUseCase } from '../../use-cases';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="mat-elevation-z4">
      <mat-card-header>
        <mat-card-title>{{ editMode ? 'Editar Usuario' : 'Registro de Nuevo Usuario' }}</mat-card-title>
        <mat-card-subtitle>{{ editMode ? 'Modificar datos del usuario seleccionado' : 'Completar los datos para un nuevo registro' }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="register-form mt-1">
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre Completo</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: Juan Pérez">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="userForm.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Institucional</mat-label>
            <input matInput type="email" formControlName="email" [readonly]="editMode" placeholder="usuario@espoch.edu.ec">
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="userForm.get('email')?.hasError('required')">El email es requerido</mat-error>
            <mat-error *ngIf="userForm.get('email')?.hasError('email') || userForm.get('email')?.hasError('pattern')">
              Debe ser un correo válido @espoch.edu.ec
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Rol</mat-label>
            <mat-select formControlName="rol">
              <mat-option *ngFor="let rol of roles" [value]="rol">{{rol}}</mat-option>
            </mat-select>
            <mat-icon matPrefix>badge</mat-icon>
            <mat-error *ngIf="userForm.get('rol')?.hasError('required')">El rol es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Perfil / Cargo</mat-label>
            <input matInput formControlName="perfil" placeholder="Ej: Docente Investigador">
            <mat-icon matPrefix>work</mat-icon>
            <mat-error *ngIf="userForm.get('perfil')?.hasError('required')">El perfil es requerido</mat-error>
          </mat-form-field>

          <div *ngIf="message" class="message-container" [ngClass]="isError ? 'error-msg' : 'success-msg'">
            <mat-icon>{{ isError ? 'error_outline' : 'check_circle' }}</mat-icon>
            <span>{{ message }}</span>
          </div>

          <div class="actions gap-1 mt-1">
            <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid || loading" class="flex-1">
              <mat-icon *ngIf="!loading">{{ editMode ? 'save' : 'person_add' }}</mat-icon>
              <mat-spinner *ngIf="loading" diameter="20" class="spinner-inline"></mat-spinner>
              {{ editMode ? 'Actualizar' : 'Registrar' }}
            </button>
            
            <button mat-button type="button" *ngIf="editMode" (click)="onCancel()" class="flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .full-width { width: 100%; }
    .mt-1 { margin-top: 1rem; }
    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .flex-1 { flex: 1; }
    .message-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .error-msg { background-color: #fce8e8; color: #a94442; }
    .success-msg { background-color: #d4edda; color: #3c763d; }
    .spinner-inline { display: inline-block; margin-right: 8px; }
  `]
})
export class RegisterComponent implements OnChanges {
  @Input() userToEdit: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  userForm: FormGroup;
  loading = false;
  message = '';
  isError = false;
  editMode = false;
  roles: UserRole[] = ['SECRETARIA', 'EVALUADOR', 'INVESTIGADOR', 'PRESIDENTA', 'ADMIN'];

  constructor(
    private fb: FormBuilder,
    private registerUseCase: RegisterUserUseCase,
    private updateUserUseCase: UpdateUserUseCase
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@espoch\.edu\.ec$/)]],
      rol: ['INVESTIGADOR', [Validators.required]],
      perfil: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userToEdit'] && this.userToEdit) {
      this.editMode = true;
      this.userForm.patchValue(this.userToEdit);
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    this.loading = true;
    this.message = '';

    const obs = this.editMode 
      ? this.updateUserUseCase.execute(this.userToEdit!.id!, this.userForm.value)
      : this.registerUseCase.execute(this.userForm.value);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.message = this.editMode ? 'Actualizado con éxito' : 'Registrado con éxito';
        this.isError = false;
        this.reset();
        this.saved.emit();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.message = err.message || 'Error al procesar la solicitud';
        this.isError = true;
      }
    });
  }

  onCancel() {
    this.reset();
    this.cancel.emit();
  }

  private reset() {
    this.editMode = false;
    this.userToEdit = null;
    this.userForm.reset({ rol: 'INVESTIGADOR' });
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.setErrors(null);
    });
  }
}
