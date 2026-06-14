import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { resolveEstado } from '@domain/catalogs/estado.alias';
import { StatCardComponent } from '../../../../dashboard/presentation/components/stat-card/stat-card.component';

import { ProtocolStatusLabelPipe } from '@shared/pipes/protocol-status-label.pipe';
import { ProtocolStatusClassPipe } from '@shared/pipes/protocol-status-class.pipe';

@Component({
  selector: 'app-protocol-reception-new',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    FormsModule,
    StatCardComponent,
    ProtocolStatusLabelPipe,
    ProtocolStatusClassPipe
  ],
  template: `
    <div class="dashboard-admin-container animate-fade-in">
      
      <header class="main-header">
        <div class="header-info">
          <div class="breadcrumb-chip">CEISH / Recepción / Nueva</div>
          <h1>Recepción de Protocolos</h1>
          <p>Gestione el ingreso oficial de protocolos y valide requisitos técnicos</p>
        </div>
      </header>

      <!-- KPI Section (Same as User Management) -->
      <section class="kpi-grid mb-5">
        <app-stat-card label="Por Recibir" [value]="protocols().length" icon="inbox" color="#003366"></app-stat-card>
        <app-stat-card label="En Revisión" value="-" icon="fact_check" color="#f59e0b"></app-stat-card>
        <app-stat-card label="Ingresados Hoy" value="0" icon="task_alt" color="#10b981"></app-stat-card>
        <app-stat-card label="Tiempo Promedio" value="2h" icon="speed" color="#6366f1"></app-stat-card>
      </section>

      <!-- Management Section -->
      <div class="management-layout single-column">
        <main class="table-section shadow-soft">
          <div class="section-toolbar">
            <div class="title-group">
              <h2 class="section-title">Nuevos Ingresos</h2>
            </div>
            <div class="spacer"></div>
            <div class="search-mini">
              <mat-icon>search</mat-icon>
              <input 
                type="text" 
                placeholder="Buscar por código o título..." 
                [(ngModel)]="searchQuery" 
                (keyup)="onSearch()">
            </div>
          </div>
          
          <div class="table-responsive">
            <table mat-table [dataSource]="filteredProtocols()" class="modern-table">
              
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef> CÓDIGO TÉCNICO </th>
                <td mat-cell *matCellDef="let p"> 
                  <span class="technical-code-badge">{{ p.code || 'PENDIENTE' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef> ENVÍO </th>
                <td mat-cell *matCellDef="let p"> 
                  <div class="date-cell">
                    <span class="date-val">{{ p.submissionDate | date:'dd/MM/yyyy' }}</span>
                    <span class="time-val">Hace poco</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="titulo">
                <th mat-header-cell *matHeaderCellDef> INFORMACIÓN DEL PROYECTO </th>
                <td mat-cell *matCellDef="let p"> 
                  <div class="project-cell">
                    <span class="main-title">{{ p.title }}</span>
                    <span class="investigator-info">{{ p.investigator || 'Investigador Principal' }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef> ESTADO </th>
                <td mat-cell *matCellDef="let p"> 
                  <span class="status-badge" [ngClass]="p.status | protocolStatusClass">
                    {{ p.status | protocolStatusLabel }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="text-end"> GESTIÓN </th>
                <td mat-cell *matCellDef="let p" class="text-end">
                  <button mat-flat-button color="primary" class="review-btn" [routerLink]="['/dashboard/protocols/validation/detail', p.id]">
                    <mat-icon>verified</mat-icon>
                    Iniciar Validación
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
            </table>

            <div *ngIf="filteredProtocols().length === 0" class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>No hay protocolos pendientes de recepción oficial.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./protocol-reception-new.page.scss']
})
export class ProtocolReceptionNewPage implements OnInit {
  private protocolRepo = inject(IProtocolRepositoryPort);

  displayedColumns = ['codigo', 'fecha', 'titulo', 'estado', 'acciones'];
  
  protocols = signal<ProtocolEntity[]>([]);
  filteredProtocols = signal<ProtocolEntity[]>([]);
  searchQuery = '';

  ngOnInit() {
    this.loadProtocols();
  }

  loadProtocols() {
    this.protocolRepo.getReceptionProtocols().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        console.log(`[ProtocolReceptionNewPage] ${list.length} protocolos cargados.`);
        
        const initialProtocols = list.filter(p => {
          const core = resolveEstado(p.status);
          return core && core.categoria === 'RECEPCION' && core.code !== 'COMPLETO' && core.code !== 'ARCHIVADO_VENCIMIENTO';
        });
        
        this.protocols.set(initialProtocols);
        this.filteredProtocols.set(initialProtocols);
      },
      error: (err) => {
        console.error('[ProtocolReceptionNewPage] Error:', err);
        this.protocols.set([]);
        this.filteredProtocols.set([]);
      }
    });
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredProtocols.set(this.protocols());
      return;
    }

    const filtered = this.protocols().filter(p => 
      p.code?.toLowerCase().includes(query) || 
      p.title.toLowerCase().includes(query)
    );
    this.filteredProtocols.set(filtered);
  }
}
