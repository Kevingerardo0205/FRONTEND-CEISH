import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';
import { GetEvaluatorsDashboardUseCase } from '../../../application/get-evaluators-dashboard.use-case';
import { SuggestEvaluatorsUseCase } from '../../../application/suggest-evaluators.use-case';
import { ConfirmAssignmentUseCase } from '../../../application/confirm-assignment.use-case';
import { GetEvaluationProfilesUseCase } from '../../../application/get-evaluation-profiles.use-case';
import { GetAllProtocolsUseCase } from '@features/protocols/application/use-cases/get-all-protocols.use-case';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatChipsModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container animate-fade-in">
      <header class="page-header">
        <div class="title-section">
          <h1>Gestión de Asignaciones (EVAL)</h1>
          <p>{{ isPresident() ? 'Presidenta: Sugerir evaluadores para protocolos' : 'Secretaría: Confirmar asignaciones y plazos' }}</p>
        </div>
        
        <div class="filters-section">
          <div class="role-badge" [ngClass]="userRole().toLowerCase()">
            {{ userRole() }}
          </div>
        </div>
      </header>

      <!-- VISTA PRESIDENTA: Sugerencia -->
      <div class="table-card shadow-soft" *ngIf="isPresident()">
        <div class="table-info-header p-3">
          <mat-icon color="primary">assignment_ind</mat-icon>
          <span>Protocolos pendientes de sugerencia de evaluadores</span>
        </div>

        <table mat-table [dataSource]="pendingProtocols()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo</th>
            <td mat-cell *matCellDef="let p">
              <div class="protocol-info">
                <span class="code">{{ p.protocolCode | protocolCode }}</span>
                <span class="title">{{ p.protocolTitle }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="evaluators">
            <th mat-header-cell *matHeaderCellDef>Seleccionar Evaluadores (Max 5)</th>
            <td mat-cell *matCellDef="let p">
              <mat-form-field appearance="outline" class="w-100 mt-2">
                <mat-select multiple placeholder="Sugerir expertos" [(ngModel)]="p.selectedEvaluatorIds">
                  <mat-option *ngFor="let eval of evaluators()" [value]="eval.id">
                    <div class="eval-option">
                      <div class="eval-main">
                        <span class="name">{{ eval.nombre }}</span>
                        <span class="badge-perfil">{{ eval.perfil }}</span>
                      </div>
                      <span class="workload" [ngClass]="getWorkloadClass(eval.cargaActiva)">
                        Carga: {{ eval.cargaActiva }} protocolos
                      </span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-end">Acciones</th>
            <td mat-cell *matCellDef="let p" class="text-end">
              <button mat-flat-button color="primary" 
                      [disabled]="!p.selectedEvaluatorIds?.length || isProcessing"
                      (click)="onSuggest(p)">
                <mat-icon>send</mat-icon> ENVIAR SUGERENCIA
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="['protocol', 'evaluators', 'actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['protocol', 'evaluators', 'actions'];"></tr>
        </table>
        
        <div class="empty-state" *ngIf="pendingProtocols().length === 0">
          <mat-icon>done_all</mat-icon>
          <p>No hay protocolos pendientes de sugerencia.</p>
        </div>
      </div>

      <!-- VISTA SECRETARÍA: Confirmación -->
      <div class="table-card shadow-soft mt-4" *ngIf="isSecretary() || isPresident()">
        <div class="table-info-header p-3 secretary-header">
          <mat-icon color="accent">verified</mat-icon>
          <span>Asignaciones sugeridas pendientes de oficialización</span>
        </div>

        <table mat-table [dataSource]="suggestedEvaluations()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo Sugerido</th>
            <td mat-cell *matCellDef="let s">
              <div class="protocol-info">
                <span class="code">{{ s.protocolCode | protocolCode }}</span>
                <span class="title">{{ s.protocolTitle }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="evaluator">
            <th mat-header-cell *matHeaderCellDef>Evaluador Sugerido</th>
            <td mat-cell *matCellDef="let s">
              <div class="evaluator-info">
                <mat-icon>person</mat-icon>
                <span>{{ s.evaluatorName }}</span>
                <small>({{ s.evaluatorProfile }})</small>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="deadline">
            <th mat-header-cell *matHeaderCellDef>Plazo de Evaluación</th>
            <td mat-cell *matCellDef="let s">
              <mat-form-field appearance="outline" class="deadline-picker mt-2">
                <input matInput [matDatepicker]="picker" [(ngModel)]="s.deadline" placeholder="Fecha límite">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-end">Acciones</th>
            <td mat-cell *matCellDef="let s" class="text-end">
              <button mat-flat-button color="accent" 
                      [disabled]="!s.deadline || isProcessing || !isSecretary()"
                      (click)="onConfirm(s)">
                <mat-icon>check_circle</mat-icon> OFICIALIZAR
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="['protocol', 'evaluator', 'deadline', 'actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['protocol', 'evaluator', 'deadline', 'actions'];"></tr>
        </table>
        
        <div class="empty-state" *ngIf="suggestedEvaluations().length === 0">
          <mat-icon>hourglass_empty</mat-icon>
          <p>No hay sugerencias pendientes.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; }
    
    .role-badge {
      padding: 0.5rem 1rem; border-radius: 8px; font-weight: 800; text-transform: uppercase; font-size: 0.8rem;
      &.admin { background: #fee2e2; color: #991b1b; }
      &.presidente, &.presidenta { background: #e0f2fe; color: #075985; }
      &.secretaria { background: #fef3c7; color: #92400e; }
    }
    
    .table-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .table-info-header { 
      background: #f8fafc; color: #475569; display: flex; align-items: center; gap: 8px; 
      font-size: 0.9rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;
      &.secretary-header { background: #fffbeb; color: #92400e; border-bottom-color: #fef3c7; }
    }

    .protocol-info {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.75rem 0;
      .code { font-weight: 800; color: #003366; font-size: 0.75rem; }
      .title { font-size: 0.9rem; color: #1e293b; font-weight: 600; line-height: 1.2; }
    }

    .eval-option {
      display: flex; justify-content: space-between; align-items: center; width: 100%;
      .eval-main { display: flex; flex-direction: column; }
      .name { font-weight: 600; }
      .badge-perfil { font-size: 0.65rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; width: fit-content; }
      .workload { font-size: 0.7rem; font-weight: 700; 
        &.low { color: #10b981; } &.med { color: #f59e0b; } &.high { color: #ef4444; }
      }
    }

    .evaluator-info {
      display: flex; align-items: center; gap: 8px; color: #1e293b; font-weight: 600;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
      small { color: #64748b; font-weight: 400; }
    }

    .deadline-picker { width: 180px; }
    table { width: 100%; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; padding: 1rem; }
    td { padding: 0.5rem 1rem; vertical-align: middle; }
    
    .empty-state {
      padding: 3rem; display: flex; flex-direction: column; align-items: center; color: #94a3b8;
      mat-icon { font-size: 40px; width: 48px; height: 48px; margin-bottom: 0.5rem; }
    }

    .text-end { text-align: right; }
    .w-100 { width: 100%; }
  `]
})
export class AssignmentPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);
  private getDashboardUC = inject(GetEvaluatorsDashboardUseCase);
  private suggestUC = inject(SuggestEvaluatorsUseCase);
  private confirmUC = inject(ConfirmAssignmentUseCase);

  userRole = computed(() => this.authFacade.currentUser()?.rol || 'PRESIDENTE');
  isPresident = computed(() => this.userRole() === 'PRESIDENTE' || this.userRole() === 'PRESIDENTA' || this.userRole() === 'ADMIN');
  isSecretary = computed(() => this.userRole() === 'SECRETARIA' || this.userRole() === 'ADMIN');

  pendingProtocols = signal<any[]>([]);
  suggestedEvaluations = signal<any[]>([]);
  evaluators = signal<EvaluatorEntity[]>([]);
  isProcessing = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.getDashboardUC.execute().subscribe(data => {
      // Mapeo de protocolos pendientes de sugerencia
      if (data.pendingProtocols) {
        this.pendingProtocols.set(data.pendingProtocols.map((p: any) => ({
          ...p,
          selectedEvaluatorIds: []
        })));
      }
      
      // Mapeo de sugerencias pendientes de confirmación
      if (data.suggestedEvaluations) {
        this.suggestedEvaluations.set(data.suggestedEvaluations.map((s: any) => ({
          ...s,
          deadline: s.deadline ? new Date(s.deadline) : null
        })));
      }

      if (data.evaluators) {
        this.evaluators.set(data.evaluators);
      }
    });
  }

  getWorkloadClass(carga: number): string {
    if (carga <= 2) return 'low';
    if (carga <= 4) return 'med';
    return 'high';
  }

  onSuggest(protocol: any) {
    this.isProcessing = true;
    this.suggestUC.execute(protocol.protocolId, protocol.selectedEvaluatorIds).subscribe({
      next: () => {
        this.snackBar.open(`✅ Sugerencia para ${protocol.protocolCode} enviada a Secretaría`, 'Cerrar', { duration: 3000 });
        this.loadData();
        this.isProcessing = false;
      },
      error: () => {
        this.snackBar.open('❌ Error al enviar sugerencia', 'Cerrar', { duration: 3000 });
        this.isProcessing = false;
      }
    });
  }

  onConfirm(suggestion: any) {
    if (!suggestion.deadline) return;
    
    this.isProcessing = true;
    const payload = {
      evaluationId: suggestion.id,
      deadline: suggestion.deadline.toISOString()
    };

    this.confirmUC.execute(payload).subscribe({
      next: () => {
        this.snackBar.open(`✅ Asignación oficializada para ${suggestion.protocolCode}`, 'Cerrar', { duration: 3000 });
        this.loadData();
        this.isProcessing = false;
      },
      error: () => {
        this.snackBar.open('❌ Error al oficializar asignación', 'Cerrar', { duration: 3000 });
        this.isProcessing = false;
      }
    });
  }
}
