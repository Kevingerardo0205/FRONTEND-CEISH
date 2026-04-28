import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-icon" [style.background-color]="color() + '10'" [style.color]="color()">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <div class="stat-content">
        <span class="stat-label">{{ label() }}</span>
        <h3 class="stat-value">{{ value() }}</h3>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease;
      border: 1px solid rgba(0, 0, 0, 0.02);

      &:hover {
        transform: translateY(-5px);
      }
    }

    .stat-icon {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      .stat-label { 
        font-size: 0.7rem; 
        font-weight: 700; 
        color: #94a3b8; 
        text-transform: uppercase; 
        letter-spacing: 0.8px; 
      }
      .stat-value { 
        margin: 0; 
        font-size: 1.5rem; 
        font-weight: 800; 
        color: #0f172a; 
        letter-spacing: -0.5px;
      }
    }
  `]
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input.required<string>();
  color = input<string>('#4DB6AC'); // Esmeralda CEISH por defecto
}
