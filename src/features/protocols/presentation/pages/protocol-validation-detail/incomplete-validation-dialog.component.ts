import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface IncompleteValidationData {
  missingDocuments: string[];
  deadline: string;
}

@Component({
  selector: 'app-incomplete-validation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    <div class="incomplete-dialog">
      <div class="dialog-header">
        <mat-icon class="warn-icon">report_problem</mat-icon>
        <h2>Documentación Incompleta</h2>
      </div>

      <div class="dialog-content">
        <p>No se puede finalizar la revisión. Se han detectado los siguientes documentos faltantes o rechazados:</p>
        
        <mat-list class="missing-list">
          <mat-list-item *ngFor="let doc of data.missingDocuments">
            <mat-icon matListItemIcon class="item-icon">close</mat-icon>
            <div matListItemTitle>{{ doc }}</div>
          </mat-list-item>
        </mat-list>

        <div class="deadline-box mt-3">
          <mat-icon>event_available</mat-icon>
          <div>
            <span class="label">Plazo máximo para correcciones:</span>
            <span class="date">{{ data.deadline | date:'longDate' }}</span>
          </div>
        </div>

        <div class="alert alert-info mt-4 mb-0 small">
          <mat-icon>info</mat-icon>
          Se enviará una notificación automática al investigador con este detalle.
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-flat-button color="primary" (click)="onClose()">ENTENDIDO</button>
      </div>
    </div>
  `,
  styles: [`
    .incomplete-dialog { padding: 1rem; }
    .dialog-header { 
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
      .warn-icon { color: #f59e0b; font-size: 32px; width: 32px; height: 32px; }
      h2 { margin: 0; font-weight: 800; color: #1e293b; }
    }
    .missing-list {
      background: #f8fafc; border-radius: 12px; margin: 1rem 0;
      .item-icon { color: #ef4444; }
    }
    .deadline-box {
      display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b;
      .label { display: block; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
      .date { font-weight: 800; font-size: 1.1rem; }
    }
    .alert-info {
      background: #eff6ff; color: #1e40af; padding: 1rem; border-radius: 8px;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .dialog-actions { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
  `]
})
export class IncompleteValidationDialog {
  constructor(
    public dialogRef: MatDialogRef<IncompleteValidationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: IncompleteValidationData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
