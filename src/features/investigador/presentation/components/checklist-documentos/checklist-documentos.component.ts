import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TipoEstudio, RequisitoDocumento, getRequisitosPorTipoEstudio } from '../../../constants/anexos-pet.constants';

@Component({
  selector: 'app-checklist-documentos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatCheckboxModule, 
    MatIconModule, MatTooltipModule, MatButtonModule, MatProgressBarModule
  ],
  template: `
    <div class="checklist-container animate-fade-in">
      <mat-card class="border-0 shadow-soft">
        <mat-card-header class="pb-3 border-bottom mb-4">
          <div mat-card-avatar class="header-icon">
            <mat-icon color="primary">fact_check</mat-icon>
          </div>
          <mat-card-title class="fw-bold">Checklist de Documentación</mat-card-title>
          <mat-card-subtitle>Modalidad: {{ tipoEstudio }} - PET CEISH 2023</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="instruction-alert mb-4">
            <mat-icon>info</mat-icon>
            <p class="mb-0">
              Asegúrese de contar con los siguientes anexos firmados en formato PDF o Word.
              Los marcados con <mat-icon class="text-warning inline-icon">star</mat-icon> son condicionales.
            </p>
          </div>

          <div class="requisitos-grid">
            <div *ngFor="let req of requisitos; trackBy: trackByFn" 
                 class="requisito-item"
                 [class.disabled]="req.esCondicional && !condicionAplica(req)"
                 [class.completed]="req.cumple">
              
              <div class="d-flex align-items-center w-100">
                <mat-checkbox 
                  [(ngModel)]="req.cumple"
                  (ngModelChange)="onCheckChange()"
                  [disabled]="!!(req.esCondicional && !condicionAplica(req))"
                  color="primary">
                </mat-checkbox>
                
                <div class="ms-3 flex-grow-1">
                  <div class="d-flex align-items-center">
                    <span class="anexo-badge me-2">{{ req.anexo }}</span>
                    <span class="req-name">{{ req.nombre }}</span>
                    <mat-icon *ngIf="req.esCondicional" 
                              [matTooltip]="'Condición: ' + req.condicion"
                              class="ms-2 text-warning"
                              style="font-size: 18px;">star</mat-icon>
                  </div>
                  <div class="req-meta mt-1">
                    <span class="me-3"><mat-icon>file_present</mat-icon> {{ req.formatosAceptados?.join(', ') }}</span>
                    <span><mat-icon>straighten</mat-icon> Máx {{ req.maxSizeMB }}MB</span>
                  </div>
                </div>

                <div class="status-indicator ms-3">
                  <mat-icon *ngIf="req.cumple" class="text-success">check_circle</mat-icon>
                  <mat-icon *ngIf="!req.cumple && (!req.esCondicional || condicionAplica(req))" class="text-muted">pending</mat-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Barra de Progreso -->
          <div class="progress-section mt-5 p-4 rounded-3 bg-light border">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold text-dark">Progreso Documental</span>
              <span class="badge" [class.bg-success]="porcentajeCompletado === 100" [class.bg-primary]="porcentajeCompletado < 100">
                {{ documentosCompletos }} de {{ requisitosObligatorios }} listos
              </span>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="porcentajeCompletado"
              class="custom-progress">
            </mat-progress-bar>
            <p class="text-muted small mt-2 mb-0" *ngIf="porcentajeCompletado < 100">
              Complete todos los documentos requeridos para habilitar el siguiente paso.
            </p>
            <p class="text-success small mt-2 mb-0 fw-bold" *ngIf="porcentajeCompletado === 100">
              <mat-icon style="font-size: 14px; height: 14px; width: 14px;">verified</mat-icon>
              Documentación completa. Puede continuar a la carga de archivos.
            </p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header-icon {
      background: #eff6ff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 24px; }
    }

    .instruction-alert {
      display: flex;
      gap: 1rem;
      background: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
      color: #64748b;
      mat-icon { color: #3b82f6; }
    }

    .inline-icon { font-size: 14px; height: 14px; width: 14px; vertical-align: middle; }

    .requisitos-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .requisito-item {
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      
      &:hover:not(.disabled) {
        border-color: #3b82f6;
        background: #f0f7ff;
      }
      
      &.completed {
        background: #f0fdf4;
        border-color: #86efac;
      }
      
      &.disabled {
        opacity: 0.5;
        background: #f1f5f9;
        cursor: not-allowed;
      }
    }

    .anexo-badge {
      background: #334155;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .req-name { font-weight: 600; color: #1e293b; }
    
    .req-meta {
      display: flex;
      font-size: 0.75rem;
      color: #94a3b8;
      mat-icon { font-size: 14px; height: 14px; width: 14px; vertical-align: middle; margin-right: 2px; }
    }

    .custom-progress {
      height: 10px;
      border-radius: 5px;
    }
  `]
})
export class ChecklistDocumentosComponent implements OnInit {
  @Input() tipoEstudio!: TipoEstudio;
  @Input() caracteristicas: { poblacionVulnerable: boolean, utilizaMuestrasBiologicas: boolean } = { 
    poblacionVulnerable: false, 
    utilizaMuestrasBiologicas: false 
  };
  @Output() documentosValidados = new EventEmitter<boolean>();

  requisitos: (RequisitoDocumento & { cumple: boolean })[] = [];

  get requisitosObligatorios(): number {
    return this.requisitos.filter(r => 
      !r.esCondicional || this.condicionAplica(r)
    ).length;
  }

  get documentosCompletos(): number {
    return this.requisitos.filter(r => 
      r.cumple && (!r.esCondicional || this.condicionAplica(r))
    ).length;
  }

  get porcentajeCompletado(): number {
    if (this.requisitosObligatorios === 0) return 100;
    return Math.round((this.documentosCompletos / this.requisitosObligatorios) * 100);
  }

  ngOnInit(): void {
    this.refreshRequisitos();
  }

  ngOnChanges(): void {
    this.refreshRequisitos();
  }

  private refreshRequisitos(): void {
    const data = getRequisitosPorTipoEstudio(this.tipoEstudio);
    this.requisitos = data.map(req => {
      const existing = this.requisitos.find(r => r.id === req.id);
      return {
        ...req,
        cumple: existing ? existing.cumple : false
      };
    });
    this.onCheckChange();
  }

  condicionAplica(req: RequisitoDocumento): boolean {
    if (req.id === 'anexo3_consentimiento') {
      // Para EI y EC siempre es obligatorio
      if (this.tipoEstudio === TipoEstudio.INTERVENCION || this.tipoEstudio === TipoEstudio.ENSAYO_CLINICO) {
        return true;
      }
      // Para IO depende de si usa muestras o población vulnerable
      return this.caracteristicas.poblacionVulnerable || this.caracteristicas.utilizaMuestrasBiologicas;
    }
    return true; 
  }

  onCheckChange(): void {
    const todosCompletos = this.porcentajeCompletado === 100;
    this.documentosValidados.emit(todosCompletos);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }
}
