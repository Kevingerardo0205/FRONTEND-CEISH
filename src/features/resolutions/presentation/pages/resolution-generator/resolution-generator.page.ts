import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, filter, map } from 'rxjs/operators';

import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

@Component({
  selector: 'app-resolution-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      
      <!-- VISTA A: BANDEJA DE PROTOCOLOS EVALUADOS -->
      <ng-container *ngIf="!selectedProtocol()">
        <header class="page-header mb-4">
          <div class="title-section">
            <div class="breadcrumb-chip">CEISH / Secretaría / Resoluciones</div>
            <h1 class="page-title">Bandeja de Resoluciones</h1>
            <p class="page-subtitle">Protocolos con evaluaciones de pares completadas listos para dictamen final</p>
          </div>
        </header>

        <main class="content-card shadow-soft p-4">
          <div class="table-responsive">
            <table class="w-100 tray-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título del Protocolo</th>
                  <th>Investigador Principal</th>
                  <th>Fecha de Recepción</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of pendingProtocols()">
                  <td class="fw-bold text-primary">{{ p.code || ('PRT-' + p.id) }}</td>
                  <td class="protocol-title-cell" [matTooltip]="p.title">{{ p.title }}</td>
                  <td>{{ p.principalInvestigator || 'No asignado' }}</td>
                  <td>{{ p.submissionDate | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="text-center">
                    <span class="badge-status-evaluado">EVALUADO</span>
                  </td>
                  <td class="text-center">
                    <button mat-flat-button color="primary" class="emit-action-btn" (click)="onSelectProtocol(p)">
                      <mat-icon>gavel</mat-icon>
                      <span>Emitir Dictamen</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="pendingProtocols().length === 0">
                  <td colspan="6" class="text-center text-muted py-5">
                    <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 8px;">inbox</mat-icon>
                    <p class="m-0 fw-bold">No hay protocolos pendientes de resolución consolidada</p>
                    <p class="small text-muted">Los protocolos aparecerán aquí cuando todos sus evaluadores asignados finalicen sus informes.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </ng-container>

      <!-- VISTA B: GENERADOR COMPLETO DE RESOLUCIÓN -->
      <ng-container *ngIf="selectedProtocol()">
        <!-- Header Seccion con botón de retorno -->
        <div class="page-header d-flex align-items-center gap-3 mb-4">
          <button mat-icon-button class="back-btn" (click)="onClearSelection()" matTooltip="Volver a la bandeja">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section flex-grow-1">
            <div class="breadcrumb-chip">CEISH / Secretaría / Resoluciones / Emisión</div>
            <h1 class="page-title">Emitir Resolución Consolidada</h1>
            <div class="protocol-title-banner mt-2">
              <mat-icon>menu_book</mat-icon>
              <span>{{ selectedProtocol()?.title }}</span>
            </div>
          </div>
          <span class="protocol-badge ms-3 align-self-start">{{ selectedProtocol()?.code || ('PRT-' + selectedProtocol()?.id) }}</span>
        </div>

        <div class="generator-layout animate-slide-up">
          <!-- Columna Izquierda (400px): Vista Previa y Configuración -->
          <aside class="preview-section sticky-aside">
            
            <!-- Vista Previa y Emisión -->
            <div class="content-card shadow-soft p-4">
              <h4 class="preview-title">
                <mat-icon>visibility</mat-icon>
                Vista Previa y Emisión
              </h4>
              
              <div class="document-preview-placeholder">
                <div class="preview-art">
                  <div class="pulse-ring"></div>
                  <mat-icon>picture_as_pdf</mat-icon>
                </div>
                <div class="active-preview-info">
                  <span class="doc-type">Resolución Consolidada Automática</span>
                  <span class="doc-target">{{ selectedProtocol()?.code || ('PRT-' + selectedProtocol()?.id) }}</span>
                </div>
              </div>

              <!-- Carga de Carta Firmada Real -->
              <div class="file-upload-zone mt-4 p-3 text-center">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: #64748b; margin-bottom: 8px;">upload_file</mat-icon>
                <p class="small text-muted mb-3" *ngIf="!selectedFile()" style="font-size: 0.8rem; font-weight: 500;">Cargue la Carta de Resolución PDF Firmada</p>
                <div *ngIf="selectedFile()" class="p-2 mb-3 rounded d-flex align-items-center justify-content-center gap-2" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
                  <mat-icon style="color: #475569; font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
                  <span class="small fw-bold" style="font-size: 0.8rem; color: #475569;">{{ selectedFile()?.name }}</span>
                </div>
                <button type="button" mat-stroked-button class="btn-sm w-100 select-pdf-btn" (click)="fileInput.click()">
                  {{ selectedFile() ? 'Cambiar Archivo PDF' : 'Seleccionar PDF' }}
                </button>
                <input #fileInput type="file" (change)="onFileSelected($event)" accept="application/pdf" style="display: none;" />
              </div>

              <div class="preview-actions d-flex flex-column gap-3 mt-4">
                <button type="button" mat-flat-button class="emit-btn w-100" 
                        [disabled]="form.invalid || isSubmitting()"
                        (click)="onGenerate()">
                  <span class="btn-spinner" *ngIf="isSubmitting()"></span>
                  <mat-icon *ngIf="!isSubmitting()">draw</mat-icon>
                  <span>{{ isSubmitting() ? 'Procesando...' : 'Notificar' }}</span>
                </button>
              </div>

              <div class="security-note mt-4">
                <mat-icon>security</mat-icon>
                <span>Al emitir, el sistema registrará la resolución y notificará al Investigador Principal del estado definitivo de su protocolo.</span>
              </div>
            </div>

            <!-- Configuración de la Resolución (Abajo de la Vista Previa) -->
            <div class="content-card shadow-soft p-4 mt-4">
              <header class="section-header mb-4">
                <mat-icon>settings_suggest</mat-icon>
                <h3>Configuración de la Resolución</h3>
              </header>
              
              <form [formGroup]="form">
                <!-- Tipo de Resolución -->
                <div class="mb-3">
                  <label class="field-label">Tipo de Dictamen / Resolución</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <mat-select formControlName="resolutionTypeId">
                      <mat-option [value]="1">Aprobación Definitiva</mat-option>
                      <mat-option [value]="2">Aprobado con Observaciones</mat-option>
                      <mat-option [value]="3">Rechazado / No Aprobado</mat-option>
                    </mat-select>
                    <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">gavel</mat-icon>
                  </mat-form-field>
                </div>

                <!-- Campos de Vigencia y Seguimiento (Ocultar si es Rechazado) -->
                <ng-container *ngIf="form.get('resolutionTypeId')?.value !== 3">
                  <div class="mb-3">
                    <label class="field-label">Vigencia de la Aprobación (Años)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <input matInput type="number" formControlName="validityYears" min="1" (keydown)="preventMinus($event)">
                      <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">calendar_today</mat-icon>
                      <span matSuffix class="pe-3 text-muted fw-bold">Años</span>
                    </mat-form-field>
                  </div>

                  <div class="mb-3">
                    <label class="field-label">Periodo de Seguimiento (Días)</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <input matInput type="number" formControlName="followUpPeriodDays" min="1" (keydown)="preventMinus($event)">
                      <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">rotate_right</mat-icon>
                      <span matSuffix class="pe-3 text-muted fw-bold">Días</span>
                    </mat-form-field>
                  </div>
                </ng-container>

                <mat-divider class="my-4"></mat-divider>

                <!-- Dictamen: Aprobado (1) -->
                <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 1">
                  <label class="field-label">Observaciones Consolidadas del Comité</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <textarea matInput formControlName="observations" rows="5" placeholder="Detalle la fundamentación y observaciones del comité ético-científico para la resolución consolidada..."></textarea>
                  </mat-form-field>
                </div>

                <!-- Dictamen: Aprobado con Observaciones (2) -->
                <ng-container *ngIf="form.get('resolutionTypeId')?.value === 2">
                  <div class="field-group mb-3">
                    <label class="field-label">Observaciones Mayores *</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="majorObservations" rows="4" placeholder="Describa las observaciones metodológicas o éticas mayores que el investigador principal DEBE subsanar..."></textarea>
                    </mat-form-field>
                  </div>

                  <div class="field-group mb-3">
                    <label class="field-label">Observaciones Menores</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="minorObservations" rows="3" placeholder="Describa las observaciones menores o sugerencias del comité (opcional)..."></textarea>
                    </mat-form-field>
                  </div>

                  <div class="field-group mb-2">
                    <label class="field-label">Procedimiento de Subsanación *</label>
                    <mat-form-field appearance="outline" class="full-width custom-field">
                      <textarea matInput formControlName="correctionProcedure" rows="3" placeholder="Ej: Subir los anexos correspondientes corregidos en la sección de Subsanación en formato PDF."></textarea>
                    </mat-form-field>
                  </div>
                </ng-container>

                <!-- Dictamen: Rechazado (3) -->
                <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 3">
                  <label class="field-label">Justificación del Rechazo *</label>
                  <mat-form-field appearance="outline" class="full-width custom-field">
                    <textarea matInput formControlName="majorObservations" rows="5" placeholder="Fundamente detalladamente las razones éticas, científicas o metodológicas del rechazo de este protocolo..."></textarea>
                  </mat-form-field>
                </div>
              </form>
            </div>
          </aside>

          <!-- Columna Derecha (1fr): Informes de Evaluadores -->
          <main class="form-section">
            <div class="content-card shadow-soft p-3 insumo-card" *ngIf="evaluationsList().length > 0">
              <header class="insumo-header mb-2">
                <mat-icon class="insumo-icon">rate_review</mat-icon>
                <h4 class="m-0 insumo-title">Informes de Evaluadores (Insumo)</h4>
              </header>
              <p class="insumo-desc mb-3">Descargue los informes oficiales individuales subidos por cada uno de los evaluadores de la versión activa.</p>
              
              <div class="evaluators-list">
                <div class="evaluator-item" *ngFor="let ev of evaluationsList()">
                  <div class="evaluator-main">
                    <mat-icon class="evaluator-icon">account_circle</mat-icon>
                    <div class="evaluator-info">
                      <span class="evaluator-title">Par Evaluador ({{ getProfileLabel(ev.evaluatorProfile?.name || ev.evaluatorProfile) }})</span>
                    </div>
                  </div>
                  <div class="evaluator-actions">
                    <span class="action-label">Descargar Informe:</span>
                    <button type="button" mat-icon-button class="btn-download-pdf-sm" (click)="downloadEvaluatorPdf(ev.id)" matTooltip="Descargar Reporte PDF">
                      <mat-icon>picture_as_pdf</mat-icon>
                    </button>
                    <button type="button" mat-icon-button class="btn-download-docx-sm" (click)="downloadEvaluatorDocx(ev.id)" matTooltip="Descargar Word DOCX">
                      <mat-icon>description</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8fafc;
      min-height: 100vh;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .breadcrumb-chip {
      background: #f1f5f9;
      color: #475569;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .page-title {
      font-size: 2.25rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.8px;
    }
    .page-subtitle {
      font-size: 1.05rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-weight: 500;
    }
    .protocol-title-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.01);
      mat-icon { color: #64748b; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }

    .generator-layout {
      display: grid;
      grid-template-columns: 660px 450px;
      gap: 2.5rem;
      align-items: start;
      justify-content: center;
    }

    .sticky-aside {
      position: sticky;
      top: 2rem;
    }

    .content-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      transition: all 0.3s ease;
    }
    .content-card:hover {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1.25rem;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: #64748b; }
      h3 { font-size: 1.2rem; font-weight: 800; margin: 0; color: #1e293b; }
    }

    .field-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ::ng-deep .custom-field {
      width: 100%;
      .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 12px !important;
        border: 1px solid #e2e8f0 !important;
        transition: all 0.2s ease;
        &:hover {
          border-color: #cbd5e1 !important;
          background-color: #f1f5f9 !important;
        }
      }
      .mdc-notched-outline__leading, .mdc-notched-outline__notch, .mdc-notched-outline__trailing {
        border-color: transparent !important;
      }
      &.mat-focused .mat-mdc-text-field-wrapper {
        border-color: #0f172a !important;
        background-color: white !important;
        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.05) !important;
      }
      
      input.mat-mdc-input-element, textarea.mat-mdc-input-element {
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        color: #1e293b !important;
      }
      
      input::placeholder, textarea::placeholder {
        font-size: 0.85rem !important;
        color: #94a3b8 !important;
      }
      
      .pe-3.text-muted.fw-bold {
        font-size: 0.85rem !important;
      }
    }

    /* Polish table and elements */
    .tray-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 8px;
      thead th {
        padding: 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 800;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e2e8f0;
      }
      tbody tr {
        background: #ffffff;
        transition: all 0.2s ease;
        td {
          padding: 1.25rem 1rem;
          font-size: 0.92rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          &:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
          &:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        }
        &:hover td {
          background-color: #f8fafc;
        }
      }
    }

    .protocol-title-cell {
      font-weight: 700;
      color: #0f172a;
      max-width: 360px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-status-evaluado {
      background: #f1f5f9;
      color: #475569;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      &::before {
        content: '';
        width: 6px;
        height: 6px;
        background-color: #64748b;
        border-radius: 50%;
      }
    }

    .emit-action-btn {
      border-radius: 12px;
      font-weight: 800;
      padding: 0 1.5rem;
      height: 44px;
      background: #0f172a !important;
      color: white !important;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.1);
      transition: all 0.2s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
      }
    }

    .back-btn {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      color: #475569;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      &:hover {
        background-color: #f1f5f9;
        border-color: #94a3b8;
        transform: translateX(-3px);
      }
    }

    .protocol-badge {
      background: #0f172a;
      color: white;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    }

    /* Evaluators List Layout */
    .evaluators-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .evaluator-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.4rem 0.75rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: all 0.2s ease;
      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.01);
      }
    }

    .evaluator-main {
      display: flex;
      align-items: center;
      gap: 8px;
      .evaluator-icon {
        color: #94a3b8;
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      .evaluator-info {
        display: flex;
        flex-direction: column;
        .evaluator-title { font-weight: 700; color: #475569; font-size: 0.8rem; }
      }
    }

    .evaluator-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      .action-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        margin-right: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    /* Insumo secondary card styles */
    .insumo-card {
      background: #fafafb !important;
      border: 1px dashed #cbd5e1 !important;
      max-width: 450px;
      opacity: 0.9;
      transition: all 0.2s ease;
      &:hover {
        opacity: 1;
        background: white !important;
        border-style: solid !important;
        border-color: #cbd5e1 !important;
      }
      
      .btn-download-pdf-sm, .btn-download-docx-sm {
        width: 28px !important;
        height: 28px !important;
        line-height: 28px !important;
        mat-icon {
          font-size: 15px !important;
          width: 15px !important;
          height: 15px !important;
        }
      }
    }

    .insumo-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      .insumo-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #64748b;
      }
      .insumo-title {
        font-size: 1rem;
        font-weight: 700;
        color: #475569;
      }
    }

    .insumo-desc {
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.5rem;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: #64748b; }
    }

    .document-preview-placeholder {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem 1rem;
      text-align: center;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.01);
      
      .preview-art {
        position: relative;
        width: 56px;
        height: 56px;
        background: #f1f5f9;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
        box-shadow: 0 4px 12px rgba(100, 116, 139, 0.1);
        mat-icon { font-size: 28px; width: 28px; height: 28px; color: #64748b; z-index: 2; }
        
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(100, 116, 139, 0.1);
          border-radius: 12px;
          animation: pulse 2s infinite;
          z-index: 1;
        }
      }

      .active-preview-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .doc-type { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
        .doc-target { font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      }
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 0.4; }
      100% { transform: scale(1.35); opacity: 0; }
    }

    .file-upload-zone {
      border-radius: 12px;
      border: 2px dashed #cbd5e1 !important;
      background: white;
      padding: 1.25rem 1rem;
      transition: all 0.3s ease;
      &:hover {
        border-color: #94a3b8 !important;
        background: #f8fafc;
      }
    }

    .select-pdf-btn {
      line-height: 36px !important;
      height: 36px !important;
      font-size: 0.8rem !important;
      font-weight: 800 !important;
      border-radius: 12px !important;
      border: 1px solid #cbd5e1 !important;
      color: #475569 !important;
      background-color: white !important;
      transition: all 0.2s ease;
      &:hover {
        background-color: #f8fafc !important;
        border-color: #94a3b8 !important;
      }
    }

    .emit-btn {
      height: 54px;
      background: #0f172a !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.95rem;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
      }
      &:disabled {
        background: #cbd5e1 !important;
        color: #94a3b8 !important;
        box-shadow: none;
        cursor: not-allowed;
      }
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .security-note {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 10px 12px;
      border-radius: 12px;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.4;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; flex-shrink: 0; }
    }

    .btn-download-pdf-sm, .btn-download-docx-sm {
      width: 36px;
      height: 36px;
      line-height: 36px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      color: #64748b;
      transition: all 0.2s ease;
      &:hover:not(:disabled) {
        transform: scale(1.05);
        border-color: #cbd5e1;
        background-color: #f8fafc;
        &.btn-download-pdf-sm { color: #ef4444; }
        &.btn-download-docx-sm { color: #2563eb; }
      }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1100px) {
      .generator-layout {
        grid-template-columns: 1fr;
        max-width: 660px;
        margin: 0 auto;
      }
      .preview-section { position: static; }
    }
  `]
})
export class ResolutionGeneratorPage implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private resolutionRepo = inject(IResolutionRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private s3StorageService = inject(S3StorageService);

  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);

  pendingProtocols = signal<ProtocolEntity[]>([]);
  selectedProtocol = signal<ProtocolEntity | null>(null);
  evaluationsList = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    resolutionTypeId: [1, Validators.required],
    validityYears: [1, [Validators.required, Validators.min(1)]],
    followUpPeriodDays: [180, [Validators.required, Validators.min(1)]],
    observations: ['', Validators.required],
    majorObservations: [''],
    minorObservations: [''],
    correctionProcedure: ['']
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['protocolId']) {
        const pIdNum = Number(params['protocolId']);
        this.loadSelectedProtocol(String(pIdNum));
      } else {
        this.selectedProtocol.set(null);
        this.loadPendingProtocols();
      }
    });

    this.form.get('resolutionTypeId')?.valueChanges.subscribe(typeId => {
      this.updateValidators(Number(typeId));
    });
  }

  private updateValidators(typeId: number) {
    const obsCtrl = this.form.get('observations');
    const majorObsCtrl = this.form.get('majorObservations');
    const correctionProcedureCtrl = this.form.get('correctionProcedure');

    // Limpiar todos
    obsCtrl?.clearValidators();
    majorObsCtrl?.clearValidators();
    correctionProcedureCtrl?.clearValidators();

    if (typeId === 1) {
      obsCtrl?.setValidators([Validators.required]);
    } else if (typeId === 2) {
      majorObsCtrl?.setValidators([Validators.required]);
      correctionProcedureCtrl?.setValidators([Validators.required]);
    } else if (typeId === 3) {
      majorObsCtrl?.setValidators([Validators.required, Validators.minLength(20)]);
    }

    obsCtrl?.updateValueAndValidity();
    majorObsCtrl?.updateValueAndValidity();
    correctionProcedureCtrl?.updateValueAndValidity();
  }

  loadPendingProtocols() {
    this.protocolRepo.getProtocolsByStatusId(14).subscribe({
      next: (list) => {
        this.pendingProtocols.set(list || []);
      },
      error: () => this.snackBar.open('❌ Error al cargar la bandeja de protocolos evaluados.', 'Cerrar')
    });
  }

  loadSelectedProtocol(id: string) {
    this.protocolRepo.getById(id).subscribe({
      next: (protocol) => {
        this.onSelectProtocol(protocol);
      },
      error: () => this.snackBar.open('❌ Error al cargar el protocolo seleccionado.', 'Cerrar')
    });
  }

  onSelectProtocol(protocol: ProtocolEntity) {
    this.selectedProtocol.set(protocol);
    this.form.patchValue({
      resolutionTypeId: 1,
      validityYears: 1,
      followUpPeriodDays: 180,
      observations: '',
      majorObservations: '',
      minorObservations: '',
      correctionProcedure: ''
    });
    this.selectedFile.set(null);
    this.updateValidators(1);

    // Cargar informes de evaluación asociados
    this.evaluationRepo.getByProtocolId(protocol.id).subscribe({
      next: (list) => {
        this.evaluationsList.set(list || []);
      },
      error: (err) => {
        console.error('Error al obtener evaluaciones del protocolo:', err);
        this.evaluationsList.set([]);
      }
    });
  }

  onClearSelection() {
    this.selectedProtocol.set(null);
    this.evaluationsList.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: null },
      queryParamsHandling: 'merge'
    });
    this.loadPendingProtocols();
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.snackBar.open('⚠️ Solo se permiten archivos PDF.', 'Cerrar', { duration: 3000 });
        return;
      }
      this.selectedFile.set(file);
    }
  }

  getProfileLabel(profile: string): string {
    if (!profile) return 'General';
    const profileStr = String(profile).toUpperCase();
    const map: any = {
      'METODOLOGIA': 'Metodológico',
      'BIOETICA': 'de Bioética',
      'LEGAL': 'de Aspectos Jurídicos'
    };
    return map[profileStr] || profile;
  }

  getVerdictIcon(verdict: string): string {
    if (!verdict) return 'schedule';
    const v = verdict.toUpperCase();
    if (v === 'APROBADO' || v === 'APPROVED') return 'check_circle';
    if (v === 'RECHAZADO' || v === 'REJECTION' || v === 'NO_APROBADO') return 'cancel';
    return 'info';
  }

  downloadEvaluatorPdf(evaluationId: any) {
    if (!evaluationId) return;
    this.evaluationRepo.getDocumentDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el PDF.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el PDF de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }

  downloadEvaluatorDocx(evaluationId: any) {
    if (!evaluationId) return;
    this.evaluationRepo.getDocxDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el Word DOCX.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el Word DOCX de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }

  preventMinus(event: KeyboardEvent) {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  onGenerate() {
    const protocol = this.selectedProtocol();
    if (this.form.valid && protocol) {
      this.isSubmitting.set(true);
      const formValue = this.form.value;
      const protocolIdNum = Number(protocol.id);

      // 1. Generar la ruta/key para el Acta Consolidada
      const s3Key = `protocols/${protocolIdNum}/resolutions/Carta_Resolucion_Consolidada.pdf`;
      const fileToUpload = this.selectedFile() || new File([new Blob(['Acta de Resolución'], { type: 'application/pdf' })], 'Carta_Resolucion_Consolidada.pdf', { type: 'application/pdf' });

      // 2. Solicitar URL firmada y realizar la subida a Cloudflare R2
      this.s3StorageService.getUploadUrl(s3Key, 'application/pdf').pipe(
        switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter(upRes => upRes.success),
          map(() => urlRes.key)
        )),
        switchMap(uploadedKey => {
          const typeId = Number(formValue.resolutionTypeId);
          const payload = {
            protocolId: protocolIdNum,
            resolutionTypeId: typeId,
            validityYears: typeId === 3 ? undefined : Number(formValue.validityYears),
            followUpPeriodDays: typeId === 3 ? undefined : Number(formValue.followUpPeriodDays),
            majorObservations: typeId === 1 ? formValue.observations : formValue.majorObservations,
            minorObservations: typeId === 2 ? formValue.minorObservations : undefined,
            correctionProcedure: typeId === 2 ? formValue.correctionProcedure : undefined,
            pdfLetterPath: uploadedKey
          };

          return this.resolutionRepo.submitResolution(payload);
        })
      ).subscribe({
        next: (res) => {
          this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', { duration: 5000 });
          this.form.reset();
          this.selectedFile.set(null);
          this.isSubmitting.set(false);
          this.onClearSelection();
        },
        error: (err) => {
          console.error('Error submitting resolution:', err);
          if (err.status === 409) {
            this.snackBar.open('⚠️ El expediente de este protocolo ya ha sido versionado o modificado por otra transacción concurrente. Por favor, recargue la página.', 'Cerrar', { duration: 8000 });
          } else {
            this.snackBar.open('❌ Error al procesar la resolución', 'Cerrar', { duration: 5000 });
          }
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
