import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'warn' | 'info' | 'success';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modern-dialog" [ngClass]="data.type || 'primary'">
      <div class="dialog-header-accent"></div>
      
      <div class="dialog-body">
        <div class="icon-container">
          <mat-icon class="status-icon">{{ getIcon() }}</mat-icon>
        </div>
        
        <h2 class="dialog-title">{{ data.title }}</h2>
        <p class="dialog-message">{{ data.message }}</p>
      </div>

      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onDismiss()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button class="btn-confirm" [color]="getButtonColor()" (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['../../../styles/confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getIcon(): string {
    if (this.data.icon) return this.data.icon;
    switch (this.data.type) {
      case 'warn': return 'warning_amber';
      case 'info': return 'info_outline';
      case 'success': return 'check_circle_outline';
      default: return 'help_outline';
    }
  }

  getButtonColor(): string {
    if (this.data.type === 'warn') return 'warn';
    if (this.data.type === 'success') return 'accent';
    return 'primary';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }
}