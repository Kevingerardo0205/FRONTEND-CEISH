import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

@Component({
  selector: 'app-protocol-validation-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink],
  template: `
    <div class="validation-container">
      <header class="page-header">
        <div class="title-area">
          <h1>Validación Documental</h1>
          <p>Bandeja de protocolos pendientes de revisión técnica (PET 2023)</p>
        </div>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="protocols()">
          
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Envío </th>
            <td mat-cell *matCellDef="let p"> {{ p.submissionDate | date:'shortDate' }} </td>
          </ng-container>

          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef> Título del Proyecto </th>
            <td mat-cell *matCellDef="let p"> 
              <div class="title-cell">
                <span class="main-title">{{ p.title }}</span>
                <span class="sub-info">{{ p.investigator }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let p"> 
              <mat-chip-set>
                <mat-chip class="type-chip" [ngClass]="p.type.toLowerCase()">{{ p.type }}</mat-chip>
              </mat-chip-set>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right"> Gestión </th>
            <td mat-cell *matCellDef="let p" class="text-right">
              <button mat-flat-button class="review-btn" [routerLink]="['/dashboard/protocols/validation/detail', p.id]">
                <mat-icon>fact_check</mat-icon>
                Revisar
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
    .validation-container { animation: fadeIn 0.4s ease-out; }
    
    .page-header {
      margin-bottom: 2.5rem;
      h1 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #003366; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .table-card {
      background: white;
      border-radius: 24px;
      padding: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }

    table { width: 100%; }

    th { 
      color: #94a3b8; 
      font-size: 0.75rem; 
      text-transform: uppercase; 
      font-weight: 700; 
      padding: 1.5rem 1rem;
    }

    td { padding: 1.5rem 1rem; border-bottom: 1px solid #f1f5f9; }

    .title-cell {
      display: flex;
      flex-direction: column;
      .main-title { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
      .sub-info { font-size: 0.75rem; color: #94a3b8; }
    }

    .type-chip {
      &.io { background: #e0f2f1; color: #00796b; }
      &.ei { background: #e3f2fd; color: #1565c0; }
      &.ec { background: #fff3e0; color: #e65100; }
    }

    .review-btn {
      background-color: #003366;
      color: white;
      border-radius: 10px;
      font-weight: 600;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .text-right { text-align: right; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProtocolValidationListPage {
  displayedColumns = ['fecha', 'titulo', 'tipo', 'acciones'];
  
  // Mock data for display
  protocols = signal([
    { id: '1', title: 'Impacto del COVID-19 en la salud mental docente', investigator: 'Dra. Ana Lucía', type: 'IO', submissionDate: new Date() },
    { id: '2', title: 'Ensayo clínico fase III: Nuevo tratamiento hipertensión', investigator: 'Ing. Roberto Carlos', type: 'EC', submissionDate: new Date() }
  ]);
}
