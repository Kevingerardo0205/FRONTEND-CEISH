import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';

interface UrgentItem {
  id: string;
  code: string;
  title: string;
  daysRemaining: number;
  badgeClass: string;
}

@Component({
  selector: 'app-deadlines-radar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, ProtocolCodePipe],
  template: `
    <div class="radar-card shadow-soft">
      <div class="card-header">
        <mat-icon class="icon-radar">radar</mat-icon>
        <h3>Radar de Vencimientos</h3>
      </div>

      <div class="radar-items" *ngIf="urgentItems().length > 0; else emptyRadar">
        <div 
          *ngFor="let item of urgentItems()" 
          class="radar-item" 
          [routerLink]="['/dashboard/protocols/workspace', item.id]">
          
          <div class="item-meta">
            <span class="code">{{ item.code | protocolCode }}</span>
            <span class="days-badge" [ngClass]="item.badgeClass">
              {{ item.daysRemaining < 0 ? 'Vencido' : (item.daysRemaining === 0 ? 'Hoy' : item.daysRemaining + 'd') }}
            </span>
          </div>
          
          <p class="title" [matTooltip]="item.title">{{ item.title }}</p>
        </div>
      </div>

      <ng-template #emptyRadar>
        <div class="empty-radar">
          <mat-icon>verified</mat-icon>
          <p>Sin plazos críticos esta semana</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .radar-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 1.25rem;
      color: #9d174d;

      .icon-radar {
        font-size: 22px;
        width: 22px;
        height: 22px;
        animation: radar-sweep 4s linear infinite;
      }

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
      }
    }

    .radar-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radar-item {
      border: 1px solid #f1f5f9;
      background: #f8fafc;
      border-radius: 12px;
      padding: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #fecaca;
        background: #fffdfd;
        transform: scale(1.01);
      }

      .item-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
        
        .code {
          font-weight: 800;
          color: #003366;
          font-size: 0.72rem;
        }

        .days-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;

          &.vencido { background: #fee2e2; color: #dc2626; }
          &.hoy { background: #fffbeb; color: #d97706; }
          &.urgente { background: #fffbeb; color: #ca8a04; }
        }
      }

      .title {
        margin: 0;
        font-size: 0.82rem;
        font-weight: 600;
        color: #334155;
        line-height: 1.35;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }

    .empty-radar {
      padding: 2.5rem 1rem;
      text-align: center;
      color: #94a3b8;
      border: 2px dashed #f1f5f9;
      border-radius: 12px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #10b981;
        opacity: 0.6;
        margin-bottom: 0.5rem;
      }

      p {
        font-weight: 700;
        font-size: 0.78rem;
        margin: 0;
      }
    }

    @keyframes radar-sweep {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class DeadlinesRadarComponent {
  protocols = input.required<ProtocolEntity[]>();

  urgentItems = computed((): UrgentItem[] => {
    const list = this.protocols();
    const now = new Date();
    
    return list
      .filter(p => p.deadline)
      .map(p => {
        const deadline = new Date(p.deadline!);
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let badgeClass = 'urgente';
        if (diffDays < 0) badgeClass = 'vencido';
        else if (diffDays === 0) badgeClass = 'hoy';

        return {
          id: p.id,
          code: p.code || 'PENDIENTE',
          title: p.title,
          daysRemaining: diffDays,
          badgeClass
        };
      })
      .filter(item => item.daysRemaining <= 7) // Solo muestra plazos dentro de los próximos 7 días o ya vencidos
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  });
}
