import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { GetMyAssignmentsUseCase } from '../../../application/get-my-assignments.use-case';
import { ConfirmAssignmentUseCase } from '../../../application/confirm-assignment.use-case';
import { GetEvaluatorsDashboardUseCase } from '../../../application/get-evaluators-dashboard.use-case';

@Component({
  selector: 'app-evaluation-list',
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
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container animate-fade-in">
      <header class="page-header mb-4">
        <div class="title-section">
          <h1 class="page-title">{{ pageTitle() }}</h1>
          <p class="page-subtitle">{{ pageSubtitle() }}</p>
        </div>
        <div class="role-badge" [ngClass]="userRole().toLowerCase()">
          {{ userRole() }}
        </div>
      </header>

      <div class="content-card shadow-soft">
        <div class="table-toolbar p-3">
          <h2 class="section-title m-0">Protocolos {{ isSecretaria() ? 'Pendientes de Confirmar' : 'Asignados' }}</h2>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="items()" class="modern-table">
            
            <ng-container matColumnDef="protocol">
              <th mat-header-cell *matHeaderCellDef> Protocolo </th>
              <td mat-cell *matCellDef="let item">
                <div class="protocol-info-cell">
                  <span class="code">{{ item.protocolCode | protocolCode }}</span>
                  <span class="title">{{ item.protocolTitle }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="deadline">
              <th mat-header-cell *matHeaderCellDef> Fecha Límite </th>
              <td mat-cell *matCellDef="let item">
                <div *ngIf="isEvaluador()" class="deadline-view">
                  {{ item.deadline | date:'dd/MM/yyyy' }}
                </div>
                <div *ngIf="isSecretaria()" class="deadline-edit">
                  <mat-form-field appearance="outline" class="mini-field">
                    <input matInput type="date" [(ngModel)]="item.newDeadline">
                  </mat-form-field>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-end"> Acciones </th>
              <td mat-cell *matCellDef="let item" class="text-end">
                <button *ngIf="isEvaluador()" mat-flat-button color="primary" [routerLink]="['/dashboard/evaluations/evaluate', item.id]">
                  <mat-icon>gavel</mat-icon> Evaluar
                </button>
                <button *ngIf="isSecretaria()" mat-flat-button color="warn" 
                        [disabled]="!item.newDeadline"
                        (click)="onConfirm(item)">
                  Confirmar Asignación
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; }
    .role-badge {
      padding: 0.5rem 1rem; border-radius: 8px; font-weight: 800; font-size: 0.8rem;
      &.secretaria { background: #f3e5f5; color: #7b1fa2; }
      &.evaluador { background: #e0f2fe; color: #0369a1; }
    }
    .content-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .modern-table { width: 100%; th { padding: 1rem; background: #f8fafc; font-weight: 700; } td { padding: 1rem; } }
    .protocol-info-cell { display: flex; flex-direction: column; .code { font-weight: 800; color: #003366; } .title { font-size: 0.9rem; } }
    .mini-field { width: 150px; }
  `]
})
export class EvaluationListPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private getMyAssignmentsUC = inject(GetMyAssignmentsUseCase);
  private confirmUC = inject(ConfirmAssignmentUseCase);
  private getDashboardUC = inject(GetEvaluatorsDashboardUseCase);
  private snackBar = inject(MatSnackBar);

  userRole = computed(() => this.authFacade.currentUser()?.rol?.toUpperCase() || '');
  isSecretaria = computed(() => this.userRole() === 'SECRETARIA');
  isEvaluador = computed(() => this.userRole() === 'EVALUADOR');

  pageTitle = computed(() => this.isSecretaria() ? 'Confirmación de Asignaciones' : 'Mis Tareas de Evaluación');
  pageSubtitle = computed(() => this.isSecretaria() ? 'Gestione y confirme las fechas límite para los evaluadores sugeridos' : 'Protocolos pendientes de su revisión ética y técnica');

  displayedColumns = computed(() => ['protocol', 'deadline', 'actions']);
  items = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    if (this.isEvaluador()) {
      this.getMyAssignmentsUC.execute().subscribe(data => this.items.set(data));
    } else if (this.isSecretaria()) {
      // Para la Secretaria, cargamos el dashboard que debería contener las sugerencias
      this.getDashboardUC.execute().subscribe(data => {
        this.items.set(data.suggestedEvaluations.map((e: any) => ({ ...e, newDeadline: '' })));
      });
    }
  }

  onConfirm(item: any) {
    this.confirmUC.execute({ evaluationId: item.id, deadline: item.newDeadline }).subscribe(() => {
      this.snackBar.open('✅ Asignación confirmada con éxito', 'Cerrar', { duration: 3000 });
      this.loadData();
    });
  }
}
