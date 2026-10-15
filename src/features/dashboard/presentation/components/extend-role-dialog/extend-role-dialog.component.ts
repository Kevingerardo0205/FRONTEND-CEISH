import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';

export interface ExtendRoleDialogData {
  userId: string;
  userName: string;
  roleCode: string;
  roleName: string;
  currentValidUntil?: string | null;
}

export interface ExtendRoleDialogResult {
  validUntil: string;
  reason: string;
}

@Component({
  selector: 'app-extend-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule
  ],
  template: `
    <div class="extend-dialog-card">
      <div class="top-accent"></div>

      <div class="dialog-header">
        <div class="header-icon-box">
          <mat-icon>more_time</mat-icon>
        </div>
        <div class="header-text">
          <h2 class="dialog-title">Prorrogar Vigencia de Suplencia</h2>
          <p class="dialog-subtitle">Extensión del período temporal de asignación institucional</p>
        </div>
      </div>

      <div class="user-summary-banner">
        <div class="summary-item">
          <span class="summary-label">Profesional:</span>
          <span class="summary-value">{{ data.userName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Rol en Suplencia:</span>
          <span class="badge role-badge">{{ data.roleName || data.roleCode }}</span>
        </div>
        <div class="summary-item" *ngIf="data.currentValidUntil">
          <span class="summary-label">Vencimiento Previo:</span>
          <span class="summary-value text-muted">{{ formatDate(data.currentValidUntil) }}</span>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-form">
        <!-- CHIPS DE PRESETS RÁPIDOS -->
        <div class="field-group">
          <label class="field-label">Extensión Rápida</label>
          <div class="preset-chips-container">
            <button type="button" class="preset-pill" (click)="applyPreset('15d')">+15 Días</button>
            <button type="button" class="preset-pill" (click)="applyPreset('1m')">+1 Mes</button>
            <button type="button" class="preset-pill" (click)="applyPreset('3m')">+3 Meses</button>
            <button type="button" class="preset-pill" (click)="applyPreset('6m')">+6 Meses</button>
            <button type="button" class="preset-pill" (click)="applyPreset('end_year')">Fin de Año</button>
          </div>
        </div>

        <!-- CAMPO FECHA LÍMITE -->
        <div class="field-group">
          <label class="field-label">Nueva Fecha Límite de Vigencia *</label>
          <mat-form-field appearance="outline" class="custom-field w-100">
            <input 
              matInput 
              type="date" 
              formControlName="validUntil" 
              [min]="todayDateString"
              required>
            <mat-icon matSuffix class="text-muted">event</mat-icon>
            <mat-error *ngIf="form.get('validUntil')?.hasError('required')">
              La fecha límite es obligatoria
            </mat-error>
          </mat-form-field>
          <div *ngIf="form.get('validUntil')?.value" class="days-remaining-badge mt-1">
            <mat-icon class="badge-icon">timelapse</mat-icon>
            <span>{{ getDaysRemainingText(form.get('validUntil')?.value) }}</span>
          </div>
        </div>

        <!-- MOTIVO OFICIAL DE PRÓRROGA -->
        <div class="field-group">
          <label class="field-label">Motivo Oficial / Justificación *</label>
          <mat-form-field appearance="outline" class="custom-field w-100">
            <textarea 
              matInput 
              formControlName="reason" 
              rows="3" 
              placeholder="Ej: Prórroga por ampliación de licencia médica de la titular..."
              required>
            </textarea>
            <mat-icon matSuffix class="text-muted">description</mat-icon>
            <mat-error *ngIf="form.get('reason')?.hasError('required')">
              El motivo es obligatorio para fines de auditoría
            </mat-error>
            <mat-error *ngIf="form.get('reason')?.hasError('minlength')">
              Ingrese al menos 5 caracteres
            </mat-error>
          </mat-form-field>

          <!-- SUGERENCIAS RÁPIDAS DE MOTIVO -->
          <div class="reason-suggestions">
            <span class="sugg-label">Sugerencias:</span>
            <button type="button" class="sugg-chip" (click)="setReason('Prórroga por ampliación de licencia médica del titular')">Licencia Médica</button>
            <button type="button" class="sugg-chip" (click)="setReason('Extensión de comisión de servicios institucionales')">Comisión Servicios</button>
            <button type="button" class="sugg-chip" (click)="setReason('Continuidad en subrogación de funciones por resolución')">Resolución</button>
          </div>
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button type="button" class="btn-cancel" (click)="onCancel()">
            Cancelar
          </button>
          <button mat-flat-button color="primary" type="submit" class="btn-confirm" [disabled]="form.invalid">
            <mat-icon class="me-1">save</mat-icon>
            <span>Confirmar Prórroga</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .extend-dialog-card {
      position: relative;
      background: #ffffff;
      border-radius: 20px;
      padding: 2rem;
      overflow: hidden;
      max-width: 520px;
    }

    .top-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #00796b, #009688, #4db6ac);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;

      .header-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: #e0f2f1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00796b;

        mat-icon { font-size: 26px; width: 26px; height: 26px; }
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

    .user-summary-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;

      .summary-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.825rem;

        .summary-label { color: #64748b; font-weight: 600; }
        .summary-value { color: #1e293b; font-weight: 700; }
      }

      .role-badge {
        padding: 2px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        background: #e0f2fe;
        color: #0369a1;
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

    .preset-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.25rem;
    }

    .preset-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 100px;
      padding: 3px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: #00796b;
        border-color: #00796b;
        color: #ffffff;
        transform: translateY(-1px);
      }
    }

    .days-remaining-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #00796b;
      background: #e0f2f1;
      padding: 2px 8px;
      border-radius: 6px;

      .badge-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .reason-suggestions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.25rem;

      .sugg-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

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
          background: #f8fafc;
          border-color: #00796b;
          color: #00796b;
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
        background: #00796b !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(0, 121, 107, 0.25);

        &:hover {
          background: #004d40 !important;
        }
      }
    }
  `]
})
export class ExtendRoleDialogComponent {
  readonly data = inject<ExtendRoleDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ExtendRoleDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly todayDateString = this.formatDateToLocalString(new Date());

