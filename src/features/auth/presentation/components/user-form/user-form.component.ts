import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegisterUserUseCase, UpdateUserUseCase } from '../../../use-cases';
import { User, UserRole } from '@domain/entities/user.entity';
import { NotificationService } from '@infrastructure/services/notification.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="minimal-form-container">
      <div class="form-header">
        <h2 class="form-title">{{ editMode ? 'Editar Perfil' : 'Nuevo Usuario' }}</h2>
        <p class="form-subtitle">Gestión de identidad y permisos</p>
      </div>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
        
        <div class="input-group">
          <label class="minimal-label">Nombre Completo</label>
          <mat-form-field appearance="outline" class="full-width minimal-field">
            <input matInput formControlName="nombre" placeholder="Ej: Juan Pérez">
            <mat-icon matPrefix>person_outline</mat-icon>
            <mat-error *ngIf="userForm.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
          </mat-form-field>
        </div>

        <div class="input-group">
          <label class="minimal-label">Email Institucional</label>
          <mat-form-field appearance="outline" class="full-width minimal-field">
            <input matInput type="email" formControlName="email" [readonly]="editMode" placeholder="usuario@espoch.edu.ec">
            <mat-icon matPrefix>mail_outline</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <div class="input-group flex-1">
            <label class="minimal-label">Rol</label>
            <mat-form-field appearance="outline" class="full-width minimal-field">
              <mat-select formControlName="rol">
                <mat-option *ngFor="let rol of roles" [value]="rol">{{rol}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="input-group flex-1">
            <label class="minimal-label">Perfil</label>
            <mat-form-field appearance="outline" class="full-width minimal-field">
              <input matInput formControlName="perfil" placeholder="Ej: Docente">
            </mat-form-field>
          </div>
        </div>

        <div class="form-actions mt-2">
          <button mat-flat-button color="primary" type="submit" [disabled]="userForm.invalid || loading" class="minimal-submit-btn">
            <span *ngIf="!loading">{{ editMode ? 'Actualizar Datos' : 'Crear Usuario' }}</span>
            <mat-spinner *ngIf="loading" diameter="20" class="spinner-inline"></mat-spinner>
          </button>
          
          <button mat-button type="button" *ngIf="editMode" (click)="onCancel()" class="minimal-cancel-btn">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .minimal-form-container {
      padding: 0 1rem;
    }

    .form-header {
      margin-bottom: 2.5rem;
      .form-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
      .form-subtitle { margin: 0.25rem 0 0; font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
    }

    .user-form { display: flex; flex-direction: column; gap: 1.25rem; }
    
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .minimal-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-left: 2px;
      }
    }

    .minimal-field {
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 12px !important;
      }
      ::ng-deep .mat-mdc-form-field-focus-overlay { background-color: transparent !important; }
      ::ng-deep .mdc-notched-outline { border: 1px solid rgba(0,0,0,0.04) !important; }
      ::ng-deep .mdc-notched-outline__leading,
      ::ng-deep .mdc-notched-outline__notch,
      ::ng-deep .mdc-notched-outline__trailing { border-color: rgba(0,0,0,0.04) !important; }
      
      mat-icon { color: #94a3b8; }
    }

    .form-row { display: flex; gap: 1.5rem; }
    .flex-1 { flex: 1; }
    .full-width { width: 100%; }
    .mt-2 { margin-top: 2rem; }
    
    .form-actions { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .minimal-submit-btn {
      height: 48px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      background-color: #0f172a; // Negro minimalista
      color: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      
      &:disabled { background-color: #e2e8f0; }
    }

    .minimal-cancel-btn {
      height: 40px;
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .spinner-inline { display: inline-block; margin-right: 8px; }
  `]
})
export class UserFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(RegisterUserUseCase);
  private readonly updateUserUseCase = inject(UpdateUserUseCase);
  private readonly notifyService = inject(NotificationService);

  @Input() userToEdit: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  userForm: FormGroup;
  loading = false;
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

    const obs = this.editMode 
      ? this.updateUserUseCase.execute(this.userToEdit!.id!, this.userForm.value)
      : this.registerUseCase.execute(this.userForm.value);

    obs.subscribe({
      next: () => {
        this.loading = false;
        const msg = this.editMode ? 'Perfil actualizado con éxito' : 'Usuario creado con éxito';
        this.notifyService.notify(msg, 'success');
        this.reset();
        this.saved.emit();
      },
      error: (err: any) => {
        this.loading = false;
        this.notifyService.notify(err.message || 'Error en la operación', 'error');
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
