import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';

@Component({
  selector: 'app-protocol-validation-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, StatCardComponent],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Header Seccion -->
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Secretaría / Validación</div>
          <h1 class="page-title">Validación Documental</h1>
          <p class="page-subtitle">Revise y valide la integridad de los protocolos ingresados (PET 2023)</p>
        </div>
        <div class="header-actions">
           <button mat-stroked-button color="primary" class="refresh-btn">
             <mat-icon>refresh</mat-icon>
             Actualizar
           </button>
        </div>
      </div>

      <!-- Métricas Rápidas -->
      <div class="stats-grid mb-4">
        <app-stat-card label="Pendientes" [value]="2" icon="pending_actions" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Observados" [value]="1" icon="assignment_late" color="#ef4444"></app-stat-card>
        <app-stat-card label="Validados Hoy" [value]="5" icon="task_alt" color="#10b981"></app-stat-card>
        <app-stat-card label="Total Mes" [value]="24" icon="assessment" color="#2563eb"></app-stat-card>
      </div>

      <!-- Lista de Protocolos -->
      <div class="content-card shadow-soft">
        <div class="table-toolbar p-3 d-flex justify-content-between align-items-center">
          <h2 class="section-title m-0">Protocolos por Validar</h2>
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Filtrar por código o título...">
          </div>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="protocols()" class="modern-table">
            
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef> Fecha Envío </th>
              <td mat-cell *matCellDef="let p"> 
                <div class="date-cell">
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ p.submissionDate | date:'dd MMM, yyyy' }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="titulo">
              <th mat-header-cell *matHeaderCellDef> Información del Proyecto </th>
              <td mat-cell *matCellDef="let p"> 
                <div class="project-cell">
                  <span class="main-title">{{ p.title }}</span>
                  <div class="investigator-info">
                    <mat-icon>person</mat-icon>
                    <span>{{ p.investigator }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef> Tipo de Estudio </th>
              <td mat-cell *matCellDef="let p"> 
                <span class="type-badge" [ngClass]="p.type.toLowerCase()">
                  {{ p.type === 'IO' ? 'Observacional' : p.type === 'EC' ? 'Ensayo Clínico' : 'Intervención' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-end"> Gestión </th>
              <td mat-cell *matCellDef="let p" class="text-end">
                <button mat-flat-button color="primary" class="review-btn" [routerLink]="['/dashboard/protocols/validation/detail', p.id]">
                  <mat-icon>verified</mat-icon>
                  Validar
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1rem; }

    .breadcrumb-chip {
      background: rgba(0, 51, 102, 0.05);
      color: #003366;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .page-title { font-size: 1.85rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .page-subtitle { color: #64748b; font-size: 0.95rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
    }

    .content-card {
      background: white;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: hidden;
    }

    .table-toolbar {
      border-bottom: 1px solid #f1f5f9;
      .section-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    }

    .search-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 300px;
      
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
      input { border: none; background: transparent; outline: none; font-size: 0.85rem; width: 100%; }
    }

    .modern-table {
      width: 100%;
      th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 1.25rem 1rem; }
      td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; }
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-weight: 600;
      font-size: 0.85rem;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    }

    .project-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .main-title { font-weight: 700; color: #1e293b; font-size: 0.9rem; line-height: 1.4; }
      .investigator-info {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #94a3b8;
        font-size: 0.75rem;
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
      }
    }

    .type-badge {
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      
      &.io { background: #eff6ff; color: #2563eb; }
      &.ec { background: #fff7ed; color: #f59e0b; }
      &.ei { background: #f0fdf4; color: #10b981; }
    }

    .review-btn {
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationListPage {
  displayedColumns = ['fecha', 'titulo', 'tipo', 'acciones'];
  
  protocols = signal([
    { id: '1', title: 'Prevalencia de trastornos de ansiedad en estudiantes de medicina durante el internado rotativo', investigator: 'Dra. Ana María Lucía', type: 'IO', submissionDate: new Date() },
    { id: '2', title: 'Estudio comparativo de la eficacia de dos protocolos de rehabilitación post-infarto', investigator: 'Dr. Roberto Carlos Espinoza', type: 'EC', submissionDate: new Date() }
  ]);
}
