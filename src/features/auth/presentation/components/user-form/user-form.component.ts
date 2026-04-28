import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegisterUserUseCase, UpdateUserUseCase } from '../../../use-cases';
import { User, UserRole } from '@domain/entities/user.entity';

@Component({
  selector: 'app-user-form',
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
    <mat-card class="user-form-card mat-elevation-z2">
      <mat-card-header>
        <mat-card-title>{{ editMode ? 'Editar Usuario' : 'Nuevo Usuario' }}</mat-card-title>
        <mat-card-subtitle>{{ editMode ? 'Actualice la información del perfil' : 'Complete los datos de registro' }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form mt-1">
          
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
              Debe ser un correo @espoch.edu.ec
            </mat-error>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Rol</mat-label>
              <mat-select formControlName="rol">
                <mat-option *ngFor="let rol of roles" [value]="rol">{{rol}}</mat-option>
              </mat-select>
              <mat-icon matPrefix>badge</mat-icon>
              <mat-error *ngIf="userForm.get('rol')?.hasError('required')">Requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-2">
              <mat-label>Perfil / Cargo</mat-label>
              <input matInput formControlName="perfil" placeholder="Ej: Docente">
              <mat-icon matPrefix>work</mat-icon>
              <mat-error *ngIf="userForm.get('perfil')?.hasError('required')">Requerido</mat-error>
            </mat-form-field>
          </div>

          <div *ngIf="message" class="message-container" [ngClass]="isError ? 'error-msg' : 'success-msg'">
            <mat-icon>{{ isError ? 'error_outline' : 'check_circle' }}</mat-icon>
            <span>{{ message }}</span>
          </div>

          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="userForm.invalid || loading" class="submit-btn">
              <mat-icon *ngIf="!loading">{{ editMode ? 'save' : 'person_add' }}</mat-icon>
              <mat-spinner *ngIf="loading" diameter="20" class="spinner-inline"></mat-spinner>
              {{ editMode ? 'Guardar Cambios' : 'Registrar Usuario' }}
            </button>
            
            <button mat-button type="button" *ngIf="editMode" (click)="onCancel()" class="cancel-btn">
              Cancelar
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .user-form-card { border-radius: 12px; }
    .user-form { display: flex; flex-direction: column; gap: 0.25rem; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .mt-1 { margin-top: 1rem; }
    
    .actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem; }
    .submit-btn { height: 48px; border-radius: 8px; font-weight: 600; }
    .cancel-btn { height: 40px; }

    .message-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.85rem;
    }
    .error-msg { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
    .success-msg { background-color: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
    .spinner-inline { display: inline-block; margin-right: 8px; }
  `]
})
export class UserFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(RegisterUserUseCase);
  private readonly updateUserUseCase = inject(UpdateUserUseCase);

  @Input() userToEdit: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  userForm: FormGroup;
  loading = false;
  message = '';
  isError = false;
  editMode = false;
  roles: UserRole[] = ['SECRETARIA', 'EVALUADOR', 'INVESTIGADOR', 'PRESIDENTA', 'ADMIN'];

  constructor() {
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
        this.message = this.editMode ? 'Usuario actualizado' : 'Usuario registrado';
        this.isError = false;
        this.reset();
        this.saved.emit();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.message = err.message || 'Error en la operación';
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
