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
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';

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
          <h1>Asignación de Evaluadores</h1>
          <p>{{ subtitle() }}</p>
        </div>
        <div class="role-badge" [ngClass]="userRole().toLowerCase()">
          {{ userRole() }}
        </div>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="pendingProtocols()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo</th>
            <td mat-cell *matCellDef="let p">
              <div class="protocol-info">
                <span class="code">{{ p.code | protocolCode }}</span>
                <span class="title">{{ p.title }}</span>
                <mat-chip-listbox>
                  <mat-chip [color]="p.type === 'EC' ? 'warn' : 'accent'" selected>
                    {{ p.type }}
                  </mat-chip>
                </mat-chip-listbox>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
               <span class="status-indicator" [ngClass]="p.suggestedEvaluators?.length ? 'suggested' : 'pending'">
                 {{ p.suggestedEvaluators?.length ? 'Sugerencia Enviada' : 'Pendiente Asignación' }}
               </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="evaluators">
            <th mat-header-cell *matHeaderCellDef>Evaluadores</th>
            <td mat-cell *matCellDef="let p">
              <div *ngIf="isPresidenta()" class="selector-container">
                <mat-form-field appearance="outline" class="evaluator-select">
                  <mat-select multiple placeholder="Seleccione 2-3 evaluadores" [(ngModel)]="p.selectedEvaluators">
                    <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                      {{ ev.nombre }} ({{ ev.perfil }}) - Carga: {{ ev.cargaActiva }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div *ngIf="isSecretaria()" class="selection-view">
                <div class="suggested-list" *ngIf="p.suggestedEvaluators?.length">
                  <strong>Sugeridos:</strong>
                  <mat-chip-set>
                    <mat-chip *ngFor="let id of p.suggestedEvaluators">
                      {{ getEvaluatorName(id) }}
                    </mat-chip>
                  </mat-chip-set>
                </div>
                <mat-form-field appearance="outline" class="evaluator-select">
                  <mat-select multiple placeholder="Confirmar evaluadores" [(ngModel)]="p.selectedEvaluators">
                    <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                      {{ ev.nombre }} ({{ ev.perfil }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="deadline">
            <th mat-header-cell *matHeaderCellDef>Plazo (Días)</th>
            <td mat-cell *matCellDef="let p">
              <mat-form-field *ngIf="isSecretaria()" appearance="outline" class="deadline-input">
                <input matInput type="number" [(ngModel)]="p.deadline" placeholder="Días">
              </mat-form-field>
              <span *ngIf="isPresidenta()">{{ p.type === 'IO' ? 8 : 15 }} (Auto)</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button *ngIf="isPresidenta()" mat-flat-button color="primary" 
                      [disabled]="!p.selectedEvaluators?.length"
                      (click)="onSuggest(p)">
                Enviar Sugerencia
              </button>
              <button *ngIf="isSecretaria()" mat-flat-button color="warn" 
                      [disabled]="!p.selectedEvaluators?.length || !p.deadline"
                      (click)="onConfirm(p)">
                Confirmar y Notificar
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>
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
      &.presidenta { background: #efebe9; color: #4e342e; }
      &.secretaria { background: #f3e5f5; color: #7b1fa2; }
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
    .status-indicator {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      &.pending { background: #fff7ed; color: #c2410c; }
      &.suggested { background: #f0fdf4; color: #15803d; }
    }
    .evaluator-select { width: 100%; margin: 10px 0; }
    .deadline-input { width: 80px; }
    .suggested-list {
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      .chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
    }
    table { width: 100%; }
    th { background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; padding: 1rem; }
    td { padding: 0.5rem 1rem; vertical-align: middle; }
  `]
})
export class AssignmentPage implements OnInit {
  private snackBar = inject(MatSnackBar);
  private evaluatorRepo = inject(IEvaluatorRepositoryPort);
  private authFacade = inject(AuthFacade);

  user = this.authFacade.currentUser;
  userRole = computed(() => this.user()?.rol?.toUpperCase() || 'SECRETARIA');

  isPresidenta = computed(() => this.userRole() === 'PRESIDENTA');
  isSecretaria = computed(() => this.userRole() === 'SECRETARIA');

  subtitle = computed(() => this.isPresidenta() 
    ? 'Proponga los evaluadores según la carga y especialidad' 
    : 'Valide y confirme las sugerencias de evaluadores enviadas por la Presidenta');

  displayedColumns = computed(() => {
    const base = ['protocol', 'status', 'evaluators'];
    if (this.isSecretaria()) base.push('deadline');
    base.push('actions');
    return base;
  });
  
  pendingProtocols = signal<any[]>([]);
  evaluators = signal<EvaluatorEntity[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.evaluatorRepo.getEvaluatorsWithLoad().subscribe(evs => this.evaluators.set(evs));
    this.evaluatorRepo.getProtocolsForAssignment().subscribe(protos => {
      this.pendingProtocols.set(protos.map(p => ({
        ...p,
        selectedEvaluators: p.suggestedEvaluators || [],
        deadline: p.type === 'IO' ? 8 : 15
      })));
    });
  }

  getEvaluatorName(id: string): string {
    return this.evaluators().find(e => e.id === id)?.nombre || 'Desconocido';
  }

  onSuggest(protocol: any) {
    this.evaluatorRepo.suggestEvaluators(protocol.id, protocol.selectedEvaluators).subscribe(() => {
      this.snackBar.open(`✅ Sugerencia para ${protocol.code} enviada a Secretaria`, 'Cerrar', { duration: 3000 });
      this.loadData();
    });
  }

  onConfirm(protocol: any) {
    if (!protocol.selectedEvaluators?.length) {
      this.snackBar.open('⚠️ Debe seleccionar al menos un evaluador', 'Cerrar', { duration: 3000 });
      return;
    }
    this.evaluatorRepo.confirmAssignment(protocol.id, protocol.selectedEvaluators, protocol.deadline).subscribe(() => {
      this.snackBar.open(`✅ Asignación para ${protocol.code} confirmada. Notificaciones enviadas a evaluadores.`, 'Cerrar', { duration: 4000 });
      this.pendingProtocols.update(list => list.filter(p => p.id !== protocol.id));
    });
  }
}
