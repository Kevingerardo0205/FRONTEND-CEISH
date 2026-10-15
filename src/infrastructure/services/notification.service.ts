import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Muestra un diálogo de confirmación flotante
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: data,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un mensaje rápido (Toast/SnackBar) en la parte inferior
   */
  notify(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