  form: FormGroup = this.fb.group({
    validUntil: ['', [Validators.required]],
    reason: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    // Si ya existe fecha previa, pre-asignar +1 mes a partir de ella o hoy
    const baseDate = this.data.currentValidUntil ? new Date(this.data.currentValidUntil) : new Date();
    baseDate.setMonth(baseDate.getMonth() + 1);
    this.form.patchValue({
      validUntil: this.formatDateToLocalString(baseDate)
    });
  }

  applyPreset(preset: '15d' | '1m' | '3m' | '6m' | 'end_year'): void {
    const target = new Date();
    switch (preset) {
      case '15d':
        target.setDate(target.getDate() + 15);
        break;
      case '1m':
        target.setMonth(target.getMonth() + 1);
        break;
      case '3m':
        target.setMonth(target.getMonth() + 3);
        break;
      case '6m':
        target.setMonth(target.getMonth() + 6);
        break;
      case 'end_year':
        target.setFullYear(target.getFullYear(), 11, 31);
        break;
    }
    this.form.patchValue({
      validUntil: this.formatDateToLocalString(target)
    });
  }

  setReason(reasonText: string): void {
    this.form.patchValue({ reason: reasonText });
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getDaysRemainingText(validUntilStr?: string): string {
    if (!validUntilStr) return '';
    try {
      const parts = validUntilStr.split('-');
      if (parts.length === 3) {
        const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diffMs = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'Expirado';
        return `Vigente durante ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      }
      return '';
    } catch {
      return '';
    }
  }

  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const result: ExtendRoleDialogResult = {
        validUntil: this.form.value.validUntil,
        reason: this.form.value.reason
      };
      this.dialogRef.close(result);
    }
  }
}
