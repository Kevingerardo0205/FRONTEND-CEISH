import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequisitoDocumento } from '../../../constants/anexos-pet.constants';
import { CrearProtocoloDto } from '../../../domain/dtos/crear-protocolo.dto';

@Component({
  selector: 'app-upload-documentos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="upload-container animate-fade-in">
      <mat-card class="border-0 shadow-soft">
        <mat-card-header class="pb-3 border-bottom mb-4">
          <div mat-card-avatar class="header-icon">
            <mat-icon color="primary">cloud_upload</mat-icon>
          </div>
          <mat-card-title class="fw-bold">Carga de Anexos Técnicos</mat-card-title>
          <mat-card-subtitle>Suba los documentos verificados en el checklist</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Zona de Drag & Drop -->
          <div 
            class="drop-zone mb-5"
            [class.active]="isDragging"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            
            <input #fileInput type="file" multiple hidden 
                   (change)="onFileSelected($event)"
                   [accept]="formatosAceptadosString">
            
            <div class="drop-zone-content">
              <div class="icon-circle mb-3">
                <mat-icon>upload_file</mat-icon>
              </div>
              <h4 class="fw-bold mb-1">Arrastre sus archivos aquí</h4>
              <p class="text-muted small mb-0">O haga clic para explorar en su ordenador</p>
              <div class="mt-3 formats-badges">
                <span class="badge bg-light text-dark border">PDF</span>
                <span class="badge bg-light text-dark border">DOCX</span>
                <span class="badge bg-light text-dark border">MÁX 10MB</span>
              </div>
            </div>
          </div>

          <!-- Listado de Requisitos con sus Archivos -->
          <div class="requisitos-upload-grid">
            <div *ngFor="let req of requisitos; trackBy: trackByFn" 
                 class="req-upload-item"
                 [class.has-files]="archivosPorRequisito[req.id]?.length">
              
              <div class="req-upload-header d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                  <span class="req-id-badge me-2">{{ req.anexo }}</span>
                  <span class="req-name fw-bold">{{ req.nombre }}</span>
                </div>
                <mat-icon *ngIf="archivosPorRequisito[req.id]?.length" class="text-success">check_circle</mat-icon>
                <mat-icon *ngIf="!archivosPorRequisito[req.id]?.length" class="text-muted">pending_actions</mat-icon>
              </div>

              <!-- Archivos subidos para este requisito -->
              <div class="files-list" *ngIf="archivosPorRequisito[req.id]?.length">
                <div *ngFor="let archivo of archivosPorRequisito[req.id]; let i = index" 
                     class="file-pill d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center overflow-hidden">
                    <mat-icon class="me-2 text-primary">description</mat-icon>
                    <span class="file-name text-truncate" [matTooltip]="archivo.name">{{ archivo.name }}</span>
                    <span class="file-size ms-2">({{ formatoBytes(archivo.size) }})</span>
                  </div>
                  <button mat-icon-button color="warn" size="small" (click)="eliminarArchivo(req.id, i)">
                    <mat-icon style="font-size: 18px;">close</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Mensajes de Error localizados -->
              <div *ngIf="erroresPorRequisito[req.id]" class="error-pill mt-2">
                <mat-icon>error_outline</mat-icon>
                <span>{{ erroresPorRequisito[req.id] }}</span>
              </div>

              <div *ngIf="!archivosPorRequisito[req.id]?.length" class="empty-state-text mt-2">
                <small class="text-muted italic">Esperando archivo para este requisito...</small>
              </div>
            </div>
          </div>

          <!-- Resumen de Carga -->
          <div class="upload-summary mt-5 p-4 rounded-3 bg-dark text-white shadow-soft">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h5 class="fw-bold mb-1">Resumen de Carga Técnica</h5>
                <p class="text-white-50 small mb-0">Total: {{ archivosValidos }} / {{ requisitosObligatorios }} documentos obligatorios adjuntos</p>
              </div>
              <div class="col-md-4 text-end">
                <div class="percentage-display h2 fw-bold mb-0">{{ porcentajeArchivosListos }}%</div>
              </div>
            </div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="porcentajeArchivosListos"
              class="summary-progress mt-3"
              [color]="porcentajeArchivosListos === 100 ? 'accent' : 'warn'">
            </mat-progress-bar>
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

    .drop-zone {
      border: 2px dashed #e2e8f0;
      border-radius: 20px;
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8fafc;
      
      &:hover, &.active {
        border-color: #3b82f6;
        background: #f0f7ff;
        .icon-circle { background: #3b82f6; color: white; transform: scale(1.1); }
      }
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      mat-icon { font-size: 32px; width: 32px; height: 32px; color: #3b82f6; }
    }

    .formats-badges {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      .badge { font-weight: 500; font-size: 0.7rem; }
    }

    .requisitos-upload-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
      gap: 1.5rem;
    }

    .req-upload-item {
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: white;
      transition: all 0.3s ease;
      
      &.has-files {
        border-color: #86efac;
        background: #f0fdf4;
      }
    }

    .req-id-badge {
      background: #334155;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .file-pill {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      margin-top: 0.5rem;
      animation: fadeIn 0.3s ease-out;
    }

    .file-name { font-size: 0.85rem; font-weight: 500; }
    .file-size { font-size: 0.75rem; color: #94a3b8; }

    .error-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #dc2626;
      font-size: 0.8rem;
      background: #fef2f2;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      mat-icon { font-size: 16px; height: 16px; width: 16px; }
    }

    .summary-progress {
      height: 12px;
      border-radius: 6px;
    }

    .percentage-display { color: #86efac; }
  `]
})
export class UploadDocumentosComponent {
  @Input() requisitos!: RequisitoDocumento[];
  @Input() protocoloData!: Partial<CrearProtocoloDto>;
  @Output() archivosSubidos = new EventEmitter<boolean>();
  
  private snackBar = inject(MatSnackBar);
  
  archivosPorRequisito: Record<string, File[]> = {};
  erroresPorRequisito: Record<string, string> = {};
  isDragging = false;
  
  get formatosAceptadosString(): string {
    const formatos = new Set<string>();
    this.requisitos.forEach(r => {
      r.formatosAceptados?.forEach(f => formatos.add(f));
    });
    return Array.from(formatos).join(',');
  }
  
  get archivosTotales(): number {
    return Object.values(this.archivosPorRequisito).flat().length;
  }

  get requisitosObligatorios(): number {
    return this.requisitos.filter(r => !r.esCondicional || this.condicionAplica(r)).length;
  }
  
  get archivosValidos(): number {
    return Object.entries(this.archivosPorRequisito).filter(([reqId, archivos]) => {
      const req = this.requisitos.find(r => r.id === reqId);
      return req && (!req.esCondicional || this.condicionAplica(req)) && archivos.length > 0;
    }).length;
  }
  
  get porcentajeArchivosListos(): number {
    const obligatorios = this.requisitosObligatorios;
    if (obligatorios === 0) return 100;
    return Math.round((this.archivosValidos / obligatorios) * 100);
  }
  
  get tieneArchivosParaEnviar(): boolean {
    return this.archivosTotales > 0;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.procesarArchivos(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.procesarArchivos(Array.from(input.files));
      input.value = ''; 
    }
  }

  private procesarArchivos(files: File[]): void {
    files.forEach(archivo => {
      const requisito = this.requisitos.find(req => {
        if (req.formatosAceptados?.includes(archivo.type) || this.checkExtension(archivo, req.formatosAceptados)) {
          if (archivo.size > (req.maxSizeMB || 10) * 1024 * 1024) {
            this.erroresPorRequisito[req.id] = `Archivo muy grande. Máximo ${req.maxSizeMB || 10} MB`;
            return false;
          }
          return true;
        }
        return false;
      });
      
      if (requisito) {
        if (!this.archivosPorRequisito[requisito.id]) {
          this.archivosPorRequisito[requisito.id] = [];
        }
        
        if (!requisito.aceptaMultiple && this.archivosPorRequisito[requisito.id].length >= 1) {
          this.erroresPorRequisito[requisito.id] = 'Solo se permite 1 archivo para este documento';
          return;
        }
        
        this.archivosPorRequisito[requisito.id].push(archivo);
        delete this.erroresPorRequisito[requisito.id];
      } else {
        this.snackBar.open(`⚠️ Formato no válido para ningún documento: ${archivo.name}`, 'Cerrar', {
          duration: 4000
        });
      }
    });
    
    this.emitirEstado();
  }

  private checkExtension(file: File, acceptedTypes?: string[]): boolean {
    if (!acceptedTypes) return true;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return false;
    
    // Mapeo simple de mimetypes a extensiones comunes para validación extra
    const mimeToExt: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/msword': ['doc']
    };

    return acceptedTypes.some(type => mimeToExt[type]?.includes(extension));
  }

  eliminarArchivo(requisitoId: string, index: number): void {
    this.archivosPorRequisito[requisitoId]?.splice(index, 1);
    if (this.archivosPorRequisito[requisitoId]?.length === 0) {
      delete this.archivosPorRequisito[requisitoId];
    }
    this.emitirEstado();
  }

  private emitirEstado(): void {
    const listos = this.porcentajeArchivosListos === 100;
    this.archivosSubidos.emit(listos);
  }

  condicionAplica(req: RequisitoDocumento): boolean {
    return true;
  }

  formatoBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }
}
