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
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container animate-fade-in">
      <header class="page-header">
        <div class="title-section">
          <h1>Dashboard de Evaluaciones</h1>
          <p>Gestión de carga y sugerencias de evaluadores</p>
        </div>
        
        <div class="filters-section">
          <mat-form-field appearance="outline" class="profile-filter">
            <mat-label>Filtrar por Perfil</mat-label>
            <mat-select [(ngModel)]="selectedProfile" (selectionChange)="loadData()">
              <mat-option [value]="undefined">Todos los Perfiles</mat-option>
              <mat-option *ngFor="let profile of profiles()" [value]="profile.id">
                {{ profile.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          
          <div class="role-badge" [ngClass]="userRole().toLowerCase()">
            {{ userRole() }}
          </div>
        </div>
      </header>

      <div class="table-card shadow-soft">
        <div class="table-info-header p-3" *ngIf="!selectedProfile">
          <mat-icon color="primary">info</mat-icon>
          <span>Mostrando listado general de protocolos para asignación</span>
        </div>

        <table mat-table [dataSource]="dashboardData()">
          
          <ng-container matColumnDef="protocol">
            <th mat-header-cell *matHeaderCellDef>Protocolo / Proyecto</th>
            <td mat-cell *matCellDef="let p">
              <div class="protocol-info">
                <span class="code">{{ (p.protocolCode || p.code) | protocolCode }}</span>
                <span class="title">{{ p.protocolTitle || p.title }}</span>
                <span class="investigator">Inv: {{ p.investigator || 'Pendiente' }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="evaluators">
            <th mat-header-cell *matHeaderCellDef>Sugerir Evaluadores por Perfil</th>
            <td mat-cell *matCellDef="let p">
              <div class="selector-container">
                <mat-form-field appearance="outline" class="evaluator-select">
                  <mat-select multiple placeholder="Seleccione perfiles de evaluadores" [(ngModel)]="p.selectedEvaluators">
                    <mat-option *ngFor="let profile of profiles()" [value]="profile.id">
                      <div class="eval-option">
                        <span class="name">{{ profile.name }}</span>
                        <span class="meta">Perfil de Evaluador</span>
                      </div>
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
                <mat-icon>send</mat-icon>
                Enviar Sugerencia
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <div class="empty-state" *ngIf="dashboardData().length === 0">
          <mat-icon>assignment_late</mat-icon>
          <p>No hay protocolos pendientes de asignación.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { 
      margin-bottom: 2rem; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .filters-section { display: flex; align-items: center; gap: 1rem; }
    .profile-filter { width: 250px; }
    
    .role-badge {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.8rem;
      &.presidente { background: #efebe9; color: #4e342e; }
      &.presidenta { background: #efebe9; color: #4e342e; }
    }
    
    .table-card { background: white; border-radius: 16px; overflow: hidden; }
    .table-info-header { background: #f0f9ff; color: #0369a1; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid #e0f2fe; }
    .protocol-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 1rem 0;
      .code { font-weight: 800; color: #003366; font-size: 0.8rem; }
      .title { font-size: 0.95rem; color: #1e293b; font-weight: 600; line-height: 1.2; }
      .investigator { font-size: 0.75rem; color: #64748b; }
    }
    
    .eval-option {
      display: flex;
      flex-direction: column;
      .name { font-weight: 600; font-size: 0.9rem; }
      .meta { font-size: 0.75rem; color: #64748b; }
    }
    
    .evaluator-select { width: 100%; margin: 8px 0; }
    table { width: 100%; }
    th { background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; padding: 1rem; }
    td { padding: 0.5rem 1rem; vertical-align: middle; }
    
    .empty-state {
      padding: 4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #94a3b8;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }
    }
  `]
})
export class AssignmentPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);
  private getDashboardUC = inject(GetEvaluatorsDashboardUseCase);
  private suggestUC = inject(SuggestEvaluatorsUseCase);
  private getProfilesUC = inject(GetEvaluationProfilesUseCase);
  private getAllProtocolsUC = inject(GetAllProtocolsUseCase);

  userRole = computed(() => this.authFacade.currentUser()?.rol || 'PRESIDENTE');

  displayedColumns = ['protocol', 'evaluators', 'actions'];
  
  dashboardData = signal<any[]>([]);
  evaluators = signal<EvaluatorEntity[]>([]);
  profiles = signal<any[]>([]);
  selectedProfile = undefined;

  ngOnInit() {
    this.loadProfiles();
    this.loadData();
  }

  loadProfiles() {
    this.getProfilesUC.execute().subscribe(profiles => {
      this.profiles.set(profiles);
    });
  }

  loadData() {
    if (!this.selectedProfile) {
      // Si no hay perfil, mostramos todos los protocolos del sistema
      this.getAllProtocolsUC.execute().subscribe(protocols => {
        this.dashboardData.set(protocols.map(p => ({
          ...p,
          protocolId: p.id,
          protocolCode: p.code,
          protocolTitle: p.title,
          selectedEvaluators: []
        })));
        
        // Cargamos evaluadores base
        this.getDashboardUC.execute().subscribe(data => {
          if (data.evaluators) this.evaluators.set(data.evaluators);
        });
      });
    } else {
      this.getDashboardUC.execute(this.selectedProfile).subscribe(data => {
        if (data.pendingProtocols) {
          this.dashboardData.set(data.pendingProtocols.map((p: any) => ({
            ...p,
            selectedEvaluators: []
          })));
        }
        if (data.evaluators) {
          this.evaluators.set(data.evaluators);
        }
      });
    }
  }

  onSuggest(item: any) {
    const pId = item.protocolId || item.id;
    const pCode = item.protocolCode || item.code;
    this.suggestUC.execute(pId, item.selectedEvaluators).subscribe(() => {
      this.snackBar.open(`✅ Sugerencia para ${pCode} enviada a Secretaría`, 'Cerrar', { duration: 3000 });

      this.loadData();
    });
  }
}
