import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-expired-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="session-expired-card">
      <div class="glow-accent"></div>
      
      <div class="dialog-body">
        <div class="icon-bubble">
          <mat-icon class="timer-icon">lock_clock</mat-icon>
        </div>

        <h2 class="dialog-title">Sesión Expirada</h2>
        
        <p class="dialog-message">
          Su sesión de acceso ha caducado por inactividad. Por motivos de seguridad y confidencialidad institucional del CEISH-ESPOCH, debe identificarse nuevamente para continuar trabajando.
        </p>

        <div class="security-badge">
          <mat-icon class="shield-icon">security</mat-icon>
          <span>Protección de datos y expedientes activa</span>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-flat-button class="btn-login" (click)="onLogin()">
          <mat-icon class="me-2">login</mat-icon>
          <span>Iniciar Sesión Nuevamente</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .session-expired-card {
      position: relative;
      background: #ffffff;
      border-radius: 24px;
      padding: 2.25rem 2rem 2rem;
      text-align: center;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .glow-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #d97706, #f59e0b, #00796b);
    }

    .icon-bubble {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.25rem;
      border-radius: 20px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);

      .timer-icon {
        font-size: 38px;
        width: 38px;
        height: 38px;
        color: #d97706;
      }
    }

    .dialog-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.75rem;
      letter-spacing: -0.02em;
    }

    .dialog-message {
      font-size: 0.925rem;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 1.25rem;
    }

    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 100px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1.75rem;

      .shield-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #00796b;
      }
    }

    .dialog-actions {
      display: flex;
      flex-direction: column;
    }

    .btn-login {
      height: 50px;
      background: #00796b !important;
      color: #ffffff !important;
      border-radius: 14px;
      font-size: 0.95rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 14px rgba(0, 121, 107, 0.3);

      &:hover {
        background: #004d40 !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 121, 107, 0.4);
      }

      &:active {
        transform: scale(0.98);
      }
    }
  `]
})
export class SessionExpiredDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SessionExpiredDialogComponent>);
  private readonly router = inject(Router);

  onLogin(): void {
    this.dialogRef.close();
    this.router.navigate(['/auth/login']);
  }
}
