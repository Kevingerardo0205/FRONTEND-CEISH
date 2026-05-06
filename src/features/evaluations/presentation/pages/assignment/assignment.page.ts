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
import { FormsModule } from '@angular/forms';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';
import { GetEvaluatorsDashboardUseCase } from '../../../application/get-evaluators-dashboard.use-case';
import { SuggestEvaluatorsUseCase } from '../../../application/suggest-evaluators.use-case';

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
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Dashboard de Evaluaciones</h1>
          <p>Gestión de carga y sugerencias de evaluadores</p>
        </div>
        <div class="role-badge presidente">
          PRESIDENTE
        </div>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="dashboardData()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo / Proyecto</th>
            <td mat-cell *matCellDef="let p">
              <div class="protocol-info">
                <span class="code">{{ p.protocolCode | protocolCode }}</span>
                <span class="title">{{ p.protocolTitle }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="evaluators">
            <th mat-header-cell *matHeaderCellDef>Sugerir Evaluadores</th>
            <td mat-cell *matCellDef="let p">
              <div class="selector-container">
                <mat-form-field appearance="outline" class="evaluator-select">
                  <mat-select multiple placeholder="Seleccione evaluadores" [(ngModel)]="p.selectedEvaluators">
                    <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                      {{ ev.nombre }} ({{ ev.perfil }}) - Carga: {{ ev.cargaActiva }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button mat-flat-button color="primary" 
                      [disabled]="!p.selectedEvaluators?.length"
                      (click)="onSuggest(p)">
                Enviar Sugerencia
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; }
    .page-header { 
      margin-bottom: 2rem; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .role-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.8rem;
      &.presidente { background: #efebe9; color: #4e342e; }
    }
    .table-card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
    .protocol-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 0;
      .code { font-weight: 700; color: #003366; font-size: 0.8rem; }
      .title { font-size: 0.9rem; color: #475569; font-weight: 500; }
    }
    .evaluator-select { width: 100%; margin: 10px 0; }
    table { width: 100%; }
    th { background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; padding: 1rem; }
    td { padding: 0.5rem 1rem; vertical-align: middle; }
  `]
})
export class AssignmentPage implements OnInit {
  private snackBar = inject(MatSnackBar);
  private getDashboardUC = inject(GetEvaluatorsDashboardUseCase);
  private suggestUC = inject(SuggestEvaluatorsUseCase);

  displayedColumns = ['protocol', 'evaluators', 'actions'];
  
  dashboardData = signal<any[]>([]);
  evaluators = signal<EvaluatorEntity[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.getDashboardUC.execute().subscribe(data => {
      // Asumiendo que data contiene tanto los protocolos pendientes como la lista de evaluadores
      this.dashboardData.set(data.pendingProtocols.map((p: any) => ({
        ...p,
        selectedEvaluators: []
      })));
      this.evaluators.set(data.evaluators);
    });
  }

  onSuggest(item: any) {
    this.suggestUC.execute(item.protocolId, item.selectedEvaluators).subscribe(() => {
      this.snackBar.open(`✅ Sugerencia para ${item.protocolCode} enviada`, 'Cerrar', { duration: 3000 });
      this.loadData();
    });
  }
}
