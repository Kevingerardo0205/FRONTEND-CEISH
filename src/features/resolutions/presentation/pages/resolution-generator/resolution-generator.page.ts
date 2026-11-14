import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadPendingResolutionsUseCase } from '../../../application/load-pending-resolutions.use-case';
import { LoadProtocolByIdUseCase } from '../../../../protocols/application/use-cases/load-protocol-by-id.use-case';
import { LoadResolutionInsumosUseCase } from '../../../application/load-resolution-insumos.use-case';
import { GenerateAndSubmitResolutionUseCase } from '../../../application/generate-and-submit-resolution.use-case';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import {
  ResolutionFormComponent,
  EmitResolutionEvent,
} from '../../components/resolution-form/resolution-form.component';
import { ConflictDialogComponent } from '@shared/components/conflict-dialog/conflict-dialog.component';

@Component({
  selector: 'app-resolution-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ResolutionFormComponent,
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- VISTA A: BANDEJA DE PROTOCOLOS EVALUADOS -->
      <ng-container *ngIf="!selectedProtocol()">
        <header class="page-header mb-4">
          <div class="title-section">
            <div class="breadcrumb-chip">CEISH / Secretaría / Resoluciones</div>
            <h1 class="page-title">Bandeja de Resoluciones</h1>
            <p class="page-subtitle">
              Protocolos con evaluaciones de pares completadas listos para dictamen final
            </p>
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
                  <td class="fw-bold text-primary">{{ p.code || 'PRT-' + p.id }}</td>
                  <td class="protocol-title-cell" [matTooltip]="p.title">{{ p.title }}</td>
                  <td>{{ p.principalInvestigator || 'No asignado' }}</td>
                  <td>{{ p.submissionDate | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="text-center">
                    <span class="badge-status-evaluado">EVALUADO</span>
                  </td>
                  <td class="text-center">
                    <button
                      mat-flat-button
                      color="primary"
                      class="emit-action-btn"
                      (click)="onSelectProtocol(p)"
                    >
                      <mat-icon>gavel</mat-icon>
                      <span>Emitir Dictamen</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="pendingProtocols().length === 0">
                  <td colspan="6" class="text-center text-muted py-5">
                    <mat-icon
                      style="font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 8px;"
                      >inbox</mat-icon
                    >
                    <p class="m-0 fw-bold">
                      No hay protocolos pendientes de resolución consolidada
                    </p>
                    <p class="small text-muted">
                      Los protocolos aparecerán aquí cuando todos sus evaluadores asignados
                      finalicen sus informes.
                    </p>
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
          <button
            mat-icon-button
            class="back-btn"
            (click)="onClearSelection()"
            matTooltip="Volver a la bandeja"
          >
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
          <span class="protocol-badge ms-3 align-self-start">{{
            selectedProtocol()?.code || 'PRT-' + selectedProtocol()?.id
          }}</span>
        </div>

        <div class="generator-layout animate-slide-up">
          <!-- Componente del Formulario Centralizado -->
          <app-resolution-form
            #resForm
            [protocol]="selectedProtocol()"
            [isSubmitting]="isSubmitting()"
            (onEmit)="onGenerate($event)"
          >
          </app-resolution-form>

          <!-- Barra Lateral Derecha: Insumos de Evaluadores -->
          <main class="form-section">
            <div
              class="content-card shadow-soft p-3 insumo-card"
              *ngIf="evaluationsList().length > 0"
            >
              <header class="insumo-header mb-2">
                <mat-icon class="insumo-icon">rate_review</mat-icon>
                <h4 class="m-0 insumo-title">Informes de Evaluadores (Insumo)</h4>
              </header>
              <p class="insumo-desc mb-3">
                Descargue los informes oficiales individuales subidos por cada uno de los
                evaluadores de la versión activa.
              </p>

              <div class="evaluators-list">
                <div class="evaluator-item" *ngFor="let ev of evaluationsList()">
                  <div class="evaluator-main">
                    <mat-icon class="evaluator-icon">account_circle</mat-icon>
                    <div class="evaluator-info">
                      <span class="evaluator-title"
                        >Par Evaluador ({{
                          getProfileLabel(getEvaluatorProfileName(ev.evaluatorProfile))
                        }})</span
                      >
                    </div>
                  </div>
                  <div class="evaluator-actions">
                    <span class="action-label">Descargar Informe:</span>
                    <button
                      type="button"
                      mat-icon-button
                      class="btn-download-pdf-sm"
                      (click)="downloadEvaluatorPdf(ev.id)"
                      matTooltip="Descargar Reporte PDF"
                    >
                      <mat-icon>picture_as_pdf</mat-icon>
                    </button>
                    <button
                      type="button"
                      mat-icon-button
                      class="btn-download-docx-sm"
                      (click)="downloadEvaluatorDocx(ev.id)"
                      matTooltip="Descargar Word DOCX"
                    >
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
  styles: [
    `
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        mat-icon {
          color: #64748b;
          font-size: 20px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      }

      .generator-layout {
        display: grid;
        grid-template-columns: 660px 450px;
        gap: 2.5rem;
        align-items: start;
        justify-content: center;
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

      .tray-table {
        border-collapse: separate;
        border-spacing: 0 8px;
        margin-top: -8px;
        th {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          padding: 12px 16px;
          letter-spacing: 0.5px;
        }
        tbody tr {
          background-color: white;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
          td {
            padding: 16px;
            border-top: 1px solid #f1f5f9;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-size: 0.9rem;
            &:first-child {
              border-left: 1px solid #f1f5f9;
              border-top-left-radius: 12px;
              border-bottom-left-radius: 12px;
            }
            &:last-child {
              border-right: 1px solid #f1f5f9;
              border-top-right-radius: 12px;
              border-bottom-right-radius: 12px;
            }
          }
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.03);
            td {
              border-color: #e2e8f0;
              background-color: #fafbfc;
            }
          }
        }
      }

      .protocol-title-cell {
        max-width: 320px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 600;
        color: #1e293b;
      }

      .badge-status-evaluado {
        background-color: #eff6ff;
        color: #1d4ed8;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 100px;
        font-size: 0.72rem;
        letter-spacing: 0.5px;
      }

      .protocol-badge {
        background: #0f172a;
        color: white;
        font-size: 0.85rem;
        font-weight: 800;
        padding: 6px 14px;
        border-radius: 8px;
        letter-spacing: 0.5px;
      }

      .insumo-card {
        border-top: 4px solid #3b82f6;
      }
      .insumo-header {
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 8px;
      }
      .insumo-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #1e293b;
      }
      .insumo-desc {
        font-size: 0.78rem;
        color: #64748b;
        line-height: 1.4;
      }

      .evaluator-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
      }
      .evaluator-main {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .evaluator-icon {
        color: #475569;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .evaluator-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #1e293b;
      }
      .evaluator-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
        margin-top: 8px;
      }
      .action-label {
        font-size: 0.72rem;
        font-weight: 600;
        color: #64748b;
      }

      .btn-download-pdf-sm {
        color: #dc2626;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
      .btn-download-docx-sm {
        color: #2563eb;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      @media (max-width: 1200px) {
        .generator-layout {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
      }
    `,
  ],
})
export class ResolutionGeneratorPage implements OnInit {
  @ViewChild('resForm') resForm!: ResolutionFormComponent;

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private loadPendingResolutions = inject(LoadPendingResolutionsUseCase);
  private loadProtocolById = inject(LoadProtocolByIdUseCase);
  private loadResolutionInsumos = inject(LoadResolutionInsumosUseCase);
  private generateResolution = inject(GenerateAndSubmitResolutionUseCase);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isSubmitting = signal(false);

  pendingProtocols = signal<ProtocolEntity[]>([]);
  selectedProtocol = signal<ProtocolEntity | null>(null);
  evaluationsList = signal<EvaluationEntity[]>([]);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['protocolId']) {
        const pIdNum = Number(params['protocolId']);
        this.loadSelectedProtocol(String(pIdNum));
      } else {
        this.selectedProtocol.set(null);
        this.loadPendingProtocols();
      }
    });
  }

  loadPendingProtocols() {
    this.loadPendingResolutions.execute().subscribe({
      next: (list) => {
        this.pendingProtocols.set(list || []);
      },
      error: () =>
        this.snackBar.open('❌ Error al cargar la bandeja de protocolos evaluados.', 'Cerrar'),
    });
  }

  loadSelectedProtocol(id: string) {
    this.loadProtocolById.execute(id).subscribe({
      next: (protocol) => {
        this.onSelectProtocol(protocol);
      },
      error: () => this.snackBar.open('❌ Error al cargar el protocolo seleccionado.', 'Cerrar'),
    });
  }

  onSelectProtocol(protocol: ProtocolEntity) {
    this.selectedProtocol.set(protocol);

    this.loadResolutionInsumos.execute(protocol.id).subscribe({
      next: (list) => {
        this.evaluationsList.set(list || []);
      },
      error: (err) => {
        console.error('Error al obtener evaluaciones del protocolo:', err);
        this.evaluationsList.set([]);
      },
    });
  }

  onClearSelection() {
    this.selectedProtocol.set(null);
    this.evaluationsList.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: null },
      queryParamsHandling: 'merge',
    });
    this.loadPendingProtocols();
  }

  getProfileLabel(profile: string): string {
    if (!profile) return 'General';
    const profileStr = String(profile).toUpperCase();
    const map: Record<string, string> = {
      METODOLOGIA: 'Metodológico',
      BIOETICA: 'de Bioética',
      LEGAL: 'de Aspectos Jurídicos',
    };
    return map[profileStr] || profile;
  }

  getEvaluatorProfileName(profile: string | { name?: string } | undefined): string {
    if (!profile) return '';
    if (typeof profile === 'string') return profile;
    return profile.name || '';
  }

  downloadEvaluatorPdf(evaluationId: string) {
    if (!evaluationId) return;
    this.loadResolutionInsumos.downloadPdf(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el PDF.', 'Cerrar', {
            duration: 3000,
          });
        }
      },
      error: () =>
        this.snackBar.open('❌ No se pudo descargar el PDF de este evaluador.', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  downloadEvaluatorDocx(evaluationId: string) {
    if (!evaluationId) return;
    this.loadResolutionInsumos.downloadDocx(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el Word DOCX.', 'Cerrar', {
            duration: 3000,
          });
        }
      },
      error: () =>
        this.snackBar.open('❌ No se pudo descargar el Word DOCX de este evaluador.', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  onGenerate(event: EmitResolutionEvent) {
    const protocol = this.selectedProtocol();
    if (protocol) {
      this.isSubmitting.set(true);
      const formValue = event.formValue;

      this.generateResolution
        .execute({
          protocolId: Number(protocol.id),
          resolutionTypeId: Number(formValue.resolutionTypeId),
          validityYears: Number(formValue.validityYears),
          followUpPeriodDays: Number(formValue.followUpPeriodDays),
          observations: formValue.observations,
          majorObservations: formValue.majorObservations,
          minorObservations: formValue.minorObservations,
          correctionProcedure: formValue.correctionProcedure,
          file: event.file ?? undefined,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', {
              duration: 5000,
            });
            this.resForm.resetForm();
            this.isSubmitting.set(false);
            this.onClearSelection();
          },
          error: (err: { type?: string; status?: number; message?: string }) => {
            console.error('Error submitting resolution:', err);
            this.isSubmitting.set(false);
            if (err?.type === 'CONCURRENCY_ERROR' || err?.status === 409) {
              this.showConflictDialog();
            } else {
              this.snackBar.open(
                `❌ Error al procesar la resolución: ${err?.message || 'Error del servidor'}`,
                'Cerrar',
                { duration: 5000 },
              );
            }
          },
        });
    }
  }

  showConflictDialog() {
    const dialogRef = this.dialog.open(ConflictDialogComponent, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Conflicto de Concurrencia',
        message:
          'El expediente de este protocolo ya ha sido modificado, aprobado o subsanado por otra sesión concurrente. Por favor, recargue el listado.',
        confirmText: 'Recargar Bandeja',
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.onClearSelection();
    });
  }
}
