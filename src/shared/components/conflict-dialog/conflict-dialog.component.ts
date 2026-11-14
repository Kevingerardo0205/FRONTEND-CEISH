import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConflictDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
}

@Component({
  selector: 'app-conflict-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modern-dialog warn">
      <div class="dialog-header-accent" style="background-color: #f59e0b; height: 4px;"></div>

      <div class="dialog-body" style="padding: 24px; text-align: center;">
        <div
          class="icon-container"
          style="background-color: #fef3c7; color: #d97706; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;"
        >
          <mat-icon
            class="status-icon"
            style="font-size: 36px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;"
            >sync_problem</mat-icon
          >
        </div>

        <h2
          class="dialog-title"
          style="font-size: 1.4rem; font-weight: 800; color: #1f2937; margin: 0 0 12px;"
        >
          {{ data.title || 'Conflicto de Concurrencia' }}
        </h2>
        <p
          class="dialog-message"
          style="font-size: 0.95rem; color: #4b5563; line-height: 1.5; margin: 0;"
        >
          {{
            data.message ||
              'El expediente de este protocolo ha sido modificado o versionado por otra transacción concurrente. Por favor, recargue la página para ver la información actualizada.'
          }}
        </p>
      </div>

      <div
        class="dialog-actions"
        style="padding: 16px 24px; display: flex; justify-content: center; border-top: 1px solid #f3f4f6;"
      >
        <button
          mat-flat-button
          color="warn"
          class="btn-confirm"
          (click)="onConfirm()"
          style="border-radius: 8px; font-weight: 600; padding: 8px 24px;"
        >
          {{ data.confirmText || 'Recargar Página' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['../../../styles/confirm-dialog.component.scss'],
})
export class ConflictDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConflictDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConflictDialogData,
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
