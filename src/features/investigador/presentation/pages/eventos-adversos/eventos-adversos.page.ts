import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadDocumentosComponent } from '../../components/upload-documentos/upload-documentos.component';
import { RequisitoDocumento, TipoEstudio } from '../../../constants/anexos-pet.constants';

@Component({
  selector: 'app-eventos-adversos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatSnackBarModule, UploadDocumentosComponent
  ],
  template: `
    <div class="container py-5 animate-fade-in">
      <header class="mb-5">
        <h1 class="h2 fw-bold mb-1 text-danger">Reporte de Evento Adverso Grave</h1>
        <p class="text-muted">Notificación obligatoria de EAG / RAGI según farmacovigilancia (Anexos 20, 21, 22)</p>
      </header>

      <div class="row g-4">
        <div class="col-lg-7">
          <mat-card class="border-0 shadow-soft p-4 rounded-4 border-top border-danger border-4">
            <form [formGroup]="eventoForm">
              <h5 class="fw-bold mb-4">Datos del Suceso</h5>
              
              <div class="row">
                <div class="col-md-6">
                  <mat-form-field appearance="outline" class="w-100 mb-3">
                    <mat-label>Tipo de Evento</mat-label>
                    <mat-select formControlName="tipoEvento">
                      <mat-option value="EAG">EAG (Evento Adverso Grave)</mat-option>
                      <mat-option value="RAGI">RAGI (Reacción Adversa Grave Inesperada)</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="col-md-6">
                  <mat-form-field appearance="outline" class="w-100 mb-3">
                    <mat-label>Fecha de Ocurrencia</mat-label>
                    <input matInput type="date" formControlName="fechaEvento">
                  </mat-form-field>
                </div>
              </div>

              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Descripción Clínica Inicial</mat-label>
                <textarea matInput rows="4" formControlName="descripcion" 
                          placeholder="Describa el suceso, síntomas y medidas tomadas"></textarea>
                <mat-error>Requerido</mat-error>
              </mat-form-field>

              <div class="alert alert-danger border-0 small d-flex align-items-center">
                <mat-icon class="me-2">alarm</mat-icon>
                <span><strong>Recordatorio:</strong> Este reporte inicial debe realizarse en un plazo máximo de 2 días desde conocido el evento.</span>
              </div>
            </form>
          </mat-card>
        </div>

        <div class="col-lg-5">
          <app-upload-documentos
            [requisitos]="requisitosEvento"
            (archivosSubidos)="onArchivosSubidos($event)">
          </app-upload-documentos>

          <div class="mt-4 d-grid gap-2">
            <button mat-flat-button color="warn" class="py-3 fw-bold" 
                    [disabled]="!eventoForm.valid || !archivosListos" 
                    (click)="enviarReporte()">
              <mat-icon class="me-2">priority_high</mat-icon> Enviar Reporte Urgente
            </button>
            <button mat-button routerLink="/investigador/mis-protocolos">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EventosAdversosPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  eventoForm = this.fb.group({
    tipoEvento: ['EAG', Validators.required],
    fechaEvento: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(30)]]
  });

  requisitosEvento: RequisitoDocumento[] = [
    {
      id: 'anexo20_21_reporte',
      nombre: 'Anexo 20/21 - Reporte de Evento Adverso',
      anexo: 'Anexo 20/21',
      obligatorioPara: [TipoEstudio.OBSERVACIONAL, TipoEstudio.INTERVENCION, TipoEstudio.ENSAYO_CLINICO],
      maxSizeMB: 5,
      formatosAceptados: ['application/pdf']
    }
  ];

  archivosListos = false;

  ngOnInit(): void {}

  onArchivosSubidos(listos: boolean) {
    this.archivosListos = listos;
  }

  enviarReporte() {
    this.snackBar.open('🚨 Reporte de seguridad enviado. Se notificó a Secretaría y Presidencia.', 'Entendido', { 
      duration: 10000,
      panelClass: ['bg-danger', 'text-white']
    });
    this.router.navigate(['/investigador/mis-protocolos']);
  }
}
