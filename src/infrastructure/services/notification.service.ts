import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UndoToastService } from '../../shared/ui/undo-toast/undo-toast.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private dialog = inject(MatDialog);
  private undoToast = inject(UndoToastService);

  /**
   * Muestra un diálogo de confirmación flotante
   * TODO F00: migra a Dialog (shared/ui/dialog) sección por sección, solo para lo irreversible.
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: data,
      disableClose: true,
      panelClass: 'custom-dialog-container',
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un aviso rápido (UndoToast) en la esquina inferior derecha
   */
  notify(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.undoToast.show({ message, tone: type, duration: 4000 });
  }
}
