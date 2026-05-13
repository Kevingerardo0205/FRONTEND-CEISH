import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloResumen } from '../../../domain/dtos/crear-protocolo.dto';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Component({
  selector: 'app-mis-protocolos',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, 
    MatIconModule, RouterModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <div class="dashboard-page">
      <!-- Header Seccion -->
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div class="title-section">
          <div class="breadcrumb-chip">CEISH / Investigador</div>
          <h1 class="page-title">Gestión de Protocolos</h1>
          <p class="page-subtitle">Sigue el estado de tus investigaciones en tiempo real</p>
        </div>
        <button mat-flat-button color="primary" class="new-protocol-btn" routerLink="/investigador/nuevo-protocolo">
          <mat-icon>add</mat-icon>
          <span>Nuevo Registro</span>
        </button>
      </div>

      <!-- Métricas / Stats -->
      <div class="stats-container row g-3 mb-4">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="metric-card total">
            <div class="metric-icon"><mat-icon>folder_special</mat-icon></div>
            <div class="metric-info">
              <span class="label">Total Proyectos</span>
              <span class="value">{{ protocolos.length }}</span>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="metric-card review">
            <div class="metric-icon"><mat-icon>analytics</mat-icon></div>
            <div class="metric-info">
              <span class="label">En Revisión</span>
              <span class="value">{{ getCountByStatus('EN_REVISION_DOCUMENTAL') + getCountByStatus('EN_EVALUACION') }}</span>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="metric-card approved">
            <div class="metric-icon"><mat-icon>verified</mat-icon></div>
            <div class="metric-info">
              <span class="label">Aprobados</span>
              <span class="value">{{ getCountByStatus('APROBADO_DEFINITIVO') + getCountByStatus('APROBADO_CONDICIONADO') }}</span>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="metric-card observed">
            <div class="metric-icon"><mat-icon>feedback</mat-icon></div>
            <div class="metric-info">
              <span class="label">Observados</span>
              <span class="value">{{ getCountByStatus('REQUIERE_CORRECCION') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla / Lista Principal -->
      <div class="content-card mat-elevation-z2">
        <div class="table-toolbar d-flex flex-wrap align-items-center justify-content-between p-3">
          <h2 class="section-title m-0">Mis Investigaciones</h2>
          
          <div class="toolbar-actions d-flex gap-2 align-items-center">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input type="text" placeholder="Buscar por título o código..." (keyup)="applyFilter($event)">
            </div>
            <button mat-icon-button matTooltip="Refrescar lista" (click)="loadProtocolos()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="protocolos" class="modern-table">
            <!-- Código -->
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef> ID Registro </th>
              <td mat-cell *matCellDef="let p"> 
                <div class="code-wrapper">
                  <mat-icon class="code-icon">qr_code</mat-icon>
                  <span class="code-text">{{ p.codigoCeish || 'TRÁMITE' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Título -->
            <ng-container matColumnDef="titulo">
              <th mat-header-cell *matHeaderCellDef> Título del Proyecto </th>
              <td mat-cell *matCellDef="let p"> 
                <div class="project-info py-2">
                  <div class="project-title" [matTooltip]="p.titulo">{{ p.titulo }}</div>
                  <div class="project-meta">
                    <span class="date"><mat-icon>event</mat-icon> {{ p.fechaCreacion | date:'dd MMM, yyyy' }}</span>
                    <span class="type" *ngIf="p.tipoEstudio"><mat-icon>category</mat-icon> {{ p.tipoEstudio }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let p">
                <div class="status-indicator" [ngClass]="getStatusClass(p.estado)">
                  <span class="dot"></span>
                  <span class="text">{{ formatStatus(p.estado) }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Acciones -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-end"> </th>
              <td mat-cell *matCellDef="let p" class="text-end">
                <div class="action-buttons">
                  <button mat-icon-button class="view-btn" [routerLink]="['/investigador/protocolo', p.id]" matTooltip="Ver detalle">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button [matMenuTriggerFor]="menu" class="more-btn">
                    <mat-icon>more_horiz</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu" xPosition="before" class="modern-menu">
                    <button mat-menu-item *ngIf="p.estado === 'REQUIERE_CORRECCION'">
                      <mat-icon color="warn">edit_note</mat-icon>
                      <span>Subir Correcciones</span>
                    </button>
                    <button mat-menu-item *ngIf="p.estado === 'APROBADO_DEFINITIVO'" (click)="solicitarEnmienda(p)">
                      <mat-icon color="primary">edit_document</mat-icon>
                      <span>Solicitar Enmienda</span>
                    </button>
                    <button mat-menu-item *ngIf="p.estado === 'APROBADO_DEFINITIVO'" (click)="reportarEventoAdverso(p)">
                      <mat-icon color="warn">report_problem</mat-icon>
                      <span>Reportar Evento Adverso</span>
                    </button>
                    <mat-divider></mat-divider>
                    <button mat-menu-item>
                      <mat-icon>download</mat-icon>
                      <span>Descargar Acta</span>
                    </button>
                  </mat-menu>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row animate-in"></tr>
          </table>
        </div>

        <!-- Empty State Mejorado -->
        <div *ngIf="protocolos.length === 0" class="empty-state-v2">
          <div class="empty-art">
            <mat-icon>library_add</mat-icon>
            <div class="sparkles"></div>
          </div>
          <h3>Inicia tu primera investigación</h3>
          <p>Aún no tienes protocolos registrados en la plataforma. Comienza ahora mismo registrando tu nuevo proyecto.</p>
          <button mat-flat-button color="primary" routerLink="/investigador/nuevo-protocolo">
            <mat-icon>add</mat-icon> Registrar Nuevo Protocolo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 1.5rem;
      background-color: #f8fafc;
      min-height: calc(100vh - 64px);
    }

    /* Page Header */
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

    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      color: #64748b;
      font-size: 1rem;
      margin-top: 0.25rem;
    }

    .new-protocol-btn {
      height: 48px;
      border-radius: 12px;
      padding: 0 1.5rem;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 51, 102, 0.2);
      mat-icon { margin-right: 8px; }
    }

    /* Stats Cards */
    .metric-card {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all 0.3s ease;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      }

      .metric-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon { font-size: 26px; width: 26px; height: 26px; }
      }

      .metric-info {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
      }

      &.total .metric-icon { background: #eff6ff; color: #2563eb; }
      &.review .metric-icon { background: #fff7ed; color: #f59e0b; }
      &.approved .metric-icon { background: #f0fdf4; color: #10b981; }
      &.observed .metric-icon { background: #fef2f2; color: #ef4444; }
    }

    /* Main Card / Table Area */
    .content-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
    }

    .table-toolbar {
      border-bottom: 1px solid #f1f5f9;
      .section-title { font-size: 1.15rem; font-weight: 700; color: #1e293b; }
    }

    .search-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 280px;
      transition: all 0.2s;

      &:focus-within { border-color: #003366; background: white; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.05); }

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
      input { border: none; background: transparent; outline: none; font-size: 0.9rem; color: #1e293b; width: 100%; }
    }

    /* Table Styling */
    .modern-table {
      width: 100%;
      th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; padding: 16px; border-bottom: 1px solid #f1f5f9; }
      td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .code-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 8px;
      width: fit-content;
      
      .code-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
      .code-text { font-family: 'Fira Code', monospace; font-weight: 700; font-size: 0.8rem; color: #1e293b; }
    }

    .project-info {
      .project-title { font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      .project-meta {
        display: flex;
        gap: 12px;
        color: #94a3b8;
        font-size: 0.75rem;
        span { display: flex; align-items: center; gap: 4px; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
      }
    }

    /* Status Indicators */
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      
      .dot { width: 6px; height: 6px; border-radius: 50%; }

      &.approved { background: #f0fdf4; color: #166534; .dot { background: #10b981; } }
      &.review { background: #eff6ff; color: #1e40af; .dot { background: #3b82f6; } }
      &.correction { background: #fef2f2; color: #991b1b; .dot { background: #ef4444; } }
      &.pending { background: #f8fafc; color: #64748b; .dot { background: #94a3b8; } }
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
      .view-btn { color: #64748b; &:hover { background: #f1f5f9; color: #003366; } }
      .more-btn { color: #94a3b8; }
    }

    /* Empty State */
    .empty-state-v2 {
      padding: 5rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-art {
        position: relative;
        width: 100px;
        height: 100px;
        background: #f1f5f9;
        border-radius: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
      }

      h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.75rem; }
      p { color: #64748b; max-width: 450px; margin-bottom: 2rem; }
    }

    .animate-in { animation: fadeInUp 0.4s ease-out forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MisProtocolosPage implements OnInit {
  private protocoloService = inject(ProtocoloService);
  private notificationBroker = inject(NotificationBrokerService);
  
  protocolos: ProtocoloResumen[] = [];
  displayedColumns: string[] = ['codigo', 'titulo', 'estado', 'acciones'];

  ngOnInit(): void {
    this.loadProtocolos();

    // Tarea 2: Escuchar actualizaciones para refrescar "al instante"
    this.notificationBroker.on('PROTOCOL_STATUS_UPDATED').subscribe(() => {
      this.loadProtocolos();
    });
  }

  loadProtocolos() {
    this.protocoloService.misProtocolos().subscribe(data => {
      this.protocolos = data;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // Implementar lógica de filtrado si es necesario con MatTableDataSource
  }

  getCountByStatus(status: string): number {
    return this.protocolos.filter(p => p.estado === status).length;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'APROBADO_DEFINITIVO':
      case 'APROBADO_CONDICIONADO':
        return 'approved';
      case 'EN_REVISION_DOCUMENTAL':
      case 'EN_REVISION_SECRETARIA':
      case 'EN_EVALUACION':
        return 'review';
      case 'REQUIERE_CORRECCION':
      case 'NO_APROBADO':
        return 'correction';
      default:
        return 'pending';
    }
  }

  formatStatus(estado: string): string {
    if (!estado) return 'Desconocido';
    if (estado === 'EN_REVISION_SECRETARIA') return 'En Revisión (Secretaría)';
    return estado.replace(/_/g, ' ');
  }

  solicitarEnmienda(protocolo: ProtocoloResumen) {
    console.log('Solicitar enmienda para:', protocolo.codigoCeish);
  }

  reportarEventoAdverso(protocolo: ProtocoloResumen) {
    console.log('Reportar EAG para:', protocolo.codigoCeish);
  }

  solicitarRenovacion(protocolo: ProtocoloResumen) {
    console.log('Solicitar renovación para:', protocolo.codigoCeish);
  }
}
