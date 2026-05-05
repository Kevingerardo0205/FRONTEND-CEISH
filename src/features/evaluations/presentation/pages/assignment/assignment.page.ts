import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Asignación de Evaluadores</h1>
        <p>Seleccione los revisores para los protocolos validados documentalmente</p>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="pendingProtocols()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo</th>
            <td mat-cell *matCellDef="let p">
              <div class="protocol-info">
                <span class="code">{{ p.code | protocolCode }}</span>
                <span class="title">{{ p.title }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let p">{{ p.type }}</td>
          </ng-container>

          <ng-container matColumnDef="evaluators">
            <th mat-header-cell *matHeaderCellDef>Asignar Evaluadores</th>
            <td mat-cell *matCellDef="let p">
              <mat-form-field appearance="outline" class="evaluator-select">
                <mat-select multiple placeholder="Seleccione 2-3 evaluadores" [(value)]="p.assignedEvaluators">
                  <mat-option *ngFor="let ev of evaluators()" [value]="ev.id">
                    {{ ev.name }} (Carga: {{ ev.currentLoad }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button mat-flat-button color="primary" 
                      [disabled]="!p.assignedEvaluators?.length"
                      (click)="onAssign(p)">
                Confirmar
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
    .page-header { margin-bottom: 2rem; }
    .table-card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .protocol-info {
      display: flex;
      flex-direction: column;
      .code { font-weight: 700; color: #003366; font-size: 0.8rem; }
      .title { font-size: 0.9rem; color: #475569; }
    }
    .evaluator-select { width: 100%; margin: 10px 0; }
    table { width: 100%; }
    th { padding: 1rem; }
    td { padding: 1rem; }
  `]
})
export class AssignmentPage implements OnInit {
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['protocol', 'type', 'evaluators', 'actions'];
  
  pendingProtocols = signal<any[]>([
    { id: '1', code: '2026-IO-001', title: 'Estudio de prevalencia de diabetes', type: 'IO', assignedEvaluators: [] },
    { id: '2', code: '2026-EC-002', title: 'Ensayo clínico Vacuna X', type: 'EC', assignedEvaluators: [] }
  ]);

  evaluators = signal<any[]>([
    { id: 'ev1', name: 'Dr. Marco Vinicio', currentLoad: 2 },
    { id: 'ev2', name: 'Dra. Elena Naranjo', currentLoad: 5 },
    { id: 'ev3', name: 'Dr. Carlos Mendez', currentLoad: 1 }
  ]);

  ngOnInit() {}

  onAssign(protocol: any) {
    this.snackBar.open(`Protocolo ${protocol.code} asignado correctamente`, 'Cerrar', { duration: 3000 });
    // Aquí iría la llamada al caso de uso
    this.pendingProtocols.update(list => list.filter(p => p.id !== protocol.id));
  }
}
