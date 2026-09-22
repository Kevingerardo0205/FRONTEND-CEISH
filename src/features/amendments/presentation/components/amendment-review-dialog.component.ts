import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AmendmentItem, AmendmentStatus } from '../../domain/entities/amendment.entity';

export interface AmendmentReviewDialogData {
  amendment: AmendmentItem;
}

@Component({
  selector: 'app-amendment-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="review-dialog-container">
      <div class="dialog-header d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center gap-2">
          <mat-icon class="header-icon text-primary">rate_review</mat-icon>
          <div>
            <h2 class="dialog-title m-0">Dictamen de Enmienda</h2>
            <span class="text-muted small">{{ data.amendment.protocolCode }} - Versión {{ data.amendment.versionNumber }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="amendment-summary-card p-3 rounded-3 mb-3">
        <h4 class="m-0 mb-1 fw-bold text-dark">{{ data.amendment.protocolTitle }}</h4>
        <div class="d-flex flex-wrap gap-2 my-2">
          <span class="badge bg-primary-subtle text-primary border">
            {{ data.amendment.type }}
          </span>
          <span class="badge" [ngClass]="data.amendment.severity === 'SUBSTANTIAL' ? 'bg-danger-subtle text-danger border-danger' : 'bg-info-subtle text-info border-info'">
            {{ data.amendment.severity === 'SUBSTANTIAL' ? '⚠️ Modificación Sustancial' : 'ℹ️ Modificación Menor' }}
          </span>
        </div>
        <p class="small text-secondary mb-1"><strong>Justificación:</strong> {{ data.amendment.justification }}</p>
        <p class="small text-secondary m-0"><strong>Impacto Ético:</strong> {{ data.amendment.ethicalImpactDescription }}</p>
      </div>

      <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="w-100 mb-3">
          <mat-label>Resolución / Dictamen</mat-label>
          <mat-select formControlName="status">
            <mat-option [value]="AmendmentStatus.APPROVED">🟢 APROBAR ENMIENDA</mat-option>
            <mat-option [value]="AmendmentStatus.OBSERVED">🟡 SOLICITAR SUBSANACIÓN / OBSERVADA</mat-option>
            <mat-option [value]="AmendmentStatus.REJECTED">🔴 RECHAZAR ENMIENDA</mat-option>
          </mat-select>
          <mat-error *ngIf="reviewForm.get('status')?.hasError('required')">
            Seleccione una resolución para la enmienda
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100 mb-3">
          <mat-label>Observaciones y Dictamen Técnico</mat-label>
          <textarea 
            matInput 
            formControlName="reviewNotes" 
            rows="4" 
            placeholder="Fundamente el dictamen bioético o especifique las correcciones requeridas...">
          </textarea>
          <mat-error *ngIf="reviewForm.get('reviewNotes')?.hasError('required')">
            El fundamento del dictamen es obligatorio
          </mat-error>
          <mat-error *ngIf="reviewForm.get('reviewNotes')?.hasError('minlength')">
            Debe contener al menos 15 caracteres
          </mat-error>
        </mat-form-field>

        <div class="dialog-actions d-flex justify-content-end gap-2 mt-3">
          <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
          <button 
            mat-flat-button 
            color="primary" 
            type="submit" 
            [disabled]="reviewForm.invalid">
            <mat-icon>save</mat-icon>
            Guardar Dictamen
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .review-dialog-container {
      padding: 1.5rem;
      max-width: 580px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #003366;
    }
    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .amendment-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .w-100 { width: 100%; }
  `]
})
export class AmendmentReviewDialogComponent {
  readonly AmendmentStatus = AmendmentStatus;
  readonly dialogRef = inject(MatDialogRef<AmendmentReviewDialogComponent>);
  private readonly fb = inject(FormBuilder);

  constructor(@Inject(MAT_DIALOG_DATA) public data: AmendmentReviewDialogData) {}

  reviewForm: FormGroup = this.fb.group({
    status: [AmendmentStatus.APPROVED, Validators.required],
    reviewNotes: ['', [Validators.required, Validators.minLength(15)]]
  });

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.dialogRef.close({
        amendmentId: this.data.amendment.id,
        status: this.reviewForm.value.status,
        reviewNotes: this.reviewForm.value.reviewNotes
      });
    }
  }
}
