import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SecurityRole, CreateRoleDTO, UpdateRoleDTO } from '@domain/entities/security.entity';

export interface RoleDialogData {
  mode: 'create' | 'edit';
  role?: SecurityRole;
}

@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="dialog-container">
      <header class="dialog-header">
        <div class="icon-circle" [class.edit-mode]="isEditMode">
          <mat-icon>{{ isEditMode ? 'edit_note' : 'add_moderator' }}</mat-icon>
        </div>
        <div class="header-titles">
          <h2 mat-dialog-title>{{ isEditMode ? 'Editar Rol del Sistema' : 'Crear Nuevo Rol' }}</h2>
          <p class="subtitle">
            {{
              isEditMode
                ? 'Actualice la información y estado del perfil'
                : 'Defina el código, nombre y propósito del nuevo perfil de acceso'
            }}
          </p>
        </div>
      </header>

      <mat-dialog-content>
        <form [formGroup]="roleForm" class="role-form">
          <!-- Campo Código (Solo editable al crear) -->
          <div class="form-field-group">
            <label class="field-label"> Código del Rol <span class="required">*</span> </label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matPrefix>key</mat-icon>
              <input
                matInput
                formControlName="code"
                placeholder="Ej: EVALUADOR_EXTERNO"
                (input)="onCodeInput($event)"
                [readonly]="isEditMode"
              />
              <mat-hint *ngIf="!isEditMode">Letras mayúsculas, números y guiones bajos</mat-hint>
              <mat-error *ngIf="roleForm.get('code')?.hasError('required')">
                El código es obligatorio
              </mat-error>
              <mat-error *ngIf="roleForm.get('code')?.hasError('pattern')">
                Solo mayúsculas y guiones bajos (ej: COMITE_ETICA)
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Campo Nombre -->
          <div class="form-field-group">
            <label class="field-label"> Nombre Descriptivo <span class="required">*</span> </label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matPrefix>badge</mat-icon>
              <input
                matInput
                formControlName="name"
                placeholder="Ej: Evaluador Externo de Bioética"
              />
              <mat-error *ngIf="roleForm.get('name')?.hasError('required')">
                El nombre es obligatorio
              </mat-error>
              <mat-error *ngIf="roleForm.get('name')?.hasError('minlength')">
                Debe contener al menos 3 caracteres
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Campo Descripción -->
          <div class="form-field-group">
            <label class="field-label">
              Descripción del Perfil <span class="required">*</span>
            </label>
            <mat-form-field appearance="outline" class="full-width">
              <textarea
                matInput
                formControlName="description"
                rows="3"
                placeholder="Indique las responsabilidades y alcance de este rol en el CEISH..."
              ></textarea>
              <mat-error *ngIf="roleForm.get('description')?.hasError('required')">
                La descripción es obligatoria
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Estado Activo (Solo en edición) -->
          <div class="form-field-group toggle-group" *ngIf="isEditMode">
            <div class="toggle-info">
              <span class="toggle-title">Estado del Rol</span>
              <span class="toggle-desc"
                >Los roles inactivos no pueden ser asignados a nuevos usuarios</span
              >
            </div>
            <mat-slide-toggle formControlName="isActive" color="primary">
              {{ roleForm.get('isActive')?.value ? 'Activo' : 'Inactivo' }}
            </mat-slide-toggle>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="btn-cancel">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="roleForm.invalid"
          (click)="onSubmit()"
          class="btn-submit"
        >
          <mat-icon>{{ isEditMode ? 'save' : 'check_circle' }}</mat-icon>
          {{ isEditMode ? 'Guardar Cambios' : 'Crear Rol' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        padding: 1.5rem;
        max-width: 520px;
      }

      .dialog-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .icon-circle {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(0, 51, 102, 0.08);
        color: #003366;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 26px;
          width: 26px;
          height: 26px;
        }

        &.edit-mode {
          background: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
        }
      }

      .header-titles {
        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .subtitle {
          margin: 4px 0 0 0;
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.4;
        }
      }

      .role-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 0.5rem 0;
      }

      .form-field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .field-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;

          .required {
            color: #e11d48;
          }
        }

        .full-width {
          width: 100%;
        }
      }

      .toggle-group {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .toggle-title {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
          }

          .toggle-desc {
            font-size: 0.75rem;
            color: #64748b;
          }
        }
      }

      .dialog-actions {
        padding-top: 1.5rem;
        margin-top: 1rem;
        border-top: 1px solid #f1f5f9;
        gap: 10px;

        .btn-cancel {
          border-radius: 10px;
          font-weight: 600;
          color: #64748b;
        }

        .btn-submit {
          border-radius: 10px;
          padding: 0 20px;
          font-weight: 700;
          background: #003366;
          color: white;

          mat-icon {
            font-size: 18px;
            margin-right: 4px;
          }
        }
      }
    `,
  ],
})
export class RoleFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data.mode === 'edit';

  roleForm: FormGroup = this.fb.group({
    code: [
      { value: this.data.role?.code || '', disabled: this.isEditMode },
      [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9_]+$/)],
    ],
    name: [
      this.data.role?.name || '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    description: [
      this.data.role?.description || '',
      [Validators.required, Validators.maxLength(255)],
    ],
    isActive: [this.data.role?.isActive !== false],
  });

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.value = input.value.toUpperCase().replace(/\s+/g, '_');
      this.roleForm.get('code')?.setValue(input.value, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const formRaw = this.roleForm.getRawValue();
    if (this.isEditMode) {
      const updateData: UpdateRoleDTO = {
        name: formRaw.name,
        description: formRaw.description,
        isActive: formRaw.isActive,
      };
      this.dialogRef.close(updateData);
    } else {
      const createData: CreateRoleDTO = {
        code: formRaw.code,
        name: formRaw.name,
        description: formRaw.description,
      };
      this.dialogRef.close(createData);
    }
  }
}
