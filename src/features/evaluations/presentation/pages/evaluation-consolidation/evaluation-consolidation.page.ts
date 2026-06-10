import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Component({
  selector: 'app-evaluation-consolidation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressBarModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="consolidation-container animate-fade-in">
      <header class="page-header mb-4">
        <div class="d-flex align-items-center gap-3">
          <button mat-icon-button routerLink="/dashboard/evaluations/assignment" class="back-btn" aria-label="Volver a la bandeja de asignación">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <div class="breadcrumb">Evaluación / Consolidación de Dictámenes</div>
            <h1 class="page-title">Resumen de Sesión (Anexo 12)</h1>
            <p class="page-subtitle">{{ protocol()?.title }}</p>
          </div>
        </div>
        <span class="protocol-badge">{{ protocol()?.code | protocolCode }}</span>
      </header>

      <div class="row g-4">
        <!-- Dashboard Izquierdo: Estado Global -->
        <div class="col-lg-4">
          <div class="summary-card shadow-soft p-4">
            <h3 class="fw-bold mb-4">Análisis de Unanimidad</h3>
            
            <div class="unanimity-indicator mb-5" [ngClass]="isUnanimous() ? 'unanimous' : 'discrepancy'">
              <mat-icon>{{ isUnanimous() ? 'verified' : 'gavel' }}</mat-icon>
              <div class="text">
                <strong>{{ isUnanimous() ? 'UNANIMIDAD DETECTADA' : 'EXISTEN DISCREPANCIAS' }}</strong>
                <p>{{ isUnanimous() ? 'Todos los evaluadores coinciden en el veredicto.' : 'Se requiere debate en sesión de Pleno.' }}</p>
              </div>
            </div>

            <div class="traffic-light-container">
              <div class="light-item" [class.active]="countVerdict('APROBADO') > 0">
                <div class="light green"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('APROBADO') }}</span>
                  <span class="label">Informes Favorables</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="countVerdict('CON_OBSERVACIONES') > 0 || countVerdict('APROBADO_CONDICIONADO') > 0">
                <div class="light yellow"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('CON_OBSERVACIONES') + countVerdict('APROBADO_CONDICIONADO') }}</span>
                  <span class="label">Con Observaciones</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="countVerdict('NO_APROBADO') > 0">
                <div class="light red"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('NO_APROBADO') }}</span>
                  <span class="label">Informes Negativos</span>
                </div>
              </div>
            </div>

            <div class="action-box mt-5 pt-4 border-top">
              <h4 class="small fw-bold text-muted text-uppercase mb-3">Acción Sugerida</h4>
              <button mat-flat-button class="btn-finalize w-100" (click)="onProceedToResolution()" aria-label="Generar Acta Resolutiva final para el protocolo">
                <mat-icon>description</mat-icon> GENERAR ACTA RESOLUTIVA
              </button>
            </div>
          </div>
        </div>

        <!-- Matriz Comparativa Derecha -->
        <div class="col-lg-8">
          <div class="matrix-card shadow-soft">
            <div class="card-header p-3 bg-dark text-white d-flex justify-content-between align-items-center">
              <h4 class="m-0 fw-bold">Comparativa de Criterios Técnicos</h4>
              <span class="small opacity-75">Dictámenes recibidos: {{ evaluations().length }}</span>
            </div>
            
            <div class="matrix-body p-4">
              <div class="table-responsive">
                <table class="comparison-matrix">
                  <thead>
                    <tr>
                      <th>Evaluador / Área</th>
                      <th class="text-center">Ética</th>
                      <th class="text-center">Metodología</th>
                      <th class="text-center">Legal</th>
                      <th class="text-center">Dictamen Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ev of evaluations()">
                      <td class="evaluator-name">
                        <strong>{{ ev.evaluatorName || 'Experto ' + ev.id }}</strong>
                        <span class="small d-block text-muted">{{ ev.evaluatorProfile }}</span>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.ethicsResult)">{{ getStatusIcon(ev.ethicsResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.methodologyResult)">{{ getStatusIcon(ev.methodologyResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <mat-icon [ngClass]="getStatusClass(ev.legalResult)">{{ getStatusIcon(ev.legalResult) }}</mat-icon>
                      </td>
                      <td class="text-center">
                        <span class="badge-verdict" [ngClass]="ev.verdict.toLowerCase()">{{ ev.verdict }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Bloque de Observaciones Consolidadas -->
              <div class="consolidated-obs mt-5">
                <h4 class="fw-bold mb-3 d-flex align-items-center gap-2">
                  <mat-icon color="primary">speaker_notes</mat-icon>
                  Compendio de Observaciones para el Pleno
                </h4>
                
                <div class="obs-timeline">
                   @for (ev of evaluations(); track ev.id) {
                     @if (ev.observations) {
                        <div class="obs-item">
                           <div class="obs-author">{{ ev.evaluatorName }}</div>
                           <div class="obs-text">{{ ev.observations }}</div>
                        </div>
                     }
                   }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .consolidation-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; }
    .breadcrumb { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .protocol-badge { background: #003366; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; }
    .page-title { font-size: 2rem; font-weight: 900; color: #1e293b; margin: 0.25rem 0; }
    .page-subtitle { font-size: 1rem; color: #64748b; margin: 0; font-style: italic; }

    .summary-card { background: white; border-radius: 24px; border: 1px solid #e2e8f0; position: sticky; top: 100px; }
    
    .unanimity-indicator {
      display: flex; gap: 12px; padding: 1.5rem; border-radius: 16px; align-items: center;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
      &.unanimous { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      &.discrepancy { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
      strong { font-size: 1rem; display: block; line-height: 1.2; }
      p { margin: 0; font-size: 0.75rem; font-weight: 600; }
    }

    .traffic-light-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .light-item { display: flex; align-items: center; gap: 1rem; opacity: 0.3; transition: all 0.3s;
      &.active { opacity: 1; }
      .light { width: 22px; height: 22px; border-radius: 50%; }
      .green { background: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.4); }
      .yellow { background: #f59e0b; box-shadow: 0 0 15px rgba(245,158,11,0.4); }
      .red { background: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.4); }
      .light-text { display: flex; flex-direction: column; .count { font-size: 1.75rem; font-weight: 900; line-height: 1; color: #1e293b; } .label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; } }
    }

    .matrix-card { background: white; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
    .comparison-matrix {
      width: 100%; border-collapse: collapse;
      th { padding: 1.25rem; font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 800; border-bottom: 2px solid #f1f5f9; }
      td { padding: 1.25rem; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .evaluator-name { strong { color: #1e293b; font-size: 0.95rem; } }
    }

    .badge-verdict {
      padding: 4px 12px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      &.aprobado { background: #dcfce7; color: #166534; }
      &.no_aprobado { background: #fee2e2; color: #991b1b; }
      &.con_observaciones, &.aprobado_condicionado { background: #fef3c7; color: #92400e; }
    }

    .status-ok { color: #10b981; }
    .status-warn { color: #f59e0b; }
    .status-err { color: #ef4444; }

    .obs-timeline { display: flex; flex-direction: column; gap: 1rem; }
    .obs-item { 
      background: #f8fafc; 
      padding: 1.25rem; 
      border-radius: 12px; 
      border: 1px solid #e2e8f0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      
      .obs-author { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .obs-text { font-size: 0.9rem; color: #1e293b; line-height: 1.4; }
    }
    
    .obs-item:hover {
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      border-color: #cbd5e1;
    }
 
    .btn-finalize { 
      background: #003366 !important; 
      color: white !important; 
      height: 54px; 
      border-radius: 12px; 
      font-weight: 800;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .btn-finalize:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.2);
    }
    
    .btn-finalize:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EvaluationConsolidationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private destroyRef = inject(DestroyRef);

  protocolId = '';
  protocol = signal<any>(null);
  evaluations = signal<any[]>([]);
  isUnanimous = signal(true);

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    this.loadConsolidation();
  }

  loadConsolidation() {
    // 1. Obtener datos del protocolo para el encabezado
    this.protocolRepo.getById(this.protocolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.protocol.set(p));
 
    // 2. Consumir el nuevo endpoint de Consolidación (Anexo 12)
    this.evalRepo.consolidateEvaluation(this.protocolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = res.data || res;
          const rawList = Array.isArray(data.evaluations) ? data.evaluations : [];
          const normalized = rawList.map((ev: any) => ({
            ...ev,
            verdict: ev.verdict || ev.result || 'APROBADO',
            ethicsResult: ev.ethicsResult || ev.ethicalAspects || ev.result || 'APROBADO',
            methodologyResult: ev.methodologyResult || ev.methodologicalAspects || ev.result || 'APROBADO',
            legalResult: ev.legalResult || ev.legalAspects || ev.result || 'APROBADO',
            evaluatorProfile: ev.evaluatorProfile || 'Evaluador',
            evaluatorName: ev.evaluatorName || ('Evaluador #' + (ev.evaluatorId || ev.id || ''))
          }));
          this.evaluations.set(normalized);
          this.isUnanimous.set(data.isUnanimous ?? true);
        },
        error: (err) => {
          this.snackBar.open('❌ Error al cargar la consolidación', 'Cerrar');
        }
      });
  }

  countVerdict(verdict: string): number {
    return this.evaluations().filter(e => e.verdict === verdict).length;
  }

  getStatusIcon(result: string): string {
    if (result === 'APROBADO') return 'check_circle';
    if (result === 'NO_APROBADO') return 'cancel';
    return 'error';
  }

  getStatusClass(result: string): string {
    if (result === 'APROBADO') return 'status-ok';
    if (result === 'NO_APROBADO') return 'status-err';
    return 'status-warn';
  }

  onProceedToResolution() {
    this.snackBar.open('✅ Generando Acta de Resolución...', 'Cerrar');
    this.router.navigate(['/dashboard/resolutions/generator'], { queryParams: { protocolId: this.protocolId } });
  }
}
