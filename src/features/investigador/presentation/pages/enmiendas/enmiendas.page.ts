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
  selector: 'app-enmiendas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, UploadDocumentosComponent
  ],
  template: `
    <div class="container py-5 animate-fade-in">
      <header class="mb-5">
        <h1 class="h2 fw-bold mb-1">Solicitud de Enmienda</h1>
        <p class="text-muted">Proceso para modificar aspectos de un protocolo ya aprobado (Anexos 23 y 24)</p>
      </header>

      <div class="row g-4">
        <div class="col-lg-7">
          <mat-card class="border-0 shadow-soft p-4 rounded-4">
            <form [formGroup]="enmiendaForm">
              <h5 class="fw-bold mb-4">Justificación Técnica</h5>
              
              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Resumen de los cambios</mat-label>
                <textarea matInput rows="3" formControlName="resumenCambios" 
                          placeholder="Describa brevemente qué partes del protocolo se modifican"></textarea>
                <mat-error>Campo obligatorio</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Justificación de la Enmienda (Anexo 24)</mat-label>
                <textarea matInput rows="6" formControlName="justificacion" 
                          placeholder="Explique las razones científicas o técnicas para estos cambios"></textarea>
                <mat-error>Debe proporcionar una justificación detallada</mat-error>
              </mat-form-field>

              <div class="alert alert-warning border-0 small d-flex">
                <mat-icon class="me-2">warning</mat-icon>
                <span>Tenga en cuenta que si los cambios son significativos, el CEISH podría requerir una nueva evaluación en pleno.</span>
              </div>
            </form>
          </mat-card>
        </div>

        <div class="col-lg-5">
          <app-upload-documentos
            [requisitos]="requisitosEnmienda"
            (archivosSubidos)="onArchivosSubidos($event)">
          </app-upload-documentos>

          <div class="mt-4 d-grid gap-2">
            <button mat-flat-button class="btn-espoch py-3" 
                    [disabled]="!enmiendaForm.valid || !archivosListos" 
                    (click)="enviarEnmienda()">
              <mat-icon class="me-2">send</mat-icon> Enviar Solicitud
            </button>
            <button mat-button color="primary" routerLink="/investigador/mis-protocolos">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EnmiendasPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  enmiendaForm = this.fb.group({
    resumenCambios: ['', [Validators.required, Validators.minLength(20)]],
    justificacion: ['', [Validators.required, Validators.minLength(50)]]
  });

  requisitosEnmienda: RequisitoDocumento[] = [
    {
      id: 'anexo23_enmienda',
      nombre: 'Anexo 23 - Formulario de Enmienda',
      anexo: 'Anexo 23',
      obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
      maxSizeMB: 5,
      formatosAceptados: ['application/pdf']
    },
    {
      id: 'protocolo_modificado',
      nombre: 'Protocolo con Control de Cambios',
      anexo: 'Técnico',
      obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
      maxSizeMB: 20,
      formatosAceptados: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  ];

  archivosListos = false;

  ngOnInit(): void {}

  onArchivosSubidos(listos: boolean) {
    this.archivosListos = listos;
  }

  enviarEnmienda() {
    this.snackBar.open('✅ Solicitud de enmienda enviada correctamente', 'Cerrar', { duration: 5000 });
    this.router.navigate(['/investigador/mis-protocolos']);
  }
}
