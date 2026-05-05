import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Component({
  selector: 'app-protocol-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-area">
          <h1>Mis Protocolos</h1>
          <p>Gestione y haga seguimiento a sus solicitudes de investigación</p>
        </div>
        <button mat-flat-button color="primary" routerLink="/protocols/create">
          <mat-icon>add</mat-icon>
          Nuevo Protocolo
        </button>
      </header>

      <div class="table-card">
        <table mat-table [dataSource]="protocols()" class="full-width-table">
          
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let protocol">{{ protocol.code | protocolCode }}</td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let protocol" class="title-cell">
              {{ protocol.title }}
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let protocol">{{ protocol.type }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let protocol">
              <mat-chip [ngClass]="getStatusClass(protocol.status)">
                {{ protocol.status }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let protocol">
              <button mat-icon-button [routerLink]="['/protocols/detail', protocol.id]" matTooltip="Ver detalles">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" *ngIf="protocol.status === ProtocolStatus.DRAFT" matTooltip="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="empty-state" *ngIf="!protocols().length">
          <mat-icon>description</mat-icon>
          <p>No se encontraron protocolos registrados.</p>
          <button mat-stroked-button color="primary" routerLink="/protocols/create">Registrar el primero</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.8rem; color: #003366; }
      p { margin: 0.5rem 0 0; color: #64748b; }
    }
    .table-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .full-width-table { width: 100%; }
    .title-cell { max-width: 400px; font-weight: 500; }
    .empty-state {
      padding: 4rem;
      text-align: center;
      color: #94a3b8;
      mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 1rem; }
    }
    
    .status-draft { background: #e2e8f0 !important; color: #475569 !important; }
    .status-submitted { background: #dcfce7 !important; color: #166534 !important; }
    .status-review { background: #fef9c3 !important; color: #854d0e !important; }
  `]
})
export class ProtocolListPage implements OnInit {
  private protocolRepo = inject(IProtocolRepositoryPort);

  protocols = signal<ProtocolEntity[]>([]);
  displayedColumns = ['code', 'title', 'type', 'status', 'actions'];
  ProtocolStatus = ProtocolStatus;

  ngOnInit() {
    this.loadProtocols();
  }

  loadProtocols() {
    this.protocolRepo.getAll().subscribe((data: ProtocolEntity[]) => this.protocols.set(data));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case ProtocolStatus.DRAFT: return 'status-draft';
      case ProtocolStatus.SUBMITTED: return 'status-submitted';
      case ProtocolStatus.UNDER_REVIEW: return 'status-review';
      default: return '';
    }
  }
}
