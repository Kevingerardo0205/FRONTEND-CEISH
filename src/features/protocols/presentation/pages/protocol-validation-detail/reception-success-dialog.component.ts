import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reception-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="success-dialog-wrapper text-center p-4">
      <div class="icon-container mb-4">
        <mat-icon class="success-icon scale-in-center">verified</mat-icon>
      </div>
      
      <h2 class="fw-bold mb-2">¡Recepción Finalizada!</h2>
      <p class="text-muted mb-4">Se ha verificado el cumplimiento del 100% de los requisitos legales PET 2023.</p>

      <div class="code-box p-4 mb-4 rounded-4 border-2 border-dashed">
        <span class="label text-uppercase small fw-bold text-muted d-block mb-2">Código Oficial Asignado:</span>
        <h1 class="official-code m-0 color-primary">{{ data.code }}</h1>
      </div>

      <div class="legal-info p-3 mb-4 rounded-3 bg-light text-start">
        <div class="d-flex gap-2 align-items-center mb-2">
          <mat-icon color="primary" style="font-size: 18px; width: 18px; height: 18px;">mail</mat-icon>
          <span class="small fw-bold">Notificación enviada</span>
        </div>
        <p class="small text-muted m-0">Se ha enviado la Constancia de Recepción (Anexo 7) al correo institucional del Investigador Principal.</p>
      </div>

      <div class="actions d-grid gap-2">
        <button mat-flat-button color="accent" (click)="onDownload()" class="py-3">
          <mat-icon>download</mat-icon> DESCARGAR ANEXO 7 (PDF)
        </button>
        <button mat-button (click)="dialogRef.close()" class="py-3">
          ENTENDIDO, VOLVER AL LISTADO
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog-wrapper { max-width: 450px; }
    .icon-container { display: flex; justify-content: center; }
    .success-icon { font-size: 80px; width: 80px; height: 80px; color: #10b981; }
    
    .code-box { background: rgba(0, 51, 102, 0.02); border-color: #003366 !important; }
    .official-code { font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; color: #003366; }
    
    .scale-in-center { animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
    @keyframes scale-in-center {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ReceptionSuccessDialog {
  public dialogRef = inject(MatDialogRef<ReceptionSuccessDialog>);
  public data = inject(MAT_DIALOG_DATA);

  onDownload() {
    this.dialogRef.close('download');
  }
}
