import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/get-users.use-case';
import { User, UserRole } from '../../../domain/entities/user.entity';

@Component({
  selector: 'app-user-register',
  template: `
    <div class="card">
      <h2 class="mb-1">{{ editMode ? 'Editar' : 'Registro de Nuevo' }} Usuario</h2>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <div class="mb-1">
          <label class="form-label">Nombre Completo</label>
          <input type="text" class="form-control" formControlName="nombre" placeholder="Ej: Juan Pérez">
        </div>

        <div class="mb-1">
          <label class="form-label">Email Institucional</label>
          <input type="email" class="form-control" formControlName="email" [readonly]="editMode" placeholder="usuario@espoch.edu.ec">
        </div>

        <div class="mb-1">
          <label class="form-label">Rol</label>
          <select class="form-control" formControlName="rol">
            <option *ngFor="let rol of roles" [value]="rol">{{rol}}</option>
          </select>
        </div>

        <div class="mb-1">
          <label class="form-label">Perfil / Cargo</label>
          <input type="text" class="form-control" formControlName="perfil" placeholder="Ej: Docente Investigador">
        </div>

        <div class="actions gap-1 mt-1" style="display: flex;">
          <button type="submit" class="btn btn-primary" style="flex: 1;" [disabled]="userForm.invalid || loading">
            {{ editMode ? 'Actualizar' : 'Registrar' }}
          </button>
          
          <button type="button" *ngIf="editMode" class="btn btn-outline" style="flex: 1;" (click)="onCancel()">
            Cancelar
          </button>
        </div>

        <div *ngIf="message" [ngClass]="isError ? 'error-text' : 'success-text'" class="mt-1 text-center">
          <strong>{{ message }}</strong>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .error-text { color: var(--color-secondary, #dc2626); }
    .success-text { color: var(--color-success, #16a34a); }
  `],
  standalone: false
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
      },
      error: (err) => {
        this.loading = false;
        this.message = err.message;
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
  }
}
