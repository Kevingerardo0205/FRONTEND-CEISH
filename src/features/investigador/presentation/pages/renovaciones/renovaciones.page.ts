import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadDocumentosComponent } from '../../components/upload-documentos/upload-documentos.component';
import { RequisitoDocumento, TipoEstudio } from '../../../constants/anexos-pet.constants';

@Component({
  selector: 'app-renovaciones',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, UploadDocumentosComponent
  ],
  template: `
    <div class="container py-5 animate-fade-in">
      <header class="mb-5">
        <h1 class="h2 fw-bold mb-1">Renovación de Aprobación Ética</h1>
        <p class="text-muted">Solicitud de extensión anual de vigencia (Anexo 25)</p>
      </header>

      <div class="row g-4">
        <div class="col-lg-7">
          <mat-card class="border-0 shadow-soft p-4 rounded-4">
            <form [formGroup]="renovacionForm">
              <h5 class="fw-bold mb-4">Estado del Proyecto</h5>
              
              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Resumen de actividades del último año</mat-label>
                <textarea matInput rows="4" formControlName="actividades" 
                          placeholder="Sintetice el progreso alcanzado hasta la fecha"></textarea>
                <mat-error>Campo obligatorio</mat-error>
              </mat-form-field>

              <div class="info-banner-blue d-flex p-3 rounded-3 mb-4">
                <mat-icon class="me-3 text-primary">info</mat-icon>
                <p class="small mb-0 text-dark">
                  Para renovar la aprobación, es requisito indispensable haber presentado todos los informes de avance según el cronograma aprobado.
                </p>
              </div>
            </form>
          </mat-card>
        </div>

        <div class="col-lg-5">
          <app-upload-documentos
            [requisitos]="requisitosRenovacion"
            (archivosSubidos)="onArchivosSubidos($event)">
          </app-upload-documentos>

          <div class="mt-4 d-grid gap-2">
            <button mat-flat-button class="btn-espoch py-3" 
                    [disabled]="!renovacionForm.valid || !archivosListos" 
                    (click)="enviarRenovacion()">
              <mat-icon class="me-2">history</mat-icon> Solicitar Renovación
            </button>
            <button mat-button routerLink="/investigador/mis-protocolos">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-banner-blue { background: #eff6ff; border: 1px solid #dbeafe; }
  `]
})
export class RenovacionesPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  renovacionForm = this.fb.group({
    actividades: ['', [Validators.required, Validators.minLength(50)]]
  });

  requisitosRenovacion: RequisitoDocumento[] = [
    {
      id: 'anexo25_renovacion',
      nombre: 'Anexo 25 - Solicitud de Renovación',
      anexo: 'Anexo 25',
      obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
      maxSizeMB: 5,
      formatosAceptados: ['application/pdf']
    },
    {
      id: 'informe_avance_final',
      nombre: 'Último Informe de Avance Presentado',
      anexo: 'Seguimiento',
      obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
      maxSizeMB: 10,
      formatosAceptados: ['application/pdf']
    }
  ];

  archivosListos = false;

  ngOnInit(): void {}

  onArchivosSubidos(listos: boolean) {
    this.archivosListos = listos;
  }

  enviarRenovacion() {
    this.snackBar.open('✅ Solicitud de renovación recibida. El comité revisará su historial de cumplimiento.', 'Cerrar', { duration: 7000 });
    this.router.navigate(['/investigador/mis-protocolos']);
  }
}
