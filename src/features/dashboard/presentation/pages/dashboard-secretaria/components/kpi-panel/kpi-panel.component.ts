import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SecretariatMetrics } from '../../application/services/secretariat-dashboard.service';

@Component({
  selector: 'app-kpi-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="kpi-grid">
      <!-- 1. Pendientes -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper blue">
          <mat-icon>inbox</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="value">{{ metrics().pendingReception }}</span>
          <span class="label">Pendientes</span>
        </div>
      </div>

      <!-- 2. Incompletos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper orange">
          <mat-icon>feedback</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="value">{{ metrics().observed }}</span>
          <span class="label">Incompletos</span>
        </div>
      </div>

      <!-- 3. Riesgo SLA -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper yellow">
          <mat-icon>alarm</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="value">{{ metrics().slaRisk }}</span>
          <span class="label">En riesgo SLA (<= 3d)</span>
        </div>
      </div>

      <!-- 4. Vencidos -->
      <div class="kpi-card" [class.danger]="metrics().overdue > 0">
        <div class="kpi-icon-wrapper red">
          <mat-icon>report_problem</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="value">{{ metrics().overdue }}</span>
          <span class="label">Plazos vencidos</span>
        </div>
      </div>

      <!-- 5. Tiempo Promedio -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper green">
          <mat-icon>speed</mat-icon>
        </div>
        <div class="kpi-info">
          <span class="value">{{ metrics().responseAverageDays }}d</span>
          <span class="label">Respuesta promedio</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
      transition: all 0.2s ease;

      &.danger {
        border-color: #fecaca;
        background: #fff5f5;
        .value { color: #dc2626; }
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
      }
    }

    .kpi-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      &.blue { background: #eff6ff; color: #2563eb; }
      &.orange { background: #fff7ed; color: #ea580c; }
      &.yellow { background: #fef9c3; color: #ca8a04; }
      &.red { background: #fef2f2; color: #dc2626; }
      &.green { background: #f0fdf4; color: #16a34a; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      
      .value {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;
      }

      .label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        margin-top: 4px;
      }
    }
  `]
})
export class KpiPanelComponent {
  metrics = input.required<SecretariatMetrics>();
}
