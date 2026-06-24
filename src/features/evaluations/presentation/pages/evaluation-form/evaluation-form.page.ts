import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { FileUploaderComponent } from '@shared/components/file-uploader/file-uploader.component';
import { SubmitEvaluationUseCase } from '../../../application/submit-evaluation.use-case';
import { ANEXOS_EVALUACION, AnexoEvaluacion, ANNEX9_ITEMS } from '../../constants/anexos-evaluacion.constants';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { of, Observable } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { sanitizeFilename } from '@domain/entities/storage.interface';
import { EvaluationMapper } from '@infrastructure/mappers/evaluation.mapper';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ProtocolCodePipe,
    FileUploaderComponent
  ],
  template: `
    <div class="ev-page">

      <!-- Header sticky compacto -->
      <div class="ev-header">
        <div class="ev-header-inner">
          <button mat-icon-button routerLink="/dashboard/evaluations/list"
                  [disabled]="isSubmitting()" aria-label="Volver">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="ev-meta">
            <span class="ev-code">{{ protocolInfo()?.code | protocolCode }}</span>
            <span class="ev-title">{{ protocolInfo()?.title }}</span>
            <span class="ev-badge">{{ currentAnexo()?.anexo }} — {{ currentAnexo()?.titulo }}</span>
          </div>
        </div>
        <mat-progress-bar *ngIf="isSubmitting()" mode="indeterminate" color="primary"></mat-progress-bar>
      </div>

      <!-- Cuerpo del Formulario de Entrada (Ocultado al enviar exitosamente) -->
      <div class="ev-body" *ngIf="!isSubmittedSuccessfully()">

        <!-- ── Formulario una sola pantalla ── -->
        <div class="ev-form-col" *ngIf="!isSuspended()">
          <form [formGroup]="evaluationForm" (ngSubmit)="onSubmit()" novalidate>

            <!-- Secciones dinámicas del Anexo -->
            @for (section of sections; track section) {
              <div class="ev-section">
                <div class="ev-section-header">
                  <span class="ev-section-label">{{ sectionLabel(section) }}</span>
                </div>
                <div class="ev-fields">

                  <!-- Checklist de criterios técnicos del Anexo 9 (Fase 1) -->
                  @if (currentAnexo()?.id === 'anexo9' && getItemsPorSeccion(section).length > 0) {
                    <div class="ev-items-checklist">
                      <div class="ev-item-row header">
                        <span class="col-desc">Criterios de Evaluación (Anexo 9)</span>
                        <span class="col-actions">Calificación</span>
                      </div>
                      @for (item of getItemsPorSeccion(section); track item.code) {
                        <div class="ev-item-row-wrapper">
                          <div class="ev-item-row">
                            <div class="ev-item-info">
                              <span class="ev-item-code">{{ item.code }}</span>
                              <span class="ev-item-label">{{ item.label }}</span>
                            </div>
                            
                            <div class="ev-item-actions">
                              <div class="item-status-selector">
                                <button type="button" class="st-btn st-c"
                                        [class.active]="getControl('estado_' + item.code).value === 'C'"
                                        (click)="setItemStatus(item.code, 'C')">
                                  <span>C</span>
                                </button>
                                <button type="button" class="st-btn st-nc"
                                        [class.active]="getControl('estado_' + item.code).value === 'NC'"
                                        (click)="setItemStatus(item.code, 'NC')">
                                  <span>NC</span>
                                </button>
                                <button type="button" class="st-btn st-na"
                                        [class.active]="getControl('estado_' + item.code).value === 'NA'"
                                        (click)="setItemStatus(item.code, 'NA')">
                                  <span>NA</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Observación individual del criterio en caso de NC (Requerida) -->
                          @if (getControl('estado_' + item.code).value === 'NC') {
                            <div class="ev-item-obs-box">
                              <mat-form-field appearance="outline" class="ev-input compact-input">
                                <mat-label>Observación específica para {{ item.code }} (Obligatoria)</mat-label>
                                <textarea matInput rows="2" [formControlName]="'obs_' + item.code"
                                          placeholder="Detalle la observación técnica o incumplimiento del criterio..."></textarea>
                              </mat-form-field>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }

                  @for (campo of getCamposPorSeccion(section); track campo.id) {

                    @if (campo.tipo === 'result_triple') {
                      <div class="ev-field-group">
                        <label class="ev-field-label">{{ campo.label }}</label>
                        <div class="ev-result-row">
                          <button type="button" class="rv-btn rv-approve"
                                  [class.active]="getControl(campo.id).value === 'APROBADO'"
                                  [disabled]="campo.id.startsWith('resultado') && seccionTieneNC(section)"
                                  (click)="setResult(campo.id, 'APROBADO')">
                            <mat-icon>check_circle</mat-icon>
                            <span>Aprobado</span>
                          </button>
                          <button type="button" class="rv-btn rv-observe"
                                  [class.active]="isConditional(getControl(campo.id).value)"
                                  (click)="setResult(campo.id, 'CON_OBSERVACIONES')">
                            <mat-icon>edit_note</mat-icon>
                            <span>{{ currentAnexo()?.id === 'anexo10' ? 'Condicionado' : 'Con Observaciones' }}</span>
                          </button>
                          <button type="button" class="rv-btn rv-reject"
                                  [class.active]="getControl(campo.id).value === 'NO_APROBADO'"
                                  (click)="setResult(campo.id, 'NO_APROBADO')">
                            <mat-icon>cancel</mat-icon>
                            <span>No Aprobado</span>
                          </button>
                        </div>
                      </div>
                    }

                    @if (campo.tipo === 'text') {
                      @if (campo.id === 'fechaEvaluacion') {
                        <div class="ev-field-group">
                          <label class="ev-field-label">{{ campo.label }}</label>
                          <mat-form-field appearance="outline" class="ev-input">
                            <input matInput type="date" [formControlName]="campo.id"
                                   [attr.max]="today" aria-label="Fecha de evaluación Anexo 11">
                            <mat-hint>Formato: YYYY-MM-DD</mat-hint>
                          </mat-form-field>
                        </div>
                      }
                      @if (campo.id !== 'fechaEvaluacion' && shouldShowTextField(campo.id)) {
                        <div class="ev-field-group ev-field-conditional">
                          <label class="ev-field-label">{{ campo.label }}</label>
                          <mat-form-field appearance="outline" class="ev-input">
                            <textarea matInput rows="3" [formControlName]="campo.id"
                                      placeholder="Detalle las observaciones..."></textarea>
                          </mat-form-field>
                        </div>
                      }
                    }

                  }
                </div>
              </div>
            }

            <!-- ── Sustento, PDF y Envío (sección final integrada) ── -->
            <div class="ev-section ev-section--submit">
              <div class="ev-section-header ev-section-header--submit">
                <mat-icon class="ev-section-icon">task_alt</mat-icon>
                <span class="ev-section-label">Sustento Técnico y Envío</span>
              </div>
              <div class="ev-fields">

                <!-- Dictamen Global Manual para Anexo 9 (Regla 4) -->
                @if (currentAnexo()?.id === 'anexo9') {
                  <div class="ev-field-group">
                    <label class="ev-field-label">Dictamen Global de la Evaluación</label>
                    <div class="ev-result-row">
                      <button type="button" class="rv-btn rv-approve"
                              [class.active]="selectedGlobalResult() === 'APROBADO'"
                              [disabled]="hasNoAprobadoAspect() || hasObsAspect()"
                              (click)="setGlobalResult('APROBADO')">
                        <mat-icon>verified</mat-icon>
                        <span>Aprobado</span>
                      </button>
                      <button type="button" class="rv-btn rv-observe"
                              [class.active]="selectedGlobalResult() === 'PENDIENTE_SUBSANACION'"
                              [disabled]="hasNoAprobadoAspect()"
                              (click)="setGlobalResult('PENDIENTE_SUBSANACION')">
                        <mat-icon>rule_folder</mat-icon>
                        <span>Pendiente Subsanación</span>
                      </button>
                      <button type="button" class="rv-btn rv-reject"
                              [class.active]="selectedGlobalResult() === 'RECHAZADO'"
                              (click)="setGlobalResult('RECHAZADO')">
                        <mat-icon>gpp_bad</mat-icon>
                        <span>Rechazado</span>
                      </button>
                    </div>
                  </div>
                }

                <!-- Observaciones generales -->
                <div class="ev-field-group">
                  <label class="ev-field-label">
                    Observaciones Generales
                    <span *ngIf="isReportRequired()" class="ev-tag-req">Obligatorio</span>
                  </label>
                  <mat-form-field appearance="outline" class="ev-input">
                    <textarea matInput rows="3" [formControl]="observationsControl"
                              placeholder="Resumen técnico y consideraciones del dictamen..."></textarea>
                  </mat-form-field>
                </div>

                <!-- ── Fase de Generación de Borrador (Boton Detonante) ── -->
                <div class="ev-draft-generator-box" *ngIf="!isDraftGenerated()">
                  <div class="ev-alert ev-alert--info">
                    <mat-icon>info</mat-icon>
                    <span>Complete las secciones superiores y haga clic en <strong>Generar Documentos</strong>. El backend persistirá su checklist y le devolverá el PDF y Word oficiales autogenerados para que los descargue, firme y suba el definitivo.</span>
                  </div>
                  <div class="ev-action-row" style="margin-top: 10px;">
                    <button type="button" class="ev-draft-btn"
                            [disabled]="!canSubmitDraft() || isDraftSubmitting()"
                            (click)="generateDraft()">
                      <mat-spinner *ngIf="isDraftSubmitting()" diameter="16" color="accent" style="margin-right: 8px; display: inline-block;"></mat-spinner>
                      <mat-icon *ngIf="!isDraftSubmitting()">article</mat-icon>
                      <span>{{ isDraftSubmitting() ? 'Generando Documentos...' : 'Generar Documentos de Evaluación' }}</span>
                    </button>
                  </div>
                </div>

                <!-- ── Fase de Descarga, Firma y Subida del Documento Definitivo ── -->
                <div class="ev-finalize-flow-container" *ngIf="isDraftGenerated()">
                  
                  <!-- Descarga de borradores oficiales del backend -->
                  <div class="ev-draft-downloads-box">
                    <p class="ev-downloads-title">📄 Documentos Generados por el Backend (Listos para firmar):</p>
                    <div class="ev-download-inline-actions">
                      <button type="button" class="dl-inline-btn dl-pdf" (click)="downloadPdf()">
                        <mat-icon>picture_as_pdf</mat-icon>
                        <span>Descargar PDF</span>
                      </button>
                      <button type="button" class="dl-inline-btn dl-docx" (click)="downloadDocx()">
                        <mat-icon>description</mat-icon>
                        <span>Descargar Word DOCX</span>
                      </button>
                    </div>
                    
                    <div class="ev-draft-update-row">
                      <span>¿Hizo cambios arriba? Actualice los reportes generados antes de firmar:</span>
                      <button type="button" class="ev-draft-btn-secondary"
                              [disabled]="!canSubmitDraft() || isDraftSubmitting()"
                              (click)="generateDraft()">
                        <mat-spinner *ngIf="isDraftSubmitting()" diameter="14" color="accent" style="display: inline-block; margin-right: 5px;"></mat-spinner>
                        <mat-icon *ngIf="!isDraftSubmitting()">refresh</mat-icon>
                        <span>Actualizar Documentos</span>
                      </button>
                    </div>
                  </div>

                  <!-- Cargador del PDF firmado -->
                  <div class="ev-upload-box" [class.ev-upload-done]="!!selectedFile">
                    <div class="ev-upload-row">
                      <mat-icon class="ev-upload-icon">
                        {{ selectedFile ? 'task_alt' : 'upload_file' }}
                      </mat-icon>
                      <div class="ev-upload-texts">
                        <p class="ev-upload-title">
                          Subir Documento Firmado
                          <span class="ev-required-star">*</span>
                        </p>
                        <p class="ev-upload-sub" *ngIf="!selectedFile">
                          PDF firmado · Máx. 10 MB · <strong>Obligatorio para finalizar</strong>
                        </p>
                        <p class="ev-upload-sub ev-upload-ok" *ngIf="selectedFile">
                          {{ selectedFile!.name }} — {{ (selectedFile!.size/1024/1024).toFixed(2) }} MB ✓
                        </p>
                      </div>
                    </div>
                    <app-file-uploader (upload)="onFileUpload($event)"></app-file-uploader>
                  </div>

                  <!-- Alertas de validación de envío final -->
                  <div class="ev-alert ev-alert--warn" *ngIf="!selectedFile">
                    <mat-icon>warning_amber</mat-icon>
                    <span>Suba el PDF firmado y validado para poder habilitar el envío final al CEISH.</span>
                  </div>

                  <div class="ev-alert ev-alert--warn"
                       *ngIf="isReportRequired() && !observationsControl.value?.trim()">
                    <mat-icon>info</mat-icon>
                    <span>Con resultados negativos o condicionados debe añadir la justificación técnica.</span>
                  </div>

                  <div class="ev-alert ev-alert--error" *ngIf="hasAnexo9GlobalInconsistency()">
                    <mat-icon>gpp_bad</mat-icon>
                    <span>Inconsistencia: algún componente tiene NO APROBADO o CON OBSERVACIONES, pero el resultado global derivado sería APROBADO. Corrija los resultados en las secciones superiores o el dictamen global.</span>
                  </div>

                  <div class="ev-alert ev-alert--warn"
                       *ngIf="currentAnexo()?.id === 'anexo10' && isConditional(getControl('resultadoGlobal')?.value) && !getControl('condiciones')?.value?.trim()">
                    <mat-icon>edit_note</mat-icon>
                    <span>Resultado condicionado: complete la descripción de condiciones en la sección superior.</span>
                  </div>

                  <!-- Acciones de Finalización -->
                  <div class="ev-action-row" style="margin-top: 15px;">
                    <button mat-stroked-button type="button"
                            routerLink="/dashboard/evaluations/list"
                            [disabled]="isSubmitting()">
                      Cancelar
                    </button>
                    <button type="submit" class="ev-submit-btn"
                            [disabled]="!canFinalize() || isSubmitting()"
                            [matTooltip]="!selectedFile ? 'Adjunte el informe PDF firmado' : ''">
                      <mat-spinner *ngIf="isSubmitting()" diameter="16" color="accent" style="display: inline-block; margin-right: 6px;"></mat-spinner>
                      <mat-icon *ngIf="!isSubmitting()">send</mat-icon>
                      <span>{{ isSubmitting() ? 'Finalizando...' : 'Enviar al CEISH →' }}</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </form>
        </div>

        <!-- Banner de suspensión -->
        <div class="ev-suspended" *ngIf="isSuspended()">
          <div class="ev-suspended-card">
            <mat-icon class="ev-suspended-icon">lock_clock</mat-icon>
            <h2>Evaluación Suspendida</h2>
            <p>Suspendida hasta que los pares evaluadores consoliden el nivel de riesgo.</p>
          </div>
        </div>

        <!-- Sidebar documentos -->
        <aside class="ev-sidebar" *ngIf="showPreview()">
          <div class="ev-sidebar-header">
            <mat-icon>folder_open</mat-icon>
            <div>
              <h3>Expediente</h3>
              <p>Documentos del protocolo</p>
            </div>
          </div>
          <div class="ev-doc-list">
            <div class="ev-doc-item" *ngFor="let d of protocolDocuments()">
              <mat-icon class="ev-doc-pdf">picture_as_pdf</mat-icon>
              <div class="ev-doc-info">
                <span class="ev-doc-name">{{ d.name || d.title }}</span>
                <span class="ev-doc-type">{{ d.type }}</span>
              </div>
              <button type="button" mat-icon-button (click)="verDocumento(d.id)"
                      aria-label="Abrir documento">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </div>
            <p class="ev-doc-empty" *ngIf="protocolDocuments().length === 0">
              Sin documentos cargados.
            </p>
          </div>
        </aside>

      </div>

      <!-- ── Pantalla de Éxito con enlaces de descarga de R2 (Fase 2) ── -->
      <div class="ev-body ev-body--success" *ngIf="isSubmittedSuccessfully()">
        <div class="ev-success-screen">
          <div class="ev-success-card">
            <mat-icon class="ev-success-icon">task_alt</mat-icon>
            <h2>¡Evaluación Enviada con Éxito!</h2>
            <p class="ev-success-desc">
              El dictamen ha sido registrado correctamente en la plataforma CEISH y los reportes oficiales del Anexo 9 han sido generados automáticamente.
            </p>
            
            <div class="ev-download-actions" *ngIf="generatedEvaluationId()">
              <button type="button" class="dl-btn dl-pdf" (click)="downloadPdf()">
                <mat-icon>picture_as_pdf</mat-icon>
                <span>Descargar Reporte PDF</span>
              </button>
              <button type="button" class="dl-btn dl-docx" (click)="downloadDocx()">
                <mat-icon>description</mat-icon>
                <span>Descargar Word DOCX (Firmas / Editable)</span>
              </button>
            </div>
            
            <button mat-flat-button color="primary" class="ev-back-btn" routerLink="/dashboard/evaluations/list">
              Volver a la Bandeja de Asignaciones
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Página ── */
    .ev-page {
      background: #f4f6f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', sans-serif;
    }

    /* ── Header ── */
    .ev-header {
      position: sticky; top: 0; z-index: 100;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }
    .ev-header-inner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 24px;
    }
    .ev-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .ev-code {
      font-size: 0.6rem; font-weight: 800; color: #003366;
      text-transform: uppercase; letter-spacing: 0.6px;
    }
    .ev-title {
      font-size: 0.9rem; font-weight: 700; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 680px;
    }
    .ev-badge {
      font-size: 0.62rem; font-weight: 700; color: #64748b; text-transform: uppercase;
    }

    /* ── Body ── */
    .ev-body { flex: 1; display: flex; }
    .ev-form-col { flex: 1; padding: 24px 28px; max-width: 820px; }

    /* ── Sección ── */
    .ev-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .ev-section-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 9px 18px;
      display: flex; align-items: center; gap: 8px;
    }
    .ev-section-icon { font-size: 16px; width: 16px; height: 16px; color: #3730a3; }
    .ev-section-header--submit { background: #f0f4ff; border-bottom-color: #c7d2fe; }
    .ev-section-label {
      font-size: 0.68rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.9px; color: #475569;
    }
    .ev-section-header--submit .ev-section-label { color: #3730a3; }

    .ev-fields { padding: 18px; display: flex; flex-direction: column; gap: 16px; }

    /* ── Campo ── */
    .ev-field-group { display: flex; flex-direction: column; gap: 6px; }
    .ev-field-label {
      font-size: 0.72rem; font-weight: 700; color: #374151;
      text-transform: uppercase; letter-spacing: 0.4px;
      display: flex; align-items: center; gap: 8px;
    }
    .ev-tag-req {
      font-size: 0.58rem; font-weight: 700; background: #fef3c7;
      color: #92400e; padding: 1px 6px; border-radius: 4px;
    }
    .ev-required-star { color: #dc2626; margin-left: 2px; font-weight: 900; }
    .ev-input { width: 100%; }
    .ev-field-conditional { animation: fadeSlide 0.2s ease; }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Botones de resultado ── */
    .ev-result-row { display: flex; gap: 8px; }
    .rv-btn {
      flex: 1; height: 40px;
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      background: white;
      font-weight: 700; font-size: 0.72rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 5px;
      color: #64748b;
      transition: all 0.18s ease;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }
    }
    .rv-approve.active {
      background: #10b981; border-color: #10b981; color: white;
      box-shadow: 0 2px 8px rgba(16,185,129,.3);
    }
    .rv-observe.active {
      background: #f59e0b; border-color: #f59e0b; color: white;
      box-shadow: 0 2px 8px rgba(245,158,11,.3);
    }
    .rv-reject.active {
      background: #ef4444; border-color: #ef4444; color: white;
      box-shadow: 0 2px 8px rgba(239,68,68,.3);
    }

    /* ── Upload PDF ── */
    .ev-upload-box {
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      display: flex; flex-direction: column; gap: 10px;
      transition: all 0.2s ease;
    }
    .ev-upload-done { border-color: #86efac; background: #f0fdf4; }
    .ev-upload-row { display: flex; align-items: center; gap: 12px; }
    .ev-upload-icon {
      font-size: 1.8rem; width: 1.8rem; height: 1.8rem; color: #003366;
      transition: color 0.2s;
    }
    .ev-upload-done .ev-upload-icon { color: #16a34a; }
    .ev-upload-texts { display: flex; flex-direction: column; gap: 2px; }
    .ev-upload-title { font-size: 0.82rem; font-weight: 700; color: #0f172a; margin: 0; }
    .ev-upload-sub { font-size: 0.72rem; color: #64748b; margin: 0; }
    .ev-upload-ok { color: #166534; font-weight: 600; }

    /* ── Alertas ── */
    .ev-alert {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 11px 14px; border-radius: 10px;
      font-size: 0.78rem; font-weight: 600;
      mat-icon { font-size: 17px; width: 17px; height: 17px; flex-shrink: 0; margin-top: 1px; }
    }
    .ev-alert--warn {
      background: #fffbeb; border: 1px solid #fde68a; color: #78350f;
      mat-icon { color: #d97706; }
    }
    .ev-alert--error {
      background: #fff1f2; border: 1px solid #fecaca; color: #991b1b;
      mat-icon { color: #dc2626; }
    }

    /* ── Fila de acciones ── */
    .ev-action-row {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 10px; padding-top: 6px;
    }
    .ev-submit-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: #003366; color: white;
      border: none; border-radius: 10px; padding: 0 24px; height: 44px;
      font-weight: 800; font-size: 0.82rem; cursor: pointer;
      transition: all 0.2s ease;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      &:hover:not(:disabled) {
        background: #004080; transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,51,102,.25);
      }
      &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    }

    /* ── Suspensión ── */
    .ev-suspended {
      flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem;
    }
    .ev-suspended-card {
      text-align: center; max-width: 460px;
      background: white; border: 1px solid #ffedd5;
      border-radius: 18px; padding: 2.5rem 2rem;
    }
    .ev-suspended-icon { font-size: 52px; width: 52px; height: 52px; color: #ea580c; }
    .ev-suspended-card h2 { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0.8rem 0 0.4rem; }
    .ev-suspended-card p  { font-size: 0.82rem; color: #64748b; margin: 0; }

    /* ── Sidebar ── */
    .ev-sidebar {
      width: 320px; background: white; border-left: 1px solid #e2e8f0;
      height: calc(100vh - 58px); position: sticky; top: 58px;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .ev-sidebar-header {
      padding: 14px 18px; border-bottom: 1px solid #f1f5f9;
      display: flex; align-items: center; gap: 10px;
      mat-icon { color: #003366; font-size: 1.1rem; }
      h3 { margin: 0; font-size: 0.82rem; font-weight: 800; color: #0f172a; }
      p  { margin: 0; font-size: 0.68rem; color: #94a3b8; }
    }
    .ev-doc-list { flex: 1; overflow-y: auto; padding: 10px; }
    .ev-doc-item {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 11px; border-radius: 10px; margin-bottom: 5px;
      border: 1px solid #f1f5f9; cursor: default;
      transition: background 0.12s;
      &:hover { background: #f8fafc; }
    }
    .ev-doc-pdf  { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; color: #ef4444; flex-shrink: 0; }
    .ev-doc-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .ev-doc-name { font-size: 0.75rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ev-doc-type { font-size: 0.63rem; color: #94a3b8; font-weight: 600; }
    .ev-doc-empty { font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 2rem 0; }

    /* ── Checklist de ítems (Fase 1) ── */
    .ev-items-checklist {
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
      background: #f8fafc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .ev-item-row-wrapper {
      border-bottom: 1px solid #e2e8f0;
      &:last-child {
        border-bottom: none;
      }
    }
    .ev-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 16px;
      gap: 16px;
      background: white;
      &.header {
        background: #f1f5f9;
        font-weight: 800;
        font-size: 0.65rem;
        text-transform: uppercase;
        color: #475569;
        border-bottom: 2px solid #e2e8f0;
        letter-spacing: 0.6px;
        padding-top: 10px;
        padding-bottom: 10px;
      }
    }
    .ev-item-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .ev-item-code {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 5px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .ev-item-label {
      font-size: 0.76rem;
      color: #334155;
      line-height: 1.45;
      font-weight: 500;
    }
    .ev-item-actions {
      flex-shrink: 0;
    }
    .item-status-selector {
      display: flex;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      height: 30px;
      background: white;
    }
    .st-btn {
      border: none;
      background: transparent;
      font-size: 0.68rem;
      font-weight: 800;
      width: 34px;
      height: 100%;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #64748b;
      border-right: 1.5px solid #cbd5e1;
      &:last-child {
        border-right: none;
      }
      &:hover {
        background: #f1f5f9;
        color: #334155;
      }
      &.st-c.active {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }
      &.st-nc.active {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
      }
      &.st-na.active {
        background: #64748b;
        color: white;
        border-color: #64748b;
      }
    }
    .ev-item-obs-box {
      padding: 10px 16px 12px 48px;
      background: #fff5f5;
      border-top: 1px solid #fee2e2;
    }
    .compact-input {
      font-size: 0.75rem;
      width: 100%;
    }

    /* ── Éxito y descargas (Fase 2) ── */
    .ev-body--success {
      justify-content: center;
      padding: 4rem 2rem;
    }
    .ev-success-screen {
      width: 100%;
      max-width: 580px;
      margin: 0 auto;
    }
    .ev-success-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 3rem 2.5rem;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .ev-success-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: #10b981;
    }
    .ev-success-card h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .ev-success-desc {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 0.75rem 0;
    }
    .ev-download-actions {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 10px;
      margin-bottom: 1.5rem;
    }
    .dl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      border: none;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      &.dl-pdf {
        background: #dc2626;
        &:hover {
          background: #b91c1c;
          box-shadow: 0 4px 12px rgba(220,38,38,0.25);
        }
      }
      &.dl-docx {
        background: #2563eb;
        &:hover {
          background: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
      }
    }
    /* ── Flujo de Borrador e Info ── */
    .ev-draft-generator-box {
      border: 1px solid #c7d2fe;
      background: #f5f7ff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 15px;
    }
    .ev-draft-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #3730a3;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0 24px;
      height: 46px;
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon {
        font-size: 19px;
        width: 19px;
        height: 19px;
      }
      &:hover:not(:disabled) {
        background: #312e81;
        box-shadow: 0 4px 12px rgba(55,48,163,0.3);
        transform: translateY(-1px);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }
    .ev-draft-btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: white;
      color: #3730a3;
      border: 1.5px solid #c7d2fe;
      border-radius: 8px;
      padding: 0 14px;
      height: 32px;
      font-weight: 800;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      &:hover:not(:disabled) {
        background: #f5f7ff;
        border-color: #3730a3;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .ev-draft-downloads-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .ev-downloads-title {
      font-size: 0.76rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: 0.4px;
    }
    .ev-download-inline-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    .dl-inline-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 38px;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.74rem;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      &.dl-pdf {
        background: #dc2626;
        &:hover {
          background: #b91c1c;
          box-shadow: 0 3px 8px rgba(220,38,38,0.2);
        }
      }
      &.dl-docx {
        background: #2563eb;
        &:hover {
          background: #1d4ed8;
          box-shadow: 0 3px 8px rgba(37,99,235,0.2);
        }
      }
    }
    .ev-draft-update-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
      gap: 10px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
    }
    .ev-downloads-hint {
      font-size: 0.68rem;
      color: #64748b;
      line-height: 1.4;
      margin: 6px 0 0 0;
      font-style: italic;
    }

    .ev-back-btn {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      font-weight: 700;
    }
    
    .rv-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      &:hover {
        background: white;
        border-color: #e2e8f0;
        color: #64748b;
      }
    }
  `]
})
export class EvaluationFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private submitEvaluationUC = inject(SubmitEvaluationUseCase);
  private docRepo = inject(IDocumentRepositoryPort);
  private destroyRef = inject(DestroyRef);
  private s3StorageService = inject(S3StorageService);

  evaluationId = '';
  protocolInfo = signal<any>(null);
  currentAnexo = signal<AnexoEvaluacion | null>(null);
  isSuspended = signal<boolean>(false);
  protocolDocuments = signal<any[]>([]);

  readonly today = new Date().toISOString().split('T')[0];

  showPreview = signal(true);
  isSubmitting = signal(false);

  evaluationForm: FormGroup = this.fb.group({});
  selectedFile: File | null = null;
  observationsControl = new FormControl('');

  sections: string[] = [];
  selectedGlobalResult = signal<string>('APROBADO');
  isSubmittedSuccessfully = signal<boolean>(false);
  generatedEvaluationId = signal<number | null>(null);
  isDraftGenerated = signal<boolean>(false);
  isDraftSubmitting = signal<boolean>(false);

  ngOnInit() {
    this.evaluationId = this.route.snapshot.params['id'];
    this.loadInitialData();
  }

  loadInitialData() {
    this.evalRepo.getMyAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(assignments => {
        const task = assignments.find(a => a.id === this.evaluationId);
        if (task) {
          this.isSuspended.set(task.isSuspended ?? false);
          this.protocolRepo.getById(task.protocolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(protocol => {
              this.protocolInfo.set(protocol);
              // reviewType de la asignación es la única fuente de verdad (Tarea 6)
              const reviewType = (task as any).reviewType as string;
              let targetAnexo;
              if (reviewType === 'ENSAYO_CLINICO' || protocol.type === ProtocolType.EC) {
                targetAnexo = ANEXOS_EVALUACION[2]; // Anexo 11
              } else if (reviewType === 'EXPEDITA') {
                targetAnexo = ANEXOS_EVALUACION[0]; // Anexo 9
              } else {
                targetAnexo = ANEXOS_EVALUACION[1]; // Anexo 10 — PLENO por defecto
              }
              this.currentAnexo.set(targetAnexo);
              if (!task.isSuspended) {
                this.initDynamicForm();

                // Cargar borrador existente si lo hay
                this.evalRepo.getChecklistDetails(this.evaluationId)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (res) => {
                      const data = res?.data || res;
                      if (data && data.items && data.items.length > 0) {
                        this.isDraftGenerated.set(true);
                        this.generatedEvaluationId.set(data.evaluacionId);
                        data.items.forEach((item: any) => {
                          const stateCtrl = this.evaluationForm.get(`estado_${item.itemCodigo}`);
                          const obsCtrl = this.evaluationForm.get(`obs_${item.itemCodigo}`);
                          if (stateCtrl) stateCtrl.setValue(item.estado);
                          if (obsCtrl) obsCtrl.setValue(item.observaciones || '');
                        });
                        
                        // Determinar los resultados de cada sección en base a si contienen NC
                        const eticaHasNC = data.items.some((item: any) => item.itemCodigo?.startsWith('ET_') && item.estado === 'NC');
                        const metHasNC = data.items.some((item: any) => item.itemCodigo?.startsWith('MET_') && item.estado === 'NC');
                        const jurHasNC = data.items.some((item: any) => item.itemCodigo?.startsWith('JUR_') && item.estado === 'NC');

                        this.setResult('resultadoEtica', eticaHasNC ? 'CON_OBSERVACIONES' : 'APROBADO');
                        this.setResult('resultadoMetodologia', metHasNC ? 'CON_OBSERVACIONES' : 'APROBADO');
                        this.setResult('resultadoJuridica', jurHasNC ? 'CON_OBSERVACIONES' : 'APROBADO');

                        // Recalcular coherencias
                        this.checkSectionResultCoherency('ET_1');
                        this.checkSectionResultCoherency('MET_1');
                        this.checkSectionResultCoherency('JUR_1');
                      }
                    },
                    error: (err) => {
                      console.log('[EvaluationFormPage] No existing draft found for assignment:', this.evaluationId);
                    }
                  });
              }
            });

          this.protocolRepo.getDocumentHistory(task.protocolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (docs) => this.protocolDocuments.set(docs || []),
              error: (err) => console.error('[EvaluationFormPage] Error cargando expediente:', err)
            });
        }
      });
  }

  initDynamicForm() {
    const anexo = this.currentAnexo();
    if (!anexo) return;
    this.sections = [...new Set(anexo.campos.map(c => c.seccion))];
    
    // Si es Anexo 9, agregar controles dinámicos para los 27 criterios
    if (anexo.id === 'anexo9') {
      Object.entries(ANNEX9_ITEMS).forEach(([seccion, items]) => {
        items.forEach(item => {
          this.evaluationForm.addControl(`estado_${item.code}`, new FormControl('C', [Validators.required]));
          this.evaluationForm.addControl(`obs_${item.code}`, new FormControl(''));
        });
      });
    }

    anexo.campos.forEach(campo => {
      const validators = campo.obligatorio ? [Validators.required] : [];
      this.evaluationForm.addControl(campo.id, new FormControl('', validators));
    });

    if (anexo.id === 'anexo11') {
      this.evaluationForm.get('fechaEvaluacion')?.setValue(this.today);
    }

    // Inicializar el valor del dictamen global reactivo
    this.autoAdjustGlobalResult();
  }

  getItemsPorSeccion(sectionKey: string): readonly any[] {
    if (this.currentAnexo()?.id !== 'anexo9') return [];
    const mapping: Record<string, string> = {
      'ETICA': 'etica',
      'TECNICA': 'metodologia',
      'JURIDICA': 'juridica'
    };
    const key = mapping[sectionKey];
    return key ? (ANNEX9_ITEMS as any)[key] : [];
  }

  setItemStatus(code: string, status: string) {
    const statusCtrl = this.getControl(`estado_${code}`);
    statusCtrl.setValue(status);

    const obsCtrl = this.getControl(`obs_${code}`);
    if (status === 'NC') {
      obsCtrl.setValidators([Validators.required]);
    } else {
      obsCtrl.clearValidators();
      obsCtrl.setValue('');
    }
    obsCtrl.updateValueAndValidity();

    this.checkSectionResultCoherency(code);
  }

  checkSectionResultCoherency(itemCode: string) {
    let sectionKey = '';
    let itemsList: { code: string }[] = [];
    let resultCtrlName = '';

    if (itemCode.startsWith('ET_')) {
      sectionKey = 'etica';
      itemsList = ANNEX9_ITEMS.etica;
      resultCtrlName = 'resultadoEtica';
    } else if (itemCode.startsWith('MET_')) {
      sectionKey = 'metodologia';
      itemsList = ANNEX9_ITEMS.metodologia;
      resultCtrlName = 'resultadoMetodologia';
    } else if (itemCode.startsWith('JUR_')) {
      sectionKey = 'juridica';
      itemsList = ANNEX9_ITEMS.juridica;
      resultCtrlName = 'resultadoJuridica';
    }

    if (!sectionKey) return;

    const hasNC = itemsList.some(item => this.getControl(`estado_${item.code}`)?.value === 'NC');
    const resultCtrl = this.getControl(resultCtrlName);

    if (hasNC) {
      if (resultCtrl.value === 'APROBADO' || !resultCtrl.value) {
        this.setResult(resultCtrlName, 'CON_OBSERVACIONES');
        this.snackBar.open(`⚠️ El resultado de la sección se cambió a "Con Observaciones" por contener ítems en estado NC.`, 'Entendido', { duration: 4000 });
      }
    }
    this.autoAdjustGlobalResult();
  }

  seccionTieneNC(sec: string): boolean {
    if (this.currentAnexo()?.id !== 'anexo9') return false;
    const items = this.getItemsPorSeccion(sec);
    return items.some(item => this.getControl(`estado_${item.code}`)?.value === 'NC');
  }

  autoAdjustGlobalResult() {
    if (this.currentAnexo()?.id !== 'anexo9') return;
    const values = this.evaluationForm.getRawValue();
    const hasNoAprobado = values.resultadoEtica === 'NO_APROBADO'
      || values.resultadoMetodologia === 'NO_APROBADO'
      || values.resultadoJuridica === 'NO_APROBADO';
    const hasConObs = values.resultadoEtica === 'CON_OBSERVACIONES'
      || values.resultadoMetodologia === 'CON_OBSERVACIONES'
      || values.resultadoJuridica === 'CON_OBSERVACIONES';

    if (hasNoAprobado) {
      this.selectedGlobalResult.set('RECHAZADO');
    } else if (hasConObs) {
      this.selectedGlobalResult.set('PENDIENTE_SUBSANACION');
    } else {
      this.selectedGlobalResult.set('APROBADO');
    }
  }

  setGlobalResult(value: string) {
    this.selectedGlobalResult.set(value);
  }

  hasNoAprobadoAspect(): boolean {
    if (this.currentAnexo()?.id !== 'anexo9') return false;
    const values = this.evaluationForm.getRawValue();
    return values.resultadoEtica === 'NO_APROBADO'
      || values.resultadoMetodologia === 'NO_APROBADO'
      || values.resultadoJuridica === 'NO_APROBADO';
  }

  hasObsAspect(): boolean {
    if (this.currentAnexo()?.id !== 'anexo9') return false;
    const values = this.evaluationForm.getRawValue();
    return values.resultadoEtica === 'CON_OBSERVACIONES'
      || values.resultadoMetodologia === 'CON_OBSERVACIONES'
      || values.resultadoJuridica === 'CON_OBSERVACIONES';
  }

  downloadPdf() {
    const id = this.generatedEvaluationId() || this.evaluationId;
    if (!id) return;
    this.evalRepo.getDocumentDownloadUrl(String(id)).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        } else {
          this.snackBar.open('No se pudo descargar el PDF oficial.', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Download PDF error:', err);
        this.snackBar.open('No se pudo descargar el PDF oficial.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  downloadDocx() {
    const id = this.generatedEvaluationId() || this.evaluationId;
    if (!id) return;
    this.evalRepo.getDocxDownloadUrl(String(id)).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        } else {
          this.snackBar.open('No se pudo descargar el Word DOCX.', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Download DOCX error:', err);
        this.snackBar.open('No se pudo descargar el Word DOCX.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  sectionLabel(sec: string): string {
    const labels: Record<string, string> = {
      'ETICA': 'Ética', 'TECNICA': 'Metodología',
      'JURIDICA': 'Jurídica', 'GENERAL': 'Evaluación'
    };
    return labels[sec] || sec;
  }

  getCamposPorSeccion(seccion: string) {
    return this.currentAnexo()?.campos.filter(c => c.seccion === seccion) || [];
  }

  getControl(id: string) { return this.evaluationForm.get(id) as FormControl; }

  setResult(id: string, value: string) {
    this.getControl(id).setValue(value);
    if (value === 'APROBADO') {
      const plazoId = id.replace('resultado', 'plazo');
      if (this.evaluationForm.contains(plazoId)) this.getControl(plazoId).setValue('');
    }
    this.autoAdjustGlobalResult();
  }

  isConditional(val: string): boolean {
    return val === 'CON_OBSERVACIONES' || val === 'APROBADO_CONDICIONADO';
  }

  shouldShowTextField(id: string): boolean {
    if (id === 'condiciones') return this.isConditional(this.getControl('resultadoGlobal').value);
    if (id === 'fechaEvaluacion') return true;
    if (id.endsWith('Observaciones')) {
      const component = id.replace('Observaciones', '');
      const resultId = `resultado${component.charAt(0).toUpperCase()}${component.slice(1)}`;
      return this.getControl(resultId).value === 'CON_OBSERVACIONES';
    }
    if (id.startsWith('plazo')) {
      return this.getControl(id.replace('plazo', 'resultado')).value === 'CON_OBSERVACIONES';
    }
    return false;
  }

  isReportRequired(): boolean {
    const values = this.evaluationForm.getRawValue();
    return Object.keys(values).some(key =>
      key.startsWith('resultado') && values[key] !== 'APROBADO' && values[key] !== ''
    );
  }

  canSubmitDraft(): boolean {
    if (this.evaluationForm.invalid) return false;

    const isAnexo9  = this.currentAnexo()?.id === 'anexo9';
    const isAnexo10 = this.currentAnexo()?.id === 'anexo10';
    const values = this.evaluationForm.getRawValue();

    if (isAnexo9) {
      if (values.resultadoEtica       === 'CON_OBSERVACIONES' && !values.eticaObservaciones?.trim())      return false;
      if (values.resultadoMetodologia === 'CON_OBSERVACIONES' && !values.metodologiaObservaciones?.trim()) return false;
      if (values.resultadoJuridica    === 'CON_OBSERVACIONES' && !values.juridicaObservaciones?.trim())    return false;
      if (this.hasAnexo9GlobalInconsistency()) return false;
    }
    if (isAnexo10) {
      if (this.isConditional(values.resultadoGlobal) && !values.condiciones?.trim()) return false;
    }
    if (this.isReportRequired() && !this.observationsControl.value?.trim()) return false;

    return true;
  }

  canFinalize(): boolean {
    if (!this.canSubmitDraft()) return false;
    if (!this.selectedFile) return false;
    return true;
  }

  canSubmit(): boolean {
    return this.canFinalize();
  }

  generateDraft() {
    if (!this.canSubmitDraft()) return;
    this.isDraftSubmitting.set(true);

    const formVal = this.evaluationForm.value;
    const isAnexo9  = this.currentAnexo()?.id === 'anexo9';
    const isAnexo10 = this.currentAnexo()?.id === 'anexo10';
    const isAnexo11 = this.currentAnexo()?.id === 'anexo11';

    const globalResult = this.getGlobalResult();
    const observations = this.observationsControl.value?.trim()
      || (globalResult === 'APROBADO' ? 'Aprobado sin observaciones' : 'Evaluación con observaciones/condicionada');

    let payload: any = {
      assignmentId: Number(this.evaluationId),
      result: EvaluationMapper.toBackendResult(globalResult),
      observations,
      isDraft: true,
      reportPath: 'draft' // Path temporal mientras se pre-genera el reporte oficial
    };

    if (isAnexo9) {
      const buildSection = (secName: 'etica' | 'metodologia' | 'juridica', resKey: string, obsKey: string, plazoKey: string) => {
        return {
          resultado: formVal[resKey],
          plazo: formVal[resKey] === 'CON_OBSERVACIONES' ? (formVal[plazoKey] || '') : null,
          observaciones: formVal[resKey] === 'CON_OBSERVACIONES' ? (formVal[obsKey] || '') : null,
          items: ANNEX9_ITEMS[secName].map(item => ({
            itemCodigo: item.code,
            estado: formVal[`estado_${item.code}`],
            observaciones: formVal[`estado_${item.code}`] === 'NC' ? (formVal[`obs_${item.code}`] || null) : null
          }))
        };
      };

      payload.annex9 = {
        etica: buildSection('etica', 'resultadoEtica', 'eticaObservaciones', 'plazoEtica'),
        metodologia: buildSection('metodologia', 'resultadoMetodologia', 'metodologiaObservaciones', 'plazoMetodologia'),
        juridica: buildSection('juridica', 'resultadoJuridica', 'juridicaObservaciones', 'plazoJuridica')
      };
    } else if (isAnexo10) {
      const annexResultado = this.isConditional(formVal.resultadoGlobal) ? 'APROBADO_CONDICIONADO'
        : formVal.resultadoGlobal === 'NO_APROBADO' ? 'NO_APROBADO' : 'APROBADO';
      payload.annex10 = {
        resultado: annexResultado,
        condicionesDescripcion: formVal.condiciones || 'Sin condiciones'
      };
    } else if (isAnexo11) {
      const annexResultado = this.isConditional(formVal.resultadoGlobal) ? 'APROBADO_CONDICIONADO'
        : formVal.resultadoGlobal === 'NO_APROBADO' ? 'NO_APROBADO' : 'APROBADO';
      payload.annex11 = {
        resultado: annexResultado,
        fechaEvaluacion: formVal.fechaEvaluacion || this.today
      };
    }

    this.submitEvaluationUC.execute(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isDraftSubmitting.set(false);
          this.isDraftGenerated.set(true);
          const data = res?.data || res;
          if (data && data.id) {
            this.generatedEvaluationId.set(data.id);
          } else if (data && data.evaluationId) {
            this.generatedEvaluationId.set(data.evaluationId);
          }
          this.snackBar.open('📄 Borrador guardado. Los reportes han sido generados en R2. Descárguelos abajo para firmar.', 'Cerrar', { duration: 6000 });
        },
        error: (err: any) => {
          this.isDraftSubmitting.set(false);
          if (err?.type === 'CONCURRENCY_ERROR') {
            this.snackBar.open(`❌ ${err.message}`, 'Recargar Página', { duration: 12000 })
              .onAction().subscribe(() => window.location.reload());
            return;
          }
          const backendMsg =
            err.error?.message
            || (Array.isArray(err.error?.errors) ? err.error.errors.join(' | ') : null)
            || (Array.isArray(err.error?.message) ? err.error.message.join(' | ') : null)
            || err.message
            || 'No se pudo generar el borrador. Verifique los datos e intente de nuevo.';
          this.snackBar.open(`❌ ${backendMsg}`, 'Cerrar', { duration: 8000 });
        }
      });
  }

  /** Tarea 1 & 2: Detecta inconsistencia de resultado global en Anexo 9 */
  hasAnexo9GlobalInconsistency(): boolean {
    if (this.currentAnexo()?.id !== 'anexo9') return false;
    const globalResult = this.selectedGlobalResult();
    const hasNoAprobado = this.hasNoAprobadoAspect();
    const hasConObservaciones = this.hasObsAspect();
    return (hasNoAprobado || hasConObservaciones) && globalResult === 'APROBADO';
  }

  onFileUpload(files: File[]) {
    if (files.length > 0) this.selectedFile = files[0];
  }

  onSubmit() {
    if (!this.canSubmit()) return;
    this.isSubmitting.set(true);

    const formVal = this.evaluationForm.value;
    const isAnexo9  = this.currentAnexo()?.id === 'anexo9';
    const isAnexo10 = this.currentAnexo()?.id === 'anexo10';
    const isAnexo11 = this.currentAnexo()?.id === 'anexo11';

    const globalResult = this.getGlobalResult();
    const observations = this.observationsControl.value?.trim()
      || (globalResult === 'APROBADO' ? 'Aprobado sin observaciones' : 'Evaluación con observaciones/condicionada');

    let payload: any = {
      assignmentId: Number(this.evaluationId),
      result: EvaluationMapper.toBackendResult(globalResult),
      observations,
      isDraft: false
    };

    if (isAnexo9) {
      const buildSection = (secName: 'etica' | 'metodologia' | 'juridica', resKey: string, obsKey: string, plazoKey: string) => {
        return {
          resultado: formVal[resKey],
          plazo: formVal[resKey] === 'CON_OBSERVACIONES' ? (formVal[plazoKey] || '') : null,
          observaciones: formVal[resKey] === 'CON_OBSERVACIONES' ? (formVal[obsKey] || '') : null,
          items: ANNEX9_ITEMS[secName].map(item => ({
            itemCodigo: item.code,
            estado: formVal[`estado_${item.code}`],
            observaciones: formVal[`estado_${item.code}`] === 'NC' ? (formVal[`obs_${item.code}`] || null) : null
          }))
        };
      };

      payload.annex9 = {
        etica: buildSection('etica', 'resultadoEtica', 'eticaObservaciones', 'plazoEtica'),
        metodologia: buildSection('metodologia', 'resultadoMetodologia', 'metodologiaObservaciones', 'plazoMetodologia'),
        juridica: buildSection('juridica', 'resultadoJuridica', 'juridicaObservaciones', 'plazoJuridica')
      };
    } else if (isAnexo10) {
      const annexResultado = this.isConditional(formVal.resultadoGlobal) ? 'APROBADO_CONDICIONADO'
        : formVal.resultadoGlobal === 'NO_APROBADO' ? 'NO_APROBADO' : 'APROBADO';
      payload.annex10 = {
        resultado: annexResultado,
        condicionesDescripcion: formVal.condiciones || 'Sin condiciones'
      };
    } else if (isAnexo11) {
      const annexResultado = this.isConditional(formVal.resultadoGlobal) ? 'APROBADO_CONDICIONADO'
        : formVal.resultadoGlobal === 'NO_APROBADO' ? 'NO_APROBADO' : 'APROBADO';
      payload.annex11 = {
        resultado: annexResultado,
        fechaEvaluacion: formVal.fechaEvaluacion || this.today
      };
    }

    const sanitizedName = this.selectedFile ? sanitizeFilename(this.selectedFile.name) : '';
    const protocolId = this.protocolInfo()?.id;
    const key = `protocols/${protocolId}/docEvaluacion/${sanitizedName}`;

    const upload$: Observable<string | null> = this.selectedFile
      ? this.s3StorageService.getUploadUrl(key, this.selectedFile.type || 'application/pdf').pipe(
          switchMap(urlRes =>
            this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, this.selectedFile!).pipe(
              filter(r => r.success),
              map(() => urlRes.key)
            )
          )
        )
      : of(null);

    upload$.pipe(
      switchMap(path => {
        if (path) payload.reportPath = path;
        return this.submitEvaluationUC.execute(payload);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        this.snackBar.open('✅ Evaluación enviada con éxito.', 'Cerrar', { duration: 5000 });
        this.isSubmittedSuccessfully.set(true);
        const data = res?.data || res;
        if (data && data.id) {
          this.generatedEvaluationId.set(data.id);
        } else if (data && data.evaluationId) {
          this.generatedEvaluationId.set(data.evaluationId);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        if (err?.type === 'CONCURRENCY_ERROR') {
          this.snackBar.open(`❌ ${err.message}`, 'Recargar Página', { duration: 12000 })
            .onAction().subscribe(() => window.location.reload());
          return;
        }
        // Tarea 3: Extraer mensaje descriptivo del backend
        const backendMsg =
          err.error?.message
          || (Array.isArray(err.error?.errors) ? err.error.errors.join(' | ') : null)
          || (Array.isArray(err.error?.message) ? err.error.message.join(' | ') : null)
          || err.message
          || 'No se pudo enviar la evaluación. Verifique los datos e intente de nuevo.';
        this.snackBar.open(`❌ ${backendMsg}`, 'Cerrar', { duration: 8000 });
      }
    });
  }

  verDocumento(documentId: any) {
    if (!documentId) return;
    this.s3StorageService.getDocumentDownloadUrl(Number(documentId)).subscribe({
      next: (res) => window.open(res.downloadUrl, '_blank'),
      error: () => this.snackBar.open('No se pudo abrir el documento.', 'Cerrar', { duration: 3000 })
    });
  }

  private getGlobalResult(): string {
    if (this.currentAnexo()?.id === 'anexo9') {
      return this.selectedGlobalResult();
    }
    const values = this.evaluationForm.getRawValue();
    let rawResult = 'APROBADO';
    if (values.resultadoGlobal) {
      rawResult = values.resultadoGlobal;
    } else if (values.resultadoEtica === 'NO_APROBADO'
      || values.resultadoMetodologia === 'NO_APROBADO'
      || values.resultadoJuridica === 'NO_APROBADO') {
      rawResult = 'NO_APROBADO';
    } else if (this.isReportRequired()) {
      rawResult = 'CON_OBSERVACIONES';
    }
    if (rawResult === 'APROBADO') return 'APROBADO';
    if (this.isConditional(rawResult)) {
      return this.currentAnexo()?.id === 'anexo9' ? 'PENDIENTE_SUBSANACION' : 'APROBADO_CON_OBSERVACIONES';
    }
    if (rawResult === 'NO_APROBADO') return 'RECHAZADO';
    return 'APROBADO';
  }
}
