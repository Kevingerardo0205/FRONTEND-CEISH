import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorEntity, EvaluatorProfile } from '@domain/entities/evaluator.entity';

@Component({
  selector: 'app-evaluator-load',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <div class="load-container">
      <div class="filter-header">
        <h3>Carga de Evaluadores</h3>
        <mat-form-field appearance="outline" class="profile-filter">
          <mat-label>Filtrar por Perfil</mat-label>
          <mat-select (selectionChange)="onFilterChange($event.value)" placeholder="Todos los perfiles">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="JURIDICO">Jurídico</mat-option>
            <mat-option value="SALUD">Salud</mat-option>
            <mat-option value="METODOLOGIA">Metodología</mat-option>
            <mat-option value="SOCIEDAD_CIVIL">Sociedad Civil</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="filteredEvaluators()">
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Evaluador</th>
          <td mat-cell *matCellDef="let ev">{{ ev.nombre }}</td>
        </ng-container>

        <ng-container matColumnDef="perfil">
          <th mat-header-cell *matHeaderCellDef>Perfil</th>
          <td mat-cell *matCellDef="let ev">
            <mat-chip-set>
              <mat-chip [ngClass]="ev.perfil.toLowerCase()">
                {{ ev.perfil | titlecase }}
              </mat-chip>
            </mat-chip-set>
          </td>
        </ng-container>

        <ng-container matColumnDef="carga">
          <th mat-header-cell *matHeaderCellDef>Protocolos Activos</th>
          <td mat-cell *matCellDef="let ev">
            <div class="load-indicator">
              <span class="count">{{ ev.cargaActiva }}</span>
              <div class="progress-bar">
                <div class="fill" [style.width.%]="ev.cargaActiva * 20" 
                     [ngClass]="{'high': ev.cargaActiva >= 5, 'medium': ev.cargaActiva >= 3}"></div>
              </div>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .load-container { background: white; border-radius: 16px; padding: 1.5rem; }
    .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .profile-filter { width: 200px; }
    table { width: 100%; }
    
    .load-indicator { display: flex; align-items: center; gap: 1rem; }
    .count { font-weight: bold; min-width: 20px; }
    .progress-bar { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; background: #10b981; transition: width 0.3s; }
    .fill.medium { background: #f59e0b; }
    .fill.high { background: #ef4444; }

    mat-chip {
      font-size: 10px; font-weight: 700;
      &.juridico { background: #e0f2fe; color: #0369a1; }
      &.salud { background: #f0fdf4; color: #15803d; }
      &.metodologia { background: #fff7ed; color: #c2410c; }
      &.sociedad_civil { background: #fdf2f8; color: #be185d; }
    }
  `]
})
export class EvaluatorLoadComponent implements OnInit {
  private evaluatorRepo = inject(IEvaluatorRepositoryPort);
  
  evaluators = signal<EvaluatorEntity[]>([]);
  selectedProfile = signal<EvaluatorProfile | null>(null);
  
  displayedColumns = ['nombre', 'perfil', 'carga'];

  filteredEvaluators = signal<EvaluatorEntity[]>([]);

  ngOnInit() {
    this.evaluatorRepo.getEvaluatorsWithLoad().subscribe(data => {
      this.evaluators.set(data);
      this.applyFilter();
    });
  }

  onFilterChange(profile: EvaluatorProfile | null) {
    this.selectedProfile.set(profile);
    this.applyFilter();
  }

  private applyFilter() {
    const profile = this.selectedProfile();
    if (!profile) {
      this.filteredEvaluators.set(this.evaluators());
    } else {
      this.filteredEvaluators.set(this.evaluators().filter(e => e.perfil === profile));
    }
  }
}
