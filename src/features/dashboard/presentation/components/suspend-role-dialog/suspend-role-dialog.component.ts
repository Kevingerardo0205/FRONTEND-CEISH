import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface SuspendRoleDialogData {
  userId: string;
  userName: string;
  roleCode: string;
  roleName: string;
  validUntil?: string | null;
}

export interface SuspendRoleDialogResult {
  reason: string;
}

@Component({
  selector: 'app-suspend-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="suspend-dialog-card">
      <div class="top-accent"></div>

      <div class="dialog-header">
        <div class="header-icon-box">
          <mat-icon>gavel</mat-icon>
        </div>
        <div class="header-text">
          <h2 class="dialog-title">Suspender Suplencia Temporal</h2>
          <p class="dialog-subtitle">Finalización y revocación anticipada de atribuciones</p>
        </div>
      </div>

      <!-- AVISO DE AUDITORÍA INSTITUCIONAL -->
      <div class="warning-banner">
        <mat-icon class="warning-icon">warning_amber</mat-icon>
        <div class="warning-text">
          <strong>Atención:</strong> La suplencia del rol
          <em>{{ data.roleName || data.roleCode }}</em> para
          <strong>{{ data.userName }}</strong> será cesada de inmediato. Se registrará la fecha
          actual en la base de datos para preservar la validez jurídica de los actos realizados
          durante su vigencia.
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
        <!-- MOTIVO OBLIGATORIO DE SUSPENSIÓN -->
        <div class="field-group">
          <label class="field-label">Motivo de Suspensión Anticipada *</label>
          <mat-form-field appearance="outline" class="custom-field w-100">
            <textarea
              matInput
              formControlName="reason"
              rows="3"
              placeholder="Ej: Retorno anticipado de la Secretaria titular a sus funciones..."
              required
            >
            </textarea>
            <mat-icon matSuffix class="text-muted">assignment_return</mat-icon>
            <mat-error *ngIf="form.get('reason')?.hasError('required')">
              El motivo es obligatorio para el registro de auditoría
            </mat-error>
            <mat-error *ngIf="form.get('reason')?.hasError('minlength')">
              Ingrese al menos 5 caracteres
            </mat-error>
          </mat-form-field>

          <!-- SUGERENCIAS RÁPIDAS DE MOTIVO DE SUSPENSIÓN -->
          <div class="reason-suggestions">
            <span class="sugg-label">Sugerencias:</span>
            <button
              type="button"
              class="sugg-chip"
              (click)="setReason('Retorno anticipado del titular a sus funciones')"
            >
              Retorno Titular
            </button>
            <button
              type="button"
              class="sugg-chip"
              (click)="setReason('Finalización adelantada de comisión de servicios')"
            >
              Fin Comisión
            </button>
            <button
              type="button"
              class="sugg-chip"
              (click)="setReason('Reasignación administrativa de responsabilidades')"
            >
              Reasignación
            </button>
          </div>
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" class="btn-cancel" (click)="onCancel()">
            Cancelar
          </button>
          <button
            mat-flat-button
            color="warn"
            type="submit"
            class="btn-confirm"
            [disabled]="form.invalid"
          >
            <mat-icon class="me-1">remove_circle_outline</mat-icon>
            <span>Suspender Suplencia</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .suspend-dialog-card {
        position: relative;
        background: #ffffff;
        border-radius: 20px;
        padding: 2rem;
        overflow: hidden;
        max-width: 500px;
      }

      .top-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg, #d97706, #ef4444);
      }

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.25rem;

        .header-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;

          mat-icon {
            font-size: 26px;
            width: 26px;
            height: 26px;
          }
        }

        .dialog-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .dialog-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin: 2px 0 0;
        }
      }

      .warning-banner {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 12px;
        padding: 0.85rem 1rem;
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        margin-bottom: 1.25rem;

        .warning-icon {
          color: #d97706;
          font-size: 22px;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-text {
          font-size: 0.825rem;
          color: #92400e;
          line-height: 1.5;
        }
      }

      .field-group {
        margin-bottom: 1.25rem;

        .field-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 0.4rem;
        }
      }

      .reason-suggestions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
        margin-top: 0.25rem;

        .sugg-label {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .sugg-chip {
          background: transparent;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 0.7rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #fef2f2;
            border-color: #ef4444;
            color: #b91c1c;
          }
        }
      }

      .dialog-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;

        .btn-cancel {
          border-radius: 10px;
          font-weight: 600;
          color: #64748b;
        }

        .btn-confirm {
          border-radius: 10px;
          font-weight: 700;
          background: #dc2626 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);

          &:hover {
            background: #b91c1c !important;
          }
        }
      }
    `,
  ],
})
export class SuspendRoleDialogComponent {
  readonly data = inject<SuspendRoleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SuspendRoleDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  setReason(reasonText: string): void {
    this.form.patchValue({ reason: reasonText });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const result: SuspendRoleDialogResult = {
        reason: this.form.value.reason,
      };
      this.dialogRef.close(result);
    }
  }
}
