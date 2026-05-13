import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { EvaluationEntity, EvaluationVerdict } from '@domain/entities/evaluation.entity';

@Component({
  selector: 'app-evaluation-consolidation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="consolidation-container animate-fade-in">
      <header class="page-header mb-4">
        <div class="d-flex align-items-center gap-3">
          <button mat-icon-button routerLink="/dashboard/evaluations/assignment" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section">
            <span class="protocol-badge">{{ protocol()?.code | protocolCode }}</span>
            <h1 class="page-title">Consolidación de Evaluaciones</h1>
            <p class="page-subtitle">{{ protocol()?.title }}</p>
          </div>
        </div>
      </header>

      <div class="row">
        <!-- Resumen de Semáforos -->
        <div class="col-md-4">
          <div class="summary-card shadow-soft p-4 mb-4">
            <h3 class="fw-bold mb-4">Estado de Deliberación</h3>
            
            <div class="traffic-light-container">
              <div class="light-item" [class.active]="hasVerdict('APROBADO')">
                <div class="light green"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('APROBADO') }}</span>
                  <span class="label">Informes Favorables</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="hasVerdict('CON_OBSERVACIONES')">
                <div class="light yellow"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('CON_OBSERVACIONES') }}</span>
                  <span class="label">Con Observaciones</span>
                </div>
              </div>
              
              <div class="light-item" [class.active]="hasVerdict('NO_APROBADO')">
                <div class="light red"></div>
                <div class="light-text">
                  <span class="count">{{ countVerdict('NO_APROBADO') }}</span>
                  <span class="label">Informes Negativos</span>
                </div>
              </div>
            </div>

            <div class="action-box mt-5">
              <h4 class="small fw-bold text-muted text-uppercase mb-3">Decisión del Comité (Pleno)</h4>
              <div class="d-grid gap-2">
                <button mat-flat-button color="primary" (click)="onFinalDecision('APPROVED')">
                  <mat-icon>check_circle</mat-icon> EMITIR APROBACIÓN
                </button>
                <button mat-stroked-button color="warn" (click)="onFinalDecision('OBSERVED')">
                  <mat-icon>error_outline</mat-icon> ENVIAR OBSERVACIONES
                </button>
                <button mat-flat-button color="warn" (click)="onFinalDecision('REJECTED')">
                  <mat-icon>cancel</mat-icon> RECHAZO DEFINITIVO
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Evaluaciones Detalladas -->
        <div class="col-md-8">
          <div class="evaluations-card shadow-soft">
            <div class="card-header p-3 bg-light">
              <h4 class="m-0 fw-bold">Informes Recibidos</h4>
            </div>
            
            <div class="eval-list">
              <div class="eval-item p-4" *ngFor="let ev of evaluations()">
                <div class="eval-header">
                  <div class="evaluator-meta">
                    <mat-icon class="eval-icon">account_circle</mat-icon>
                    <div>
                      <h5 class="m-0 fw-bold">Evaluador #{{ ev.evaluatorId }}</h5>
                      <span class="small text-muted">{{ ev.evaluationDate | date:'medium' }}</span>
                    </div>
                  </div>
                  <mat-chip [ngClass]="ev.verdict.toLowerCase()" highlighted>
                    {{ ev.verdict }}
                  </mat-chip>
                </div>

                <div class="eval-content mt-3">
                   <!-- Aquí iría un resumen de las observaciones de cada sección -->
                   <div class="obs-section" *ngIf="ev.annex10?.etica?.observaciones">
                     <strong>Ética:</strong> {{ ev.annex10?.etica?.observaciones }}
                   </div>
                   <div class="obs-section" *ngIf="ev.annex10?.metodologia?.observaciones">
                     <strong>Metodología:</strong> {{ ev.annex10?.metodologia?.observaciones }}
                   </div>
                </div>

                <div class="eval-actions mt-3">
                  <button mat-button color="primary">
                    <mat-icon>visibility</mat-icon> VER INFORME COMPLETO
                  </button>
                  <button mat-button>
                    <mat-icon>download</mat-icon> DESCARGAR PDF
                  </button>
                </div>
              </div>

              <div class="empty-evals p-5 text-center" *ngIf="evaluations().length === 0">
                <mat-icon class="big-icon">pending_actions</mat-icon>
                <p>Esperando la recepción de informes de los evaluadores.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .consolidation-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .protocol-badge { background: #003366; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 800; font-size: 0.8rem; }
    .page-title { font-size: 2.2rem; font-weight: 900; color: #1e293b; margin: 0.5rem 0; }
    .page-subtitle { font-size: 1.1rem; color: #64748b; margin: 0; }

    .summary-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; position: sticky; top: 100px; }
    .traffic-light-container { display: flex; flex-direction: column; gap: 1rem; }
    .light-item { display: flex; align-items: center; gap: 1rem; opacity: 0.4; transition: all 0.3s;
      &.active { opacity: 1; transform: translateX(5px); }
      .light { width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .green { background: #10b981; }
      .yellow { background: #f59e0b; }
      .red { background: #ef4444; }
      .light-text { display: flex; flex-direction: column; .count { font-size: 1.5rem; font-weight: 900; line-height: 1; } .label { font-size: 0.8rem; color: #64748b; font-weight: 600; } }
    }

    .evaluations-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
    .eval-item { border-bottom: 1px solid #f1f5f9; &:last-child { border-bottom: none; } }
    .eval-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .evaluator-meta { display: flex; align-items: center; gap: 12px; 
      .eval-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; }
    }

    .obs-section { background: #f8fafc; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 0.9rem; }
    .empty-evals { .big-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; margin-bottom: 1rem; } }
    
    mat-chip.aprobado { background: #dcfce7; color: #166534; }
    mat-chip.con_observaciones { background: #fef3c7; color: #92400e; }
    mat-chip.no_aprobado { background: #fee2e2; color: #991b1b; }
  `]
})
export class EvaluationConsolidationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);

  protocolId = '';
  protocol = signal<any>(null);
  evaluations = signal<EvaluationEntity[]>([]);

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    this.loadData();
  }

  loadData() {
    this.protocolRepo.getById(this.protocolId).subscribe(p => this.protocol.set(p));
    this.evalRepo.getByProtocolId(this.protocolId).subscribe(evs => this.evaluations.set(evs));
  }

  countVerdict(verdict: string): number {
    return this.evaluations().filter(e => e.verdict === verdict).length;
  }

  hasVerdict(verdict: string): boolean {
    return this.countVerdict(verdict) > 0;
  }

  onFinalDecision(decision: string) {
    // Aquí se llamaría al endpoint de Resoluciones para finalizar el ciclo
    this.snackBar.open(`✅ Decisión de ${decision} registrada. Redirigiendo a Resoluciones...`, 'Cerrar', { duration: 3000 });
    // this.router.navigate(['/dashboard/resolutions/create', this.protocolId]);
  }
}
