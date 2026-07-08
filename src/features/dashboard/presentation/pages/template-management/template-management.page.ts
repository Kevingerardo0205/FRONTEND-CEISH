import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { of } from 'rxjs';
import { switchMap, filter, map } from 'rxjs/operators';

import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-template-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-admin-container animate-fade-in">
      
      <!-- Top Header Section -->
      <header class="main-header mb-4">
        <div class="header-info-container">
          <div class="breadcrumb-chip-modern">
            <mat-icon class="breadcrumb-icon">settings_system_daydream</mat-icon>
            <span>Administración / Plantillas</span>
          </div>
          <h1 class="header-title">Configuración de Plantillas</h1>
          <p class="header-subtitle">Gestione y organice los formatos de documentos y anexos dinámicos en Cloudflare R2</p>
        </div>
      </header>

      <!-- KPI Section -->
      <section class="kpi-grid-modern mb-5">
        <!-- KPI 1: Total -->
        <div class="kpi-card-modern template-total shadow-soft">
          <div class="kpi-content-modern">
            <div class="icon-box-modern bg-primary-soft text-primary-dark">
              <mat-icon>folder</mat-icon>
            </div>
            <div class="kpi-info-modern">
              <span class="label-modern">Total Plantillas</span>
              <h3 class="value-modern">{{ templates().length }}</h3>
            </div>
          </div>
          <div class="card-progress-bar bg-primary-soft-progress"></div>
        </div>

        <!-- KPI 2: Associated -->
        <div class="kpi-card-modern template-active shadow-soft">
          <div class="kpi-content-modern">
            <div class="icon-box-modern bg-success-soft text-success-dark">
              <mat-icon>cloud_done</mat-icon>
            </div>
            <div class="kpi-info-modern">
              <span class="label-modern">Con Archivo Asociado</span>
              <h3 class="value-modern text-success-dark">{{ activeTemplatesCount() }}</h3>
            </div>
          </div>
          <div class="card-progress-bar bg-success-soft-progress" [style.width.%]="templates().length ? (activeTemplatesCount() / templates().length) * 100 : 0"></div>
        </div>

        <!-- KPI 3: Missing -->
        <div class="kpi-card-modern template-missing shadow-soft">
          <div class="kpi-content-modern">
            <div class="icon-box-modern bg-danger-soft text-danger-dark">
              <mat-icon>cloud_off</mat-icon>
            </div>
            <div class="kpi-info-modern">
              <span class="label-modern">Sin Archivo (.docx)</span>
              <h3 class="value-modern text-danger-dark">{{ templates().length - activeTemplatesCount() }}</h3>
            </div>
          </div>
          <div class="card-progress-bar bg-danger-soft-progress" [style.width.%]="templates().length ? ((templates().length - activeTemplatesCount()) / templates().length) * 100 : 0"></div>
        </div>
      </section>

      <!-- Main Content Layout -->
      <div class="management-layout-modern">
        <!-- Left Side: Table List -->
        <main class="table-section-modern glass-card p-4">
          <div class="table-header-modern mb-4">
            <div class="table-header-title">
              <h2 class="section-title-modern">Listado de Plantillas de Base</h2>
              <span class="count-badge" *ngIf="templates().length > 0">
                {{ filteredTemplates().length }} de {{ templates().length }}
              </span>
            </div>
            
            <div class="table-header-actions">
              <!-- Search bar -->
              <div class="search-bar-modern" *ngIf="templates().length > 0">
                <mat-icon class="search-icon">search</mat-icon>
                <input 
                  type="text" 
                  placeholder="Buscar por código o descripción..." 
                  (input)="onSearchInput($event)"
                  [value]="searchQuery()"
                  class="search-input-modern"
                />
                <button *ngIf="searchQuery()" (click)="clearSearch()" class="clear-search-btn" type="button">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="spinner-placeholder" *ngIf="isUploading()">
                <div class="upload-loader">
                  <mat-icon class="spin-animation">sync</mat-icon>
                  <span>Subiendo archivo...</span>
                </div>
              </div>
            </div>
          </div>

          <div class="table-responsive-modern">
            <table class="templates-table-modern">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre descriptivo</th>
                  <th>Ruta en Almacenamiento</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of filteredTemplates()" class="table-row-modern">
                  <td class="code-cell">
                    <span class="code-badge-modern">{{ t.code }}</span>
                  </td>
                  <td class="name-cell fw-semibold text-slate-700">{{ t.name }}</td>
                  <td class="path-cell">
                    <div *ngIf="t.filePath" class="badge-path-modern" [matTooltip]="'Descargar: ' + t.filePath" (click)="downloadFile(t.code)">
                      <div class="file-icon-box">
                        <mat-icon>description</mat-icon>
                      </div>
                      <span class="file-name">{{ t.filePath.split('/').pop() }}</span>
                      <mat-icon class="file-download-arrow">arrow_downward</mat-icon>
                    </div>
                    <div *ngIf="!t.filePath" class="badge-no-file-modern">
                      <mat-icon class="warn-icon">error_outline</mat-icon>
                      <span>Sin archivo (.docx)</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="actions-row-modern">
                      <button 
                        mat-icon-button 
                        class="action-btn-modern upload" 
                        (click)="triggerUpload(t.code)" 
                        [matTooltip]="'Subir/Actualizar archivo (.docx) para ' + t.code"
                        id="btn-upload-{{ t.code }}">
                        <mat-icon>upload_file</mat-icon>
                      </button>
                      <button 
                        mat-icon-button 
                        class="action-btn-modern download" 
                        [disabled]="!t.filePath" 
                        (click)="downloadFile(t.code)" 
                        [matTooltip]="'Descargar Plantilla ' + t.code"
                        id="btn-download-{{ t.code }}">
                        <mat-icon>download</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredTemplates().length === 0">
                  <td colspan="4" class="no-results-cell py-5">
                    <div class="no-results-container">
                      <mat-icon class="no-results-icon">search_off</mat-icon>
                      <h4>No se encontraron plantillas</h4>
                      <p class="text-muted-modern">Intente ajustar los términos de búsqueda o registre una nueva plantilla.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        <!-- Right Side: Creation Form -->
        <aside class="form-section-modern">
          <div class="content-card-modern glass-card p-4">
            <header class="section-header-modern mb-3">
              <div class="icon-circle">
                <mat-icon>post_add</mat-icon>
              </div>
              <div class="header-text">
                <h3>Nueva Plantilla</h3>
                <p>Configuración básica del formato</p>
              </div>
            </header>
            
            <p class="form-description mb-4">
              Registre el código identificador único y el nombre de la plantilla. Posteriormente podrá asociar su correspondiente archivo Word (.docx).
            </p>

            <form [formGroup]="form" (ngSubmit)="onCreateTemplate()" class="template-form-modern">
              <div class="form-group-modern mb-4">
                <label class="field-label-modern" for="template-code-input">Código de Plantilla</label>
                <div class="input-wrapper-modern" [class.focused]="isCodeFocused" [class.error]="form.get('code')?.touched && form.get('code')?.invalid">
                  <mat-icon class="input-icon">code</mat-icon>
                  <input 
                    id="template-code-input"
                    type="text" 
                    formControlName="code" 
                    placeholder="E.g. ACTA_APROBACION" 
                    (input)="onCodeInput($event)"
                    (focus)="isCodeFocused = true"
                    (blur)="isCodeFocused = false"
                  />
                </div>
                <div class="field-error-modern" *ngIf="form.get('code')?.touched && form.get('code')?.invalid">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 4px;">error_outline</mat-icon>
                  <span *ngIf="form.get('code')?.hasError('required')">El código es obligatorio.</span>
                  <span *ngIf="form.get('code')?.hasError('pattern')">Solo letras, números y guiones bajos.</span>
                </div>
                <span class="field-hint-modern" *ngIf="!form.get('code')?.invalid">Se convertirá automáticamente a mayúsculas.</span>
              </div>

              <div class="form-group-modern mb-4">
                <label class="field-label-modern" for="template-name-input">Nombre descriptivo / Título</label>
                <div class="input-wrapper-modern" [class.focused]="isNameFocused" [class.error]="form.get('name')?.touched && form.get('name')?.invalid">
                  <mat-icon class="input-icon">edit_note</mat-icon>
                  <input 
                    id="template-name-input"
                    type="text" 
                    formControlName="name" 
                    placeholder="E.g. Acta de Aprobación de Protocolo"
                    (focus)="isNameFocused = true"
                    (blur)="isNameFocused = false"
                  />
                </div>
                <div class="field-error-modern" *ngIf="form.get('name')?.touched && form.get('name')?.invalid">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 4px;">error_outline</mat-icon>
                  <span>El nombre descriptivo es obligatorio.</span>
                </div>
              </div>

              <!-- Dedicated file upload area -->
              <div class="form-group-modern mb-4">
                <label class="field-label-modern">Archivo de Plantilla (.docx) - Opcional</label>
                
                <div 
                  class="file-dropzone-modern" 
                  [class.has-file]="!!selectedFile()"
                  [class.drag-over]="isDragging"
                  (click)="formFileInput.click()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)">
                  
                  <input 
                    #formFileInput 
                    id="form-file-input"
                    type="file" 
                    accept=".docx" 
                    style="display: none;" 
                    (change)="onFormFileSelected($event)" 
                  />
                  
                  <div *ngIf="!selectedFile()" class="dropzone-empty">
                    <mat-icon class="dropzone-icon">cloud_upload</mat-icon>
                    <span class="dropzone-title">Seleccionar o arrastrar archivo Word</span>
                    <span class="dropzone-subtitle">Solo archivos formato .docx</span>
                  </div>
                  
                  <div *ngIf="selectedFile()" class="dropzone-filled" (click)="$event.stopPropagation()">
                    <div class="file-info-container">
                      <div class="docx-icon-box">
                        <mat-icon>description</mat-icon>
                      </div>
                      <div class="file-text-details">
                        <span class="file-name" [title]="selectedFile()?.name">{{ selectedFile()?.name }}</span>
                        <span class="file-size">{{ formatBytes(selectedFile()?.size || 0) }}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      class="remove-file-btn" 
                      (click)="clearSelectedFile(); $event.stopPropagation()" 
                      matTooltip="Quitar archivo">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <button 
                mat-flat-button 
                type="submit"
                class="submit-btn-modern w-100 py-3 mt-2" 
                [disabled]="form.invalid || isSubmitting()"
                id="btn-create-template">
                <span *ngIf="!isSubmitting()" class="d-flex align-items-center justify-content-center gap-2">
                  <mat-icon>add_circle_outline</mat-icon>
                  Registrar Plantilla
                </span>
                <span *ngIf="isSubmitting()" class="d-flex align-items-center justify-content-center gap-2">
                  <mat-icon class="spin-animation">sync</mat-icon>
                  Registrando...
                </span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>

    <!-- Hidden File Input for uploads -->
    <input #fileInput id="table-row-file-input" type="file" (change)="onFileSelected($event)" accept=".docx" style="display: none;" />
  `,
  styles: [`
    .dashboard-admin-container {
      padding: 2.5rem;
      background-color: #f8fafc;
      min-height: 100vh;
      font-family: 'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif;
      --shadow-premium: 0 10px 30px -10px rgba(0, 51, 102, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02);
      --shadow-hover: 0 20px 40px -15px rgba(0, 51, 102, 0.15), 0 2px 8px rgba(0, 51, 102, 0.05);
      --primary-color: #003366;
      --primary-light: #1e5c99;
      --primary-soft: rgba(0, 51, 102, 0.05);
      --success-color: #10b981;
      --success-soft: rgba(16, 185, 129, 0.05);
      --danger-color: #ef4444;
      --danger-soft: rgba(239, 68, 68, 0.05);
    }

    .main-header {
      .breadcrumb-chip-modern {
        background: linear-gradient(135deg, rgba(0, 51, 102, 0.06), rgba(30, 92, 153, 0.08));
        color: var(--primary-color);
        border: 1px solid rgba(0, 51, 102, 0.1);
        padding: 5px 12px;
        border-radius: 30px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 0.75rem;
        
        .breadcrumb-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .header-title {
        font-size: 2.25rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        letter-spacing: -0.03em;
      }
      .header-subtitle {
        color: #64748b;
        font-size: 1rem;
        margin-top: 0.25rem;
        font-weight: 450;
      }
    }

    .kpi-grid-modern {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
    }

    .kpi-card-modern {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-hover);
        border-color: rgba(0, 51, 102, 0.15);

        .icon-box-modern {
          transform: scale(1.1);
        }
      }
    }

    .kpi-content-modern {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .icon-box-modern {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
    }

    .bg-primary-soft { background: var(--primary-soft); }
    .text-primary-dark { color: var(--primary-color); }
    .bg-success-soft { background: var(--success-soft); }
    .text-success-dark { color: var(--success-color); }
    .bg-danger-soft { background: var(--danger-soft); }
    .text-danger-dark { color: var(--danger-color); }

    .kpi-info-modern {
      .label-modern {
        display: block;
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .value-modern {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        margin-top: 2px;
        color: #1e293b;
      }
    }

    .card-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      border-radius: 0 2px 2px 0;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .bg-primary-soft-progress { background: var(--primary-color); width: 100%; }
    .bg-success-soft-progress { background: var(--success-color); }
    .bg-danger-soft-progress { background: var(--danger-color); }

    .management-layout-modern {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .table-section-modern {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: var(--shadow-premium);
    }

    .table-header-modern {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .table-header-title {
      display: flex;
      align-items: center;
      gap: 10px;

      .section-title-modern {
        font-size: 1.25rem;
        font-weight: 850;
        color: #1e293b;
        margin: 0;
      }

      .count-badge {
        background: var(--primary-soft);
        color: var(--primary-color);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        border: 1px solid rgba(0, 51, 102, 0.06);
      }
    }

    .table-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-bar-modern {
      display: flex;
      align-items: center;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 6px 12px;
      border: 1.5px solid transparent;
      width: 280px;
      transition: all 0.3s ease;

      &:focus-within {
        background: #ffffff;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.08);
      }

      .search-icon {
        color: #64748b;
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .search-input-modern {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 0.85rem;
        color: #1e293b;
        font-family: inherit;

        &::placeholder {
          color: #94a3b8;
        }
      }

      .clear-search-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: color 0.2s ease;

        &:hover {
          color: #475569;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .upload-loader {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.08);
      color: var(--success-color);
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.15);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .table-responsive-modern {
      width: 100%;
      overflow-x: auto;
    }

    .templates-table-modern {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 8px;

      th {
        padding: 10px 16px;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 800;
        letter-spacing: 0.5px;
        border-bottom: none;
      }

      td {
        padding: 12px 16px;
        font-size: 0.875rem;
        color: #334155;
        background: #f8fafc;
        border-top: 1px solid rgba(226, 232, 240, 0.6);
        border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        transition: all 0.25s ease;
        vertical-align: middle;

        &:first-child {
          border-left: 1px solid rgba(226, 232, 240, 0.6);
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }

        &:last-child {
          border-right: 1px solid rgba(226, 232, 240, 0.6);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }
      }
    }

    .table-row-modern {
      &:hover td {
        background: #ffffff;
        border-color: rgba(0, 51, 102, 0.12);
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.02);
        transform: translateY(-1px);
      }
    }

    .code-badge-modern {
      background: var(--primary-soft);
      color: var(--primary-color);
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 700;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.78rem;
      border: 1px solid rgba(0, 51, 102, 0.08);
      display: inline-block;
    }

    .badge-path-modern {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.15);
      color: #15803d;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 220px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.3);
        transform: translateY(-1px);

        .file-download-arrow {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .file-icon-box {
        background: rgba(16, 185, 129, 0.12);
        width: 20px;
        height: 20px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 13px;
          width: 13px;
          height: 13px;
          color: #166534;
        }
      }

      .file-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-download-arrow {
        font-size: 12px;
        width: 12px;
        height: 12px;
        margin-left: auto;
        opacity: 0;
        transform: translateY(-2px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
    }

    .badge-no-file-modern {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.12);
      color: #b91c1c;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      .warn-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #dc2626;
      }
    }

    .actions-row-modern {
      display: flex;
      justify-content: center;
      gap: 6px;
    }

    .action-btn-modern {
      width: 34px !important;
      height: 34px !important;
      line-height: 34px !important;
      border-radius: 8px !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.upload:hover:not(:disabled) {
        color: var(--primary-color);
        background: var(--primary-soft);
        border-color: rgba(0, 51, 102, 0.2);
      }

      &.download:hover:not(:disabled) {
        color: var(--success-color);
        background: var(--success-soft);
        border-color: rgba(16, 185, 129, 0.2);
      }
    }

    .form-section-modern {
      position: sticky;
      top: 2rem;
    }

    .content-card-modern {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: var(--shadow-premium);
    }

    .section-header-modern {
      display: flex;
      align-items: center;
      gap: 12px;

      .icon-circle {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(0, 51, 102, 0.06), rgba(30, 92, 153, 0.08));
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .header-text {
        h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }
        p {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0;
        }
      }
    }

    .form-description {
      font-size: 0.82rem;
      color: #64748b;
      line-height: 1.5;
    }

    .form-group-modern {
      .field-label-modern {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .input-wrapper-modern {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 6px 12px;
        transition: all 0.25s ease;
        gap: 8px;

        &.focused {
          background: #ffffff;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3.5px rgba(0, 51, 102, 0.08);

          .input-icon {
            color: var(--primary-color);
          }
        }

        &.error {
          border-color: var(--danger-color);
          background: rgba(239, 68, 68, 0.01);
          
          .input-icon {
            color: var(--danger-color);
          }
        }

        .input-icon {
          color: #94a3b8;
          font-size: 18px;
          width: 18px;
          height: 18px;
          transition: color 0.2s ease;
        }

        input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.88rem;
          color: #1e293b;
          font-family: inherit;

          &::placeholder {
            color: #94a3b8;
          }
        }
      }

      .field-hint-modern {
        display: block;
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 4px;
        margin-left: 2px;
      }

      .field-error-modern {
        display: flex;
        align-items: center;
        font-size: 0.75rem;
        color: var(--danger-color);
        margin-top: 5px;
        font-weight: 600;
        margin-left: 2px;
      }
    }

    .submit-btn-modern {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%) !important;
      color: white !important;
      border-radius: 12px !important;
      font-weight: 700 !important;
      padding: 12px !important;
      border: none !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(0, 51, 102, 0.22);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: #cbd5e1 !important;
        color: #94a3b8 !important;
        box-shadow: none !important;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .no-results-cell {
      text-align: center;
    }

    .no-results-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem;

      .no-results-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        color: #94a3b8;
        margin-bottom: 0.75rem;
      }

      h4 {
        font-size: 1.05rem;
        font-weight: 700;
        color: #475569;
        margin-bottom: 0.25rem;
      }

      p {
        font-size: 0.82rem;
        color: #94a3b8;
        margin: 0;
      }
    }

    .file-dropzone-modern {
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      margin-top: 4px;

      &:hover {
        border-color: var(--primary-color);
        background: rgba(0, 51, 102, 0.02);
      }

      &.drag-over {
        border-color: var(--success-color);
        background: rgba(16, 185, 129, 0.05);
      }

      &.has-file {
        border-style: solid;
        border-color: var(--success-color);
        background: rgba(16, 185, 129, 0.02);
        cursor: default;
      }
    }

    .dropzone-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .dropzone-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #94a3b8;
        margin-bottom: 2px;
      }

      .dropzone-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #475569;
      }

      .dropzone-subtitle {
        font-size: 0.72rem;
        color: #94a3b8;
      }
    }

    .dropzone-filled {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      text-align: left;
    }

    .file-info-container {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;

      .docx-icon-box {
        background: rgba(16, 185, 129, 0.12);
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #166534;
        }
      }

      .file-text-details {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .file-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.72rem;
          color: #64748b;
        }
      }
    }

    .remove-file-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        color: var(--danger-color);
        background: rgba(239, 68, 68, 0.05);
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .spin-animation {
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1100px) {
      .management-layout-modern { grid-template-columns: 1fr; }
      .form-section-modern { position: relative; top: 0; }
    }
  `]
})
export class TemplateManagementPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private documentRepo = inject(IDocumentRepositoryPort);
  private s3StorageService = inject(S3StorageService);

  templates = signal<any[]>([]);
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadTargetCode = signal<string | null>(null);

  // Search filter query
  searchQuery = signal<string>('');

  // Form input focus variables
  isCodeFocused = false;
  isNameFocused = false;

  // New selected file and drag states
  selectedFile = signal<File | null>(null);
  isDragging = false;

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
    name: ['', Validators.required]
  });

  activeTemplatesCount = computed(() => {
    return this.templates().filter(t => !!t.filePath).length;
  });

  filteredTemplates = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.templates();
    if (!query) return list;
    return list.filter(t => 
      t.code?.toLowerCase().includes(query) || 
      t.name?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.documentRepo.getTemplates().subscribe({
      next: (list) => {
        this.templates.set(list || []);
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.snackBar.open('❌ Error al cargar la lista de plantillas.', 'Cerrar');
      }
    });
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    this.form.get('code')?.setValue(input.value, { emitEvent: false });
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  // Drag and Drop handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFormFile(files[0]);
    }
  }

  onFormFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.handleFormFile(file);
    }
  }

  handleFormFile(file: File) {
    if (file.name.split('.').pop()?.toLowerCase() !== 'docx') {
      this.snackBar.open('⚠️ Solo se permiten archivos Word (.docx).', 'Cerrar', { duration: 3000 });
      return;
    }
    this.selectedFile.set(file);
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    const inputEl = document.getElementById('form-file-input') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '';
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onCreateTemplate() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      const { code, name } = this.form.value;
      const file = this.selectedFile();

      this.documentRepo.createTemplateMetadata(code, name).pipe(
        switchMap(() => {
          if (file) {
            const s3Key = `templates/${code.toLowerCase()}_template.docx`;
            return this.s3StorageService.getUploadUrl(s3Key, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').pipe(
              switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
                filter(upRes => upRes.success),
                map(() => urlRes.key)
              )),
              switchMap(uploadedKey => this.documentRepo.associateTemplateFile(code, uploadedKey))
            );
          }
          return of(null);
        })
      ).subscribe({
        next: () => {
          const msg = file 
            ? '✅ Plantilla y archivo .docx creados y subidos con éxito.' 
            : '✅ Metadatos de la plantilla creados con éxito.';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.form.reset();
          this.selectedFile.set(null);
          this.isSubmitting.set(false);
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Error creating template:', err);
          this.snackBar.open('❌ Error al registrar metadatos o subir el archivo de plantilla.', 'Cerrar');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  triggerUpload(code: string) {
    this.uploadTargetCode.set(code);
    const hiddenFileInput = document.getElementById('table-row-file-input') as HTMLInputElement;
    if (hiddenFileInput) {
      hiddenFileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    const code = this.uploadTargetCode();

    if (!file || !code) return;

    if (file.name.split('.').pop()?.toLowerCase() !== 'docx') {
      this.snackBar.open('⚠️ Solo se permiten archivos Word (.docx).', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isUploading.set(true);
    const s3Key = `templates/${code.toLowerCase()}_template.docx`;

    // 1. Obtener URL firmada
    this.s3StorageService.getUploadUrl(s3Key, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').pipe(
      // 2. Subir a S3
      switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
        filter(upRes => upRes.success),
        map(() => urlRes.key)
      )),
      // 3. Asociar en base de datos
      switchMap(uploadedKey => this.documentRepo.associateTemplateFile(code, uploadedKey))
    ).subscribe({
      next: () => {
        this.snackBar.open(`✅ Archivo .docx asociado con éxito a la plantilla ${code}.`, 'Cerrar', { duration: 5000 });
        this.isUploading.set(false);
        this.uploadTargetCode.set(null);
        this.loadTemplates();
        event.target.value = ''; // Reset input file
      },
      error: (err) => {
        console.error('Error uploading template file:', err);
        this.snackBar.open('❌ Error al subir y asociar el archivo de la plantilla.', 'Cerrar');
        this.isUploading.set(false);
        this.uploadTargetCode.set(null);
        event.target.value = ''; // Reset input file
      }
    });
  }

  downloadFile(code: string) {
    this.documentRepo.downloadTemplate(code).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          window.open(`${environment.apiUrl}/documents/templates/${code}/download`, '_blank');
        }
      },
      error: () => {
        window.open(`${environment.apiUrl}/documents/templates/${code}/download`, '_blank');
      }
    });
  }
}
