import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { resolveEstado } from '@shared/utils/estado.resolver';
import { ProtocolStatusLabelPipe } from '@shared/pipes/protocol-status-label.pipe';
import { ProtocolStatusClassPipe } from '@shared/pipes/protocol-status-class.pipe';
import { ChecklistRequirement, ProtocoloResumen, RequirementStatus } from '@features/investigador/domain/dtos/crear-protocolo.dto';

@Component({
  selector: 'app-subsanacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatTabsModule,
    MatDividerModule,
    ProtocolCodePipe,
    ProtocolStatusLabelPipe,
    ProtocolStatusClassPipe
  ],
  template: `
    <div class="subsanacion-container animate-fade-in">
      
      <!-- DETALLE DE SUBSANACIÓN SI HAY PROTOCOLO SELECCIONADO -->
      <ng-container *ngIf="protocolId() > 0; else listTemplate">
        <header class="page-header mb-4">
          <div class="d-flex align-items-center gap-3">
            <button mat-icon-button (click)="goBackToList()" class="back-btn" aria-label="Volver a la bandeja">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="title-section">
              <div class="breadcrumb">Evaluación / Bandeja de Subsanaciones</div>
              <h1 class="page-title">Subsanación de Observaciones</h1>
              <p class="page-subtitle">{{ protocolTitle() }}</p>
            </div>
          </div>
          <span class="protocol-badge" *ngIf="protocolCode()">{{ protocolCode() | protocolCode }}</span>
        </header>

        <!-- Banner Informativo Ámbar (Screen 2) -->
        <div class="alert-banner mb-4 animate-slide-up">
          <div class="banner-icon-container">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="banner-body d-flex flex-column gap-2 w-100">
            <div>
              <h4 class="m-0 fw-bold" *ngIf="isEnControlDocumental(); else legacyBannerTitle">
                Versión {{ protocolVersion() }}.0 en Control Documental
              </h4>
              <ng-template #legacyBannerTitle>
                <h4 class="m-0 fw-bold">Modificaciones en Versión 2.0 Requeridas</h4>
              </ng-template>
              <p class="m-0 mt-1 small" *ngIf="isEnControlDocumental(); else legacyBannerText">
                El protocolo se encuentra en fase de carga de nueva versión (Control Documental). Por favor, cargue los archivos corregidos para los requisitos observados o rechazados. El trámite no podrá ser reenviado hasta completar las correcciones.
              </p>
              <ng-template #legacyBannerText>
                <p class="m-0 mt-1 small">
                  El comité ético ha emitido observaciones a su postulación. Por favor, revise detalladamente los informes de los evaluadores en el panel izquierdo y cargue los archivos corregidos en el listado de requisitos de la derecha. El trámite no podrá ser reenviado hasta completar las correcciones.
                </p>
              </ng-template>
            </div>
            <div class="banner-actions">
              <button mat-stroked-button class="btn-download-pdf d-inline-flex align-items-center gap-1" (click)="downloadConsolidatedPdf()">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px;">download</mat-icon>
                <span>Descargar Anexo 12 Consolidado</span>
              </button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- PANEL IZQUIERDO: Observaciones del Comité (Anónimas) -->
          <div class="col-lg-5">
            <div class="content-card shadow-soft p-4">
              <h3 class="fw-bold mb-4 d-flex align-items-center gap-2 text-primary">
                <mat-icon>speaker_notes</mat-icon>
                Observaciones de los Evaluadores
              </h3>

              <div class="empty-state p-4 text-center rounded border" *ngIf="observations().length === 0">
                <mat-icon style="font-size: 32px; width:32px; height:32px; color: #94a3b8;">chat_bubble_outline</mat-icon>
                <p class="small text-muted m-0 mt-2">No se encontraron observaciones detalladas registradas.</p>
              </div>

              <!-- Acordeón de Evaluaciones Anónimas -->
              <mat-accordion class="anonymous-accordion" multi>
                <mat-expansion-panel *ngFor="let obs of observations(); let i = index" class="obs-panel mb-3 shadow-none border">
                  <mat-expansion-panel-header>
                    <mat-panel-title class="fw-bold">
                      Evaluador {{ getProfileLabel(obs.evaluatorProfile) }}
                    </mat-panel-title>
                    <mat-panel-description>
                      <span class="badge-result" [ngClass]="obs.result.toLowerCase()">
                        {{ obs.result.replace('_', ' ') }}
                      </span>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="panel-content pt-3">
                    <h5 class="fw-bold small text-muted text-uppercase mb-2">Observaciones Generales</h5>
                    <p class="obs-text p-3 bg-light rounded text-dark small mb-3">
                      {{ obs.generalObservations || 'Sin observaciones generales redactadas.' }}
                    </p>

                    <!-- Lista de Requisitos Evaluados como "No Cumple" -->
                    <div class="checklist-nc" *ngIf="obs.checklistDetails && obs.checklistDetails.length > 0">
                      <h5 class="fw-bold small text-danger text-uppercase mb-2">Requisitos Observados (No Cumple)</h5>
                      <div class="nc-item p-3 border-start border-danger border-3 bg-red-soft rounded mb-2" *ngFor="let item of obs.checklistDetails">
                        <div class="d-flex justify-content-between align-items-start">
                          <strong class="small text-dark">{{ item.itemCode }}: {{ item.description }}</strong>
                        </div>
                        <p class="m-0 mt-1 small text-muted"><strong>Observación:</strong> {{ item.observations || 'Se requiere corregir este documento.' }}</p>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </div>

          <!-- PANEL DERECHO: Carga de Correcciones (Requisitos) -->
          <div class="col-lg-7">
            <div class="content-card shadow-soft p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="fw-bold m-0 d-flex align-items-center gap-2 text-primary">
                  <mat-icon style="color: #003366;">upload_file</mat-icon>
                  Checklist de Documentación
                </h3>
                <span class="badge-pending" *ngIf="pendingRequirementsCount() > 0">
                  {{ pendingRequirementsCount() }} Pendientes
                </span>
                <span class="badge-success-count" *ngIf="pendingRequirementsCount() === 0">
                  Completo
                </span>
              </div>

              <!-- Barra de Progreso de Subsanación -->
              <div class="progress-section mb-4">
                <div class="d-flex justify-content-between small text-muted mb-1 fw-bold">
                  <span>Progreso de Carga</span>
                  <span>{{ checklist().length - pendingRequirementsCount() }} / {{ checklist().length }}</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="getProgressValue()" color="primary" class="rounded-pill"></mat-progress-bar>
              </div>

              <div class="table-responsive">
                <table class="checklist-table w-100">
                  <thead>
                    <tr>
                      <th>Requisito / Documento</th>
                      <th class="text-center">Estado</th>
                      <th class="text-end" *ngIf="isInvestigador()">Carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of checklist()">
                      <td class="req-detail">
                        <strong class="text-dark">{{ req.requirementName }}</strong>
                        <span class="d-block small text-muted" *ngIf="req.requirementCode">{{ req.requirementCode }}</span>
                        <div class="req-observation small text-danger p-2 bg-red-soft rounded border-start border-danger border-3 mt-2" *ngIf="req.observations">
                          <strong>Motivo:</strong> {{ req.observations }}
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="badge-status" [ngClass]="req.status.toLowerCase()">
                          {{ req.status === 'NO_PRESENTADO' ? 'NO PRESENTADO' : req.status }}
                        </span>
                      </td>
                      <td class="text-end" *ngIf="isInvestigador()">
                        <ng-container *ngIf="['APROBADO', 'VALIDADO'].includes(req.status); else uploadAction">
                          <mat-icon class="text-success" matTooltip="Documento Aprobado y Validado">check_circle</mat-icon>
                        </ng-container>
                        
                        <ng-template #uploadAction>
                          <div class="upload-btn-container d-flex align-items-center justify-content-end gap-2">
                            <span class="spinner-border spinner-border-sm text-primary" role="status" *ngIf="uploadingRequirementId() === req.id"></span>
                            <button mat-stroked-button color="primary" class="btn-upload btn-sm" [disabled]="uploadingRequirementId() > 0" (click)="fileInput.click()">
                              <mat-icon>cloud_upload</mat-icon>
                              Subir
                            </button>
                            <input #fileInput type="file" (change)="onUploadFile($event, req.id, req.requirementCode)" accept="application/pdf" style="display: none;" />
                          </div>
                        </ng-template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <mat-divider class="my-4"></mat-divider>

              <!-- Botón de Enviar Subsanación -->
              <div class="actions-footer d-flex justify-content-end align-items-center gap-3" *ngIf="isInvestigador()">
                <p class="small text-muted m-0" *ngIf="!isReadyToSubmit()">
                  * Debe cargar todos los documentos marcados como Pendientes/Observados para poder enviar.
                </p>
                <p class="small text-success m-0 fw-bold" *ngIf="isReadyToSubmit()">
                  ✓ ¡Listo para enviar! Todos los requisitos están cubiertos.
                </p>
                
                <button mat-flat-button class="emit-btn" 
                        [disabled]="!isReadyToSubmit() || isSubmitting()"
                        (click)="onSubmitSubsanacion()">
                  <mat-icon>send</mat-icon>
                  {{ isSubmitting() ? 'Enviando...' : 'Enviar Subsanación' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- BANDEJA DE PROTOCOLO PARA SUBSANAR (SI NO HAY PROTOCOLO SELECCIONADO) -->
      <ng-template #listTemplate>
        <header class="page-header mb-4">
          <div class="title-section">
            <div class="breadcrumb">Evaluación / Bandeja de Subsanaciones</div>
            <h1 class="page-title">Bandeja de Subsanaciones</h1>
            <p class="page-subtitle">Seleccione un protocolo en proceso de corrección de observaciones.</p>
          </div>
        </header>

        <div class="content-card shadow-soft p-4">
          <div class="table-responsive">
            <table class="comparison-matrix w-100">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título del Protocolo</th>
                  <th>Fecha de Sometimiento</th>
                  <th class="text-center">Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of protocols()">
                  <td class="fw-bold text-dark">{{ p.codigoCeish || ('PRT-' + p.id) | protocolCode }}</td>
                  <td>
                    <strong class="text-dark">{{ p.titulo }}</strong>
                    <span class="d-block small text-muted" *ngIf="p.tipoEstudio">{{ p.tipoEstudio }}</span>
                  </td>
                  <td class="text-muted">{{ p.fechaCreacion ? (p.fechaCreacion | date:'dd/MM/yyyy') : 'N/A' }}</td>
                  <td class="text-center">
                    <span class="badge-status" [ngClass]="p.estado | protocolStatusClass">
                      {{ p.estado | protocolStatusLabel }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button mat-flat-button color="primary" class="btn-sm" style="font-weight: 700; border-radius: 8px;" (click)="selectProtocol(p.id)">
                      Ver Observaciones
                    </button>
                  </td>
                </tr>
                <tr *ngIf="protocols().length === 0">
                  <td colspan="5" class="text-center p-5 text-muted">
                    <mat-icon style="font-size: 48px; width:48px; height:48px; color: #94a3b8;">inbox</mat-icon>
                    <p class="m-0 mt-2 fw-bold">No tienes protocolos en bandeja de correcciones.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .subsanacion-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .breadcrumb { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .protocol-badge { background: #003366; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; }
    .page-title { font-size: 2rem; font-weight: 900; color: #1e293b; margin: 0.25rem 0; }
    .page-subtitle { font-size: 1rem; color: #64748b; margin: 0; font-style: italic; }

    .content-card { background: white; border-radius: 24px; border: 1px solid #e2e8f0; }

    .alert-banner {
      display: flex; gap: 16px; padding: 1.5rem; border-radius: 16px; align-items: center;
      background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; border-left: 6px solid #d97706;
      .banner-icon-container mat-icon { font-size: 40px; width: 40px; height: 40px; color: #d97706; }
    }

    .obs-panel {
      border-radius: 12px !important;
      overflow: hidden;
    }

    .badge-result {
      padding: 3px 10px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      &.aprobado { background: #dcfce7; color: #166534; }
      &.no_aprobado { background: #fee2e2; color: #991b1b; }
      &.con_observaciones, &.aprobado_condicionado, &.requiere_cambios_menores, &.requiere_cambios_mayores { background: #fef3c7; color: #92400e; }
    }

    .obs-text {
      line-height: 1.4;
      font-style: italic;
    }

    .bg-red-soft { background: #fff5f5; }

    .badge-pending { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
    .badge-success-count { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }

    .checklist-table {
      border-collapse: collapse;
      th { padding: 12px; font-size: 0.75rem; font-weight: 800; color: #64748b; border-bottom: 2px solid #f1f5f9; text-transform: uppercase; }
      td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .badge-status {
      padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: inline-block;
      &.approved { background: #dcfce7; color: #166534; }
      &.rejected { background: #fee2e2; color: #991b1b; }
      &.pending { background: #fef3c7; color: #92400e; }
      &.review { background: #e0f2fe; color: #0369a1; }
      
      /* Mantener compatibilidad con los estados de los requisitos individuales de la checklist */
      &.aprobado, &.validado { background: #dcfce7; color: #166534; }
      &.no_presentado, &.rechazado { background: #fee2e2; color: #991b1b; }
      &.observado, &.pendiente { background: #fef3c7; color: #92400e; }
      &.presentado { background: #e0f2fe; color: #0369a1; }
    }

    .btn-upload {
      border-radius: 8px; font-weight: 700; font-size: 0.75rem; line-height: 28px; height: 28px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    }

    .emit-btn {
      height: 52px;
      background: #10b981 !important;
      color: white !important;
      border-radius: 12px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
    }

    .comparison-matrix {
      border-collapse: collapse;
      th { padding: 12px; font-size: 0.75rem; font-weight: 800; color: #64748b; border-bottom: 2px solid #f1f5f9; text-transform: uppercase; }
      td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .btn-download-pdf {
      margin-top: 8px;
      border-radius: 8px;
      font-weight: 700;
      background: white !important;
      color: #92400e !important;
      border: 1px solid #d97706 !important;
      padding: 0 16px;
      height: 36px;
      line-height: 36px;
      transition: all 0.2s ease;
      &:hover {
        background: #fef3c7 !important;
        transform: translateY(-1px);
      }
    }
  `]
})
export class SubsanacionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  
  private authFacade = inject(AuthFacade);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private protocoloService = inject(ProtocoloService);
  private s3StorageService = inject(S3StorageService);

  isInvestigador = signal(true);
  protocolId = signal<number>(0);
  protocolCode = signal<string>('');
  protocolTitle = signal<string>('');
  protocolStatus = signal<string>('');
  protocolVersion = signal<number>(1);
  
  protocols = signal<ProtocoloResumen[]>([]);
  observations = signal<any[]>([]);
  checklist = signal<ChecklistRequirement[]>([]);
  
  isSubmitting = signal(false);
  uploadingRequirementId = signal<number>(0);

  // Computed reactivos (Screen 2)
  readonly pendingRequirementsCount = computed(() => 
    this.checklist().filter(item => item.status === RequirementStatus.NO_PRESENTADO || item.status === RequirementStatus.OBSERVADO).length
  );

  readonly isReadyToSubmit = computed(() => 
    this.checklist().length > 0 && this.checklist().every(item => 
      ['APROBADO', 'VALIDADO', 'PRESENTADO', 'NO_APLICA'].includes(item.status as any)
    )
  );

  readonly isEnControlDocumental = computed(() => {
    const core = resolveEstado(this.protocolStatus());
    return core && core.code === 'EN_CONTROL_DOCUMENTAL';
  });

  ngOnInit() {
    const role = this.authFacade.currentUser()?.rol;
    this.isInvestigador.set(role === 'INVESTIGADOR');

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const pId = Number(params['protocolId']);
      if (pId > 0) {
        this.protocolId.set(pId);
        this.loadProtocolDetail();
      } else {
        this.protocolId.set(0);
        this.loadSubsanacionList();
      }
    });
  }

  loadSubsanacionList() {
    if (this.isInvestigador()) {
      this.protocoloService.misProtocolosSubsanar().subscribe({
        next: (list) => {
          this.protocols.set(list || []);
        },
        error: () => this.snackBar.open('❌ Error al cargar la bandeja de protocolos.', 'Cerrar')
      });
    } else {
      this.protocolRepo.getReceptionProtocols().subscribe({
        next: (list) => {
          const filtered = (list || []).filter(p => {
            const core = resolveEstado(p.status);
            return core && core.code === 'EVALUADO' || (p.status as string) === 'EVALUACION_SUBSANACIONES';
          });
          const mapped = filtered.map(p => ({
            id: Number(p.id),
            codigoCeish: p.code || '',
            titulo: p.title,
            estado: p.status as any,
            fechaCreacion: p.submissionDate ? p.submissionDate.toISOString() : ''
          }));
          this.protocols.set(mapped);
        },
        error: () => this.snackBar.open('❌ Error al cargar la bandeja de protocolos de subsanación.', 'Cerrar')
      });
    }
  }

  loadProtocolDetail() {
    // 1. Obtener detalles básicos
    this.protocoloService.obtenerProtocolo(this.protocolId()).subscribe(p => {
      this.protocolCode.set(p.codigoCeish || '');
      this.protocolTitle.set(p.titulo || 'Protocolo de Investigación');
      this.protocolStatus.set(p.estado || '');
      const rawP = p as any;
      this.protocolVersion.set(rawP.versionNumber || rawP.version || 1);
    });

    // 2. Obtener observaciones consolidadas
    this.evalRepo.getProtocolObservations(String(this.protocolId())).subscribe({
      next: (res) => {
        const raw = res?.observations || res || [];
        this.observations.set(Array.isArray(raw) ? raw : []);
      },
      error: () => this.snackBar.open('❌ Error al obtener observaciones del comité.', 'Cerrar')
    });

    // 3. Obtener checklist de requisitos
    this.protocoloService.getChecklist(this.protocolId()).subscribe({
      next: (list) => {
        this.checklist.set(list || []);
      },
      error: () => this.snackBar.open('❌ Error al obtener checklist de documentos.', 'Cerrar')
    });
  }

  onUploadFile(event: any, requirementId: number, requirementCode?: string) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.snackBar.open('⚠️ Solo se admiten archivos PDF.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.uploadingRequirementId.set(requirementId);
    this.protocoloService.subirDocumento(file, this.protocolId(), requirementId, requirementCode).subscribe({
      next: () => {
        // Actualizar el estado en el Signal reactivo (checklist)
        this.checklist.update(items =>
          items.map(item => item.id === requirementId ? { ...item, status: 'PRESENTADO' as any } : item)
        );
        this.uploadingRequirementId.set(0);
        this.snackBar.open('✅ Archivo corregido cargado con éxito.', 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        console.error('Error uploading correction:', err);
        this.uploadingRequirementId.set(0);
        this.snackBar.open('❌ Error al subir documento de subsanación.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onSubmitSubsanacion() {
    if (this.isReadyToSubmit()) {
      this.isSubmitting.set(true);
      this.protocoloService.finalizarProtocolo(this.protocolId()).subscribe({
        next: () => {
          this.snackBar.open('✅ Subsanación enviada exitosamente a la Secretaría.', 'Cerrar', { duration: 5000 });
          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard/investigador/mis-protocolos']);
        },
        error: (err) => {
          console.error('Error submitting correction finalization:', err);
          this.snackBar.open('❌ Error al enviar la subsanación final.', 'Cerrar', { duration: 4000 });
          this.isSubmitting.set(false);
        }
      });
    }
  }

  getProgressValue(): number {
    if (this.checklist().length === 0) return 0;
    const completed = this.checklist().length - this.pendingRequirementsCount();
    return (completed / this.checklist().length) * 100;
  }

  getProfileLabel(profile: string): string {
    const map: any = {
      'METODOLOGIA': 'Metodológico',
      'BIOETICA': 'de Bioética',
      'LEGAL': 'de Aspectos Jurídicos'
    };
    return map[profile] || profile;
  }

  selectProtocol(id: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: id },
      queryParamsHandling: 'merge'
    });
  }

  goBackToList() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: null },
      queryParamsHandling: 'merge'
    });
  }

  downloadConsolidatedPdf() {
    const protocolIdVal = this.protocolId();
    if (!protocolIdVal) return;
    const s3Key = `protocols/${protocolIdVal}/resolutions/Carta_Resolucion_Consolidada.pdf`;
    
    this.s3StorageService.getEvaluationDocumentUrl(s3Key).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('⚠️ No se encontró la URL de descarga para el consolidado.', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Error fetching consolidated PDF download url:', err);
        this.snackBar.open('❌ Error al obtener el documento consolidado.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
