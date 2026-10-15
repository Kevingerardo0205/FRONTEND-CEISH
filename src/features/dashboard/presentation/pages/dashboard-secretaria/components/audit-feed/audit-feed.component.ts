import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';
import { AuditLog } from '@features/audit/domain/entities/audit.entity';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-audit-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="feed-card shadow-soft">
      <div class="card-header">
        <mat-icon color="primary">history</mat-icon>
        <h3>Actividad Reciente</h3>
      </div>

      <div class="feed-items" *ngIf="logs().length > 0; else emptyFeed">
        <div *ngFor="let log of logs() | slice:0:5" class="feed-item">
          <div class="item-icon" [ngClass]="log.action">
            <mat-icon>{{ getIcon(log.action) }}</mat-icon>
          </div>
          
          <div class="item-content">
            <p class="description">
              <strong>{{ log.userName }}</strong> {{ getActionText(log) }}
            </p>
            <span class="timestamp">{{ log.timestamp | date:'shortTime' }}</span>
          </div>
        </div>
      </div>

      <ng-template #emptyFeed>
        <div class="empty-feed">
          <p>Cargando flujo de eventos...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .feed-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 1.25rem;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
      }
    }

    .feed-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feed-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .item-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.CREATE { background: #e0f2fe; color: #0369a1; }
      &.UPDATE { background: #fff7ed; color: #c2410c; }
      &.DELETE { background: #fee2e2; color: #991b1b; }
      &.APPROVE { background: #f0fdf4; color: #166534; }
      &.REJECT { background: #fef2f2; color: #dc2626; }
    }

    .item-content {
      display: flex;
      flex-direction: column;
      flex: 1;

      .description {
        margin: 0;
        font-size: 0.78rem;
        color: #334155;
        line-height: 1.35;
        font-weight: 500;
      }

      .timestamp {
        font-size: 0.65rem;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 2px;
      }
    }

    .empty-feed {
      padding: 1rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
    }
  `]
})
export class AuditFeedComponent implements OnInit {
  private auditUseCase = inject(AuditUseCase);

  logs = signal<AuditLog[]>([]);

  ngOnInit() {
    this.auditUseCase.getLogs({}).pipe(
      catchError(() => of([]))
    ).subscribe(data => this.logs.set(data));
  }

  getIcon(action: string): string {
    switch (action) {
      case 'CREATE': return 'add';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      case 'APPROVE': return 'check_circle';
      case 'REJECT': return 'cancel';
      default: return 'info';
    }
  }

  getActionText(log: AuditLog): string {
    const act = log.action.toUpperCase();
    if (act === 'CREATE') return `ingresó el protocolo ${log.recordId}`;
    if (act === 'UPDATE') return `actualizó requisitos en ${log.recordId}`;
    if (act === 'APPROVE') return `oficializó la recepción de ${log.recordId}`;
    if (act === 'REJECT') return `observó y devolvió ${log.recordId}`;
    return `modificó el registro ${log.recordId}`;
  }
}
