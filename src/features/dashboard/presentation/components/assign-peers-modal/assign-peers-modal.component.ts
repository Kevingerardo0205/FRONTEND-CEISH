import { Component, Inject, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PendingPeerAssignmentProtocol, AssignEvaluatorsResponse } from '@domain/entities/peer-evaluation.entity';
import { UserAdmin } from '@domain/entities/user-admin.entity';
import { UserRole } from '@domain/entities/user.entity';

@Component({
  selector: 'app-assign-peers-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="title-area">
          <mat-icon color="primary">people</mat-icon>
          <h2>Asignación de Cuerpo Evaluador</h2>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn" [disabled]="isSubmitting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <div class="protocol-card">
          <span class="code">{{ data.protocol.ceishCode }}</span>
          <h3 class="title">{{ data.protocol.title }}</h3>
          <div class="metadata">
            <span><strong>Investigador:</strong> {{ data.protocol.principalInvestigatorRecord.fullName }}</span>
            <span><strong>Tipo:</strong> {{ data.protocol.studyType.nombre }}</span>
          </div>
        </div>

        <div class="instruction-box">
          <mat-icon>info</mat-icon>
          <div class="text">
            <p><strong>Normativa PET 2026:</strong> Debe seleccionar un <strong>mínimo de 4 evaluadores</strong>.</p>
            <ul>
              <li>Todos realizarán el dictamen ético.</li>
              <li>El sistema elegirá <strong>2 aleatoriamente</strong> para la estratificación de riesgo.</li>
            </ul>
          </div>
        </div>

        <form class="assign-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seleccionar Evaluadores (Mínimo 4)</mat-label>
            <mat-select [formControl]="evaluatorsControl" multiple placeholder="Busque y seleccione evaluadores">
              <mat-select-trigger>
                {{ evaluatorsControl.value.length }} evaluadores seleccionados
              </mat-select-trigger>
              <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                <div class="eval-option">
                  <span class="name">{{ ev.nombre }}</span>
                  <span class="email">{{ ev.email }}</span>
                </div>
              </mat-option>
            </mat-select>
            <mat-hint align="end">{{ evaluatorsControl.value.length }} seleccionados</mat-hint>
          </mat-form-field>

          <div class="selection-summary" *ngIf="evaluatorsControl.value.length > 0">
            <div class="summary-chip" *ngFor="let id of evaluatorsControl.value">
              {{ getEvaluatorName(id) }}
              <mat-icon (click)="removeEvaluator(id)">cancel</mat-icon>
            </div>
          </div>

          <div *ngIf="evaluatorsControl.value.length < 4 && evaluatorsControl.touched" class="error-banner animate-fade-in">
            <mat-icon>warning</mat-icon>
            <span>Se requieren al menos 4 evaluadores para continuar.</span>
          </div>
        </form>

        <!-- Feedback de éxito detallado -->
        <div class="success-result animate-fade-in" *ngIf="successData()">
          <div class="result-header">
            <mat-icon>check_circle</mat-icon>
            <h3>Asignación Exitosa</h3>
          </div>
          <div class="result-body">
            <p>{{ successData()?.message }}</p>
            
            <div class="risk-random-box">
              <span class="label">🎲 Pares de Riesgo Seleccionados:</span>
              <div class="names">
                 <span *ngFor="let id of successData()?.riskEvaluators" class="risk-name">
                   {{ getEvaluatorName(id) }}
                 </span>
              </div>
            </div>

            <!-- Cuerpo de evaluadores éticos -->
            <div class="all-evaluators-box mt-3" *ngIf="successData()?.allEvaluators?.length">
              <span class="label-all">✍️ Cuerpo Evaluador Ético Asignado ({{ successData()?.allEvaluators?.length }}):</span>
              <div class="eval-list-small">
                <div *ngFor="let id of successData()?.allEvaluators; let idx = index" class="eval-item-small" [class.is-risk-peer]="isRiskEvaluator(id)">
                  <div class="eval-info-row">
                    <span class="name">{{ getEvaluatorName(id) }}</span>
                    <span class="assignment-id" *ngIf="successData()?.evaluationAssignmentIds?.length">Asignación: #{{ successData()?.evaluationAssignmentIds?.[idx] }}</span>
                  </div>
                  <span class="risk-badge" *ngIf="isRiskEvaluator(id)">
                    <mat-icon>security</mat-icon> Par de Riesgo
                  </span>
                </div>
              </div>
            </div>

            <div class="deadline-info mt-3">
              <mat-icon>event</mat-icon>
              <span>Fecha límite de dictamen: <strong>{{ successData()?.deadline | date:'fullDate' }}</strong></span>
            </div>
          </div>
          <button mat-flat-button color="primary" class="w-100 mt-3" (click)="close(true)">Entendido</button>
        </div>
      </div>

      <div mat-dialog-actions class="modal-actions" *ngIf="!successData()">
        <button mat-stroked-button (click)="close()" [disabled]="isSubmitting()">Cancelar</button>
        <button 
          mat-flat-button 
          color="primary" 
          [disabled]="evaluatorsControl.value.length < 4 || isSubmitting()"
          (click)="onSubmit()">
          <mat-icon>{{ isSubmitting() ? 'hourglass_empty' : 'how_to_reg' }}</mat-icon>
          Finalizar Asignación
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-width: 600px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;
      .title-area { display: flex; align-items: center; gap: 0.5rem; h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; } }
    }
    .protocol-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;
      .code { background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 0.7rem; align-self: flex-start; }
      .title { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
      .metadata { display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b; }
    }
    .instruction-box { display: flex; gap: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;
      mat-icon { color: #d97706; }
      .text { p { margin: 0 0 0.5rem; font-size: 0.85rem; color: #92400e; } ul { margin: 0; padding-left: 1.2rem; font-size: 0.8rem; color: #b45309; } }
    }
    .full-width { width: 100%; }
    .eval-option { display: flex; flex-direction: column; .name { font-weight: 600; font-size: 0.9rem; } .email { font-size: 0.75rem; color: #64748b; } }
    .selection-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 1rem; margin-bottom: 1rem;
      .summary-chip { background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0;
        mat-icon { font-size: 16px; width: 16px; height: 16px; cursor: pointer; &:hover { color: #ef4444; } }
      }
    }
    .error-banner { background: #fef2f2; color: #dc2626; border-radius: 8px; padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; mat-icon { font-size: 18px; } }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem; }

    /* Estilos de éxito */
    .success-result { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 1.5rem; text-align: center; margin-top: 1rem;
      .result-header { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1rem; mat-icon { font-size: 48px; width: 48px; height: 48px; color: #22c55e; } h3 { margin: 0; font-weight: 800; color: #14532d; } }
      .result-body { p { font-size: 0.9rem; color: #166534; margin-bottom: 1.5rem; } }
      .risk-random-box { background: white; border: 1px dashed #22c55e; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; text-align: left;
        .label { font-size: 0.75rem; font-weight: 800; color: #15803d; display: block; margin-bottom: 0.5rem; }
        .names { display: flex; flex-direction: column; gap: 4px; .risk-name { font-weight: 700; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; &::before { content: '•'; color: #22c55e; font-size: 1.5rem; line-height: 0; } } }
      }
      .all-evaluators-box { background: white; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; text-align: left;
        .label-all { font-size: 0.75rem; font-weight: 800; color: #166534; display: block; margin-bottom: 0.5rem; }
        .eval-list-small { display: flex; flex-direction: column; gap: 8px; }
        .eval-item-small { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          &.is-risk-peer { border-color: #bbf7d0; background: #f0fdf4; }
          .eval-info-row { display: flex; flex-direction: column; .name { font-weight: 700; color: #1e293b; font-size: 0.85rem; } .assignment-id { font-size: 0.7rem; color: #64748b; font-weight: 600; } }
          .risk-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 6px;
            mat-icon { font-size: 12px; width: 12px; height: 12px; color: #16a34a; }
          }
        }
      }
      .deadline-info { display: flex; align-items: center; justify-content: center; gap: 8px; color: #166534; font-size: 0.85rem; mat-icon { font-size: 18px; } }
    }
    .w-100 { width: 100%; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AssignPeersModalComponent implements OnInit {
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private snack = inject(MatSnackBar);

  evaluatorsControl = new FormControl<string[]>([], { nonNullable: true });
  evaluators = signal<UserAdmin[]>([]);
  isSubmitting = signal<boolean>(false);
  successData = signal<AssignEvaluatorsResponse | null>(null);

  constructor(
    public dialogRef: MatDialogRef<AssignPeersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { protocol: PendingPeerAssignmentProtocol }
  ) {}

  ngOnInit() {
    this.loadEvaluators();
  }

  getEvaluatorName(id: string | number): string {
    const ev = this.evaluators().find(e => e.id === id.toString());
    return ev ? ev.nombre : 'Evaluador desconocido';
  }

  isRiskEvaluator(id: string | number): boolean {
    const success = this.successData();
    if (!success || !success.riskEvaluators) return false;
    return success.riskEvaluators.some(riskId => riskId.toString() === id.toString());
  }

  removeEvaluator(id: string | number) {
    const currentValues = this.evaluatorsControl.value;
    this.evaluatorsControl.setValue(currentValues.filter(val => val !== id.toString()));
  }

  private loadEvaluators() {
    this.evaluationRepo.getActiveEvaluators().subscribe({
      next: (users) => {
        const rawList = Array.isArray(users) ? users : [];
        const mapped: UserAdmin[] = rawList.map(u => ({
          id: u.id.toString(),
          nombre: u.fullName || u.nombre || 'Evaluador',
          email: u.email || u.institutionalEmail || '',
          rol: 'EVALUADOR' as UserRole,
          roles: ['EVALUADOR'],
          perfil: 'Investigador',
          activo: true,
          cedula: ''
        }));
        this.evaluators.set(mapped);
      },
      error: () => {
        this.snack.open('Error al cargar catálogo de evaluadores.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  close(refresh: boolean = false) {
    this.dialogRef.close(refresh);
  }

  onSubmit() {
    if (this.evaluatorsControl.value.length < 4) return;

    this.isSubmitting.set(true);
    const evaluatorIds = this.evaluatorsControl.value.map(id => Number(id));

    this.evaluationRepo.assignPeerEvaluators(this.data.protocol.id.toString(), evaluatorIds).subscribe({
      next: (res) => {
        this.successData.set(res);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error asignando evaluadores:', err);
        const msg = err.error?.message || 'Error al asignar los evaluadores.';
        this.snack.open(Array.isArray(msg) ? msg[0] : msg, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }
}
