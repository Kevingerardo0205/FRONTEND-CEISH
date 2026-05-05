import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { ProtocolTrailEvent } from '@features/audit/domain/entities/audit.entity';

@Component({
  selector: 'app-protocol-trail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="trail-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Trazabilidad del Protocolo</h1>
          <p class="subtitle">Historial cronológico e inmutable de eventos</p>
        </div>
        <div class="protocol-info">
          <strong>Protocolo ID:</strong> {{ protocolId }}
        </div>
      </header>

      <div class="timeline" *ngIf="events.length > 0; else emptyState">
        <div class="timeline-item" *ngFor="let event of events; let last = last" [ngClass]="event.status">
          <div class="timeline-marker">
            <mat-icon>{{ getStatusIcon(event.status) }}</mat-icon>
          </div>
          
          <mat-card class="timeline-content">
            <mat-card-header>
              <div class="header-main">
                <mat-card-title>{{ event.action }}</mat-card-title>
                <span class="event-date">{{ event.date | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <mat-card-subtitle>Responsable: {{ event.responsible }}</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <p *ngIf="event.comments" class="comments">"{{ event.comments }}"</p>
              
              <div class="documents-list" *ngIf="event.documents">
                <button mat-button *ngFor="let doc of event.documents" class="doc-btn">
                  <mat-icon>attachment</mat-icon> {{ doc.name }}
                </button>
              </div>

              <div class="integrity-footer">
                <mat-icon [matTooltip]="'Verificado con Hash ' + event.integrityHash">verified_user</mat-icon>
                <span class="hash-short">Hash: {{ event.integrityHash.substring(0, 16) }}...</span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <div class="timeline-connector" *ngIf="!last"></div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <mat-icon>history</mat-icon>
          <p>No se han registrado eventos para este protocolo aún.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .trail-container { padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; }
    .header-content h1 { margin: 0; color: #003366; font-size: 2rem; font-weight: 700; }
    .subtitle { color: #6c757d; margin: 0.5rem 0 0; }
    .protocol-info { background: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

    .timeline { position: relative; max-width: 800px; margin: 0 auto; padding-left: 2rem; }
    
    .timeline-item { position: relative; padding-bottom: 2.5rem; }
    
    .timeline-marker {
      position: absolute; left: -24px; top: 0;
      width: 48px; height: 48px; border-radius: 50%;
      background: #fff; border: 2px solid #ddd;
      display: flex; justify-content: center; align-items: center;
      z-index: 2;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: #666; }
    }

    .timeline-connector {
      position: absolute; left: 0; top: 48px;
      width: 2px; height: calc(100% - 24px);
      background: #ddd; z-index: 1;
    }

    .timeline-content {
      border-radius: 12px; border-left: 4px solid #ddd;
      transition: transform 0.2s;
      &:hover { transform: translateX(5px); }
    }

    .header-main { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .event-date { font-size: 0.875rem; color: #666; }
    .comments { font-style: italic; color: #444; margin: 1rem 0; padding-left: 1rem; border-left: 2px solid #eee; }
    
    .documents-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .doc-btn { background: #f1f3f4; font-size: 0.8rem; }

    .integrity-footer {
      margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid #eee;
      display: flex; align-items: center; gap: 0.5rem;
      color: #28a745; font-size: 0.75rem; font-weight: 500;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* Status Styles */
    .COMPLETED .timeline-marker { border-color: #28a745; mat-icon { color: #28a745; } }
    .COMPLETED .timeline-content { border-left-color: #28a745; }
    
    .CONDITIONED .timeline-marker { border-color: #ffc107; mat-icon { color: #ffc107; } }
    .CONDITIONED .timeline-content { border-left-color: #ffc107; }

    .REJECTED .timeline-marker { border-color: #dc3545; mat-icon { color: #dc3545; } }
    .REJECTED .timeline-content { border-left-color: #dc3545; }

    .empty-state { text-align: center; padding: 4rem; color: #999; mat-icon { font-size: 4rem; width: 4rem; height: 4rem; } }
  `]
})
export class ProtocolTrailPage implements OnInit {
  private readonly auditUseCase = inject(AuditUseCase);
  private readonly route = inject(ActivatedRoute);

  protocolId: string = '';
  events: ProtocolTrailEvent[] = [];

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'] || 'PRT-2026-001';
    this.loadTrail();
  }

  loadTrail() {
    this.auditUseCase.getProtocolTrail(this.protocolId).subscribe((events: ProtocolTrailEvent[]) => this.events = events);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'CONDITIONED': return 'warning';
      case 'REJECTED': return 'cancel';
      default: return 'radio_button_checked';
    }
  }
}
