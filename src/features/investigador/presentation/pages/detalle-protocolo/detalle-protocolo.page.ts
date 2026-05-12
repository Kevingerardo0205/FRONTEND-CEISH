import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloDetalle, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';

@Component({
  selector: 'app-detalle-protocolo',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, 
    MatIconModule, MatTabsModule, MatDividerModule, MatProgressBarModule,
    MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="container py-5 animate-fade-in" *ngIf="protocolo">
      <!-- Breadcrumbs -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/investigador/mis-protocolos">Mis Protocolos</a></li>
          <li class="breadcrumb-item active">{{ protocolo.codigoCeish || 'Trámite #' + protocolo.id }}</li>
        </ol>
      </nav>

      <!-- Header de Protocolo -->
      <div class="header-banner glass-card p-4 rounded-4 mb-5 border-0 shadow-soft">
        <div class="row align-items-center">
          <div class="col-md-8">
            <div class="d-flex align-items-center mb-2">
              <span class="badge bg-primary me-2">{{ protocolo.tipoEstudio }}</span>
              <h1 class="h3 fw-bold mb-0 text-dark">{{ protocolo.titulo }}</h1>
            </div>
            <p class="text-muted mb-0">
              <mat-icon style="font-size: 16px; vertical-align: middle;">person</mat-icon>
              Investigador: <span class="fw-medium">{{ protocolo.investigadorPrincipal }}</span>
              <span class="mx-2">|</span>
              <mat-icon style="font-size: 16px; vertical-align: middle;">calendar_today</mat-icon>
              Registrado: {{ protocolo.fechaCreacion | date:'longDate' }}
            </p>
          </div>
          <div class="col-md-4 text-md-end">
            <div class="status-box">
              <div class="small text-muted mb-1 text-uppercase fw-bold">Estado Actual</div>
              <span class="status-chip large" [ngClass]="getStatusClass(protocolo.estado)">
                <mat-icon class="me-2">{{ getStatusIcon(protocolo.estado) }}</mat-icon>
                {{ formatStatus(protocolo.estado) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Columna Izquierda: Información y Ficheros -->
        <div class="col-lg-8">
          <mat-tab-group class="custom-tabs bg-white rounded-4 shadow-soft">
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="me-2">info</mat-icon> Información General
              </ng-template>
              <div class="p-4">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Resumen del Proyecto</label>
                    <p>{{ protocolo.resumen }}</p>
                  </div>
                  <div class="row mt-4">
                    <div class="col-md-6 mb-3">
                      <label>Diseño del Estudio</label>
                      <div class="fw-medium text-dark">{{ protocolo.disenoEstudio }}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label>Lugar de Ejecución</label>
                      <div class="fw-medium text-dark">{{ protocolo.lugarEjecucion }}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label>Patrocinador</label>
                      <div class="fw-medium text-dark">{{ protocolo.institucionPatrocinadora }}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label>Cronograma</label>
                      <div class="fw-medium text-dark">
                        {{ protocolo.fechaInicioEstimada | date:'MMM yyyy' }} - {{ protocolo.fechaFinEstimada | date:'MMM yyyy' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="me-2">description</mat-icon> Documentos Enviados
              </ng-template>
              <div class="p-4">
                <div class="list-group list-group-flush">
                  <div *ngFor="let doc of documentos" class="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom">
                    <div class="d-flex align-items-center">
                      <div class="file-icon me-3">
                        <mat-icon color="primary">insert_drive_file</mat-icon>
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ doc.nombre }}</div>
                        <div class="small text-muted">{{ doc.tipo }} • {{ doc.size }}</div>
                      </div>
                    </div>
                    <button mat-icon-button color="primary" [matTooltip]="'Descargar ' + doc.nombre">
                      <mat-icon>download</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="me-2">history</mat-icon> Historial / Trazabilidad
              </ng-template>
              <div class="p-4">
                <div class="timeline">
                  <div *ngFor="let event of historial" class="timeline-item">
                    <div class="timeline-marker" [ngClass]="event.tipo"></div>
                    <div class="timeline-content">
                      <div class="d-flex justify-content-between">
                        <h6 class="fw-bold mb-0 text-dark">{{ event.titulo }}</h6>
                        <span class="small text-muted">{{ event.fecha | date:'short' }}</span>
                      </div>
                      <p class="small text-muted mb-0">{{ event.descripcion }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Columna Derecha: Acciones Rápidas y Seguimiento -->
        <div class="col-lg-4">
          <!-- Tarjeta de Acciones -->
          <mat-card class="border-0 shadow-soft rounded-4 mb-4 overflow-hidden">
            <div class="p-4 bg-primary text-white">
              <h5 class="fw-bold mb-0">Acciones Disponibles</h5>
              <p class="small text-white-50 mb-0">Opciones según estado actual</p>
            </div>
            <div class="p-3">
              <div class="d-grid gap-2">
                <button mat-flat-button class="btn-espoch" 
                        [disabled]="protocolo.estado !== 'REQUIERE_CORRECCION' || protocolo.estado === 'EN_REVISION_SECRETARIA'">
                  <mat-icon class="me-2">edit_note</mat-icon> Atender Observaciones
                </button>
                <button mat-stroked-button color="primary" [disabled]="protocolo.estado !== 'APROBADO_DEFINITIVO'"
                        [routerLink]="['/investigador/enmienda', protocolo.id]">
                  <mat-icon class="me-2">edit_document</mat-icon> Solicitar Enmienda
                </button>
                <button mat-stroked-button color="warn" [disabled]="protocolo.estado !== 'APROBADO_DEFINITIVO'"
                        [routerLink]="['/investigador/evento-adverso', protocolo.id]">
                  <mat-icon class="me-2">warning</mat-icon> Reportar Evento Grave
                </button>
                <button mat-stroked-button color="accent" [disabled]="protocolo.estado !== 'APROBADO_DEFINITIVO'"
                        [routerLink]="['/investigador/renovacion', protocolo.id]">
                  <mat-icon class="me-2">update</mat-icon> Renovar Aprobación
                </button>
              </div>
              <div *ngIf="protocolo.estado === 'EN_REVISION_SECRETARIA'" class="alert alert-warning mt-3 mb-0 small">
                <mat-icon style="font-size: 16px; vertical-align: middle;">lock</mat-icon>
                La carga de archivos está bloqueada mientras Secretaría revisa su protocolo.
              </div>
            </div>
          </mat-card>

          <!-- Seguimiento Automático (HU-007) -->
          <mat-card class="border-0 shadow-soft rounded-4 p-4" *ngIf="protocolo.estado === 'APROBADO_DEFINITIVO'">
            <h5 class="fw-bold mb-3 d-flex align-items-center">
              <mat-icon class="me-2 text-primary">notifications_active</mat-icon>
              Próximos Hitos
            </h5>
            <div class="alert alert-info py-2 small border-0 mb-3">
              <mat-icon style="font-size: 16px; vertical-align: middle;">info</mat-icon>
              Calculado según periodicidad PET
            </div>
            <div class="milestones">
              <div class="milestone-item pending">
                <div class="m-date">30 May 2026</div>
                <div class="m-title">Informe de Inicio</div>
                <div class="m-status">En 25 días</div>
              </div>
              <div class="milestone-item future">
                <div class="m-date">04 Nov 2026</div>
                <div class="m-title">Primer Informe de Avance</div>
                <div class="m-status">Pendiente</div>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div class="container py-5 text-center" *ngIf="!protocolo">
      <mat-spinner diameter="40" class="mx-auto mb-3"></mat-spinner>
      <p class="text-muted">Cargando detalles del protocolo...</p>
    </div>
  `,
  styles: [`
    .header-banner { background: white; }
    .status-chip.large { padding: 10px 20px; font-size: 0.9rem; border-radius: 12px; }
    
    label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 4px; }
    
    .custom-tabs { 
      ::ng-deep .mat-mdc-tab-body-wrapper { padding: 0; }
      ::ng-deep .mat-mdc-tab-header { border-bottom: 1px solid #e2e8f0; }
    }

    .timeline { padding: 10px 0; }
    .timeline-item { position: relative; padding-left: 30px; margin-bottom: 25px; }
    .timeline-marker { 
      position: absolute; left: 0; top: 0; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1;
      &.success { background: #22c55e; }
      &.info { background: #3b82f6; }
      &.warning { background: #f59e0b; }
    }
    .timeline-item:not(:last-child)::after {
      content: ''; position: absolute; left: 5px; top: 12px; width: 2px; height: calc(100% + 13px); background: #e2e8f0;
    }

    .milestone-item { border-left: 3px solid #e2e8f0; padding-left: 1rem; margin-bottom: 1.5rem; }
    .milestone-item.pending { border-left-color: #3b82f6; }
    .milestone-item.future { border-left-color: #94a3b8; opacity: 0.7; }
    .m-date { font-size: 0.75rem; font-weight: bold; color: #3b82f6; }
    .m-title { font-weight: 600; font-size: 0.9rem; color: #1e293b; }
    .m-status { font-size: 0.75rem; color: #64748b; }
  `]
})
export class DetalleProtocoloPage implements OnInit {
  private route = inject(ActivatedRoute);
  private protocoloService = inject(ProtocoloService);
  
  protocolo: ProtocoloDetalle | null = null;
  documentos: any[] = [
    { nombre: 'Anexo 1 - Solicitud.pdf', tipo: 'Anexo 1', size: '1.2 MB' },
    { nombre: 'Protocolo Tecnico v1.pdf', tipo: 'Técnico', size: '4.5 MB' },
    { nombre: 'CV Investigador.pdf', tipo: 'Soporte', size: '800 KB' }
  ];

  historial: any[] = [
    { titulo: 'Protocolo Registrado', descripcion: 'Envío inicial del investigador.', fecha: new Date(), tipo: 'success' },
    { titulo: 'En Revisión Documental', descripcion: 'Secretaría técnica validando anexos.', fecha: new Date(), tipo: 'info' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.protocoloService.obtenerProtocolo(id).subscribe(data => {
        this.protocolo = data;
        this.historial.unshift({
          titulo: 'Estado Actual: ' + this.formatStatus(data.estado),
          descripcion: 'Última actualización por el sistema.',
          fecha: new Date(),
          tipo: 'info'
        });
      });
    }
  }

  formatStatus(estado: string): string {
    if (estado === 'EN_REVISION_SECRETARIA') return 'En Revisión (Secretaría)';
    return estado.replace(/_/g, ' ');
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'APROBADO_DEFINITIVO': return 'approved';
      case 'EN_REVISION_DOCUMENTAL': 
      case 'EN_REVISION_SECRETARIA':
        return 'review';
      case 'REQUIERE_CORRECCION': return 'correction';
      default: return 'pending';
    }
  }

  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'APROBADO_DEFINITIVO': return 'verified';
      case 'EN_REVISION_DOCUMENTAL':
      case 'EN_REVISION_SECRETARIA':
        return 'search';
      case 'REQUIERE_CORRECCION': return 'edit_note';
      default: return 'schedule';
    }
  }
}
