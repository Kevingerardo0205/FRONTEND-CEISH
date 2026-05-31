import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProtocoloService } from '../../../investigador/application/services/protocolo.service';

@Component({
  selector: 'app-timeline-acceptance-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" *ngIf="isOpen()">
      <div class="modal-card animate-zoom-in">
        
        <!-- HEADER PREMIUM -->
        <header class="modal-header">
          <div class="header-icon-container">
            <mat-icon class="legal-icon">gavel</mat-icon>
          </div>
          <h3>Sometimiento Obligatorio a Tiempos y Reglamentos (CEISH)</h3>
          <p class="subtitle">Firma de conformidad del Investigador Principal</p>
        </header>
        
        <!-- BODY -->
        <div class="modal-body">
          <div class="protocol-badge">
            <mat-icon>science</mat-icon>
            <span>Protocolo: <strong>{{ ceishCode() || 'En trámite' }}</strong></span>
          </div>

          <p class="intro-text">
            Estimado(a) Investigador(a), la Secretaría de la CEISH-ESPOCH ha completado y validado satisfactoriamente los requisitos documentales de su proyecto.
          </p>

          <div class="warning-banner">
            <mat-icon>warning</mat-icon>
            <div class="warning-content">
              <strong>Plazos Reglamentarios de Evaluación</strong>
              <p>El ciclo formal de evaluación por el comité de ética se somete a metodologías vigentes con plazos de resolución de hasta 45 o 60 días (según nivel de riesgo asignado).</p>
            </div>
          </div>

          <p class="terms-text">
            Al firmar digitalmente esta declaración, usted declara formalmente su conformidad y se compromete a someterse a los plazos, cronogramas, requerimientos de corrección y decisiones dictaminadas por el Comité de Ética en Investigación con Seres Humanos de la Escuela Superior Politécnica de Chimborazo (CEISH-ESPOCH).
          </p>
          
          <label class="checkbox-container" [class.checked]="isAccepted()">
            <input type="checkbox" (change)="toggleCheckbox()" [disabled]="isLoading()" />
            <span class="custom-checkbox">
              <mat-icon *ngIf="isAccepted()">check</mat-icon>
            </span>
            <span class="checkbox-label">Declaro solemnemente estar de acuerdo y someterme a los tiempos reglamentarios de la CEISH-ESPOCH.</span>
          </label>
        </div>
        
        <!-- FOOTER -->
        <footer class="modal-footer">
          <button 
            class="btn-primary" 
            [disabled]="!isAccepted() || isLoading()" 
            (click)="onConfirm()">
            <mat-progress-spinner *ngIf="isLoading()" diameter="20" mode="indeterminate" class="btn-spinner"></mat-progress-spinner>
            <mat-icon *ngIf="!isLoading()">history_edu</mat-icon>
            <span>{{ isLoading() ? 'Firmando y Enviando...' : 'Firmar Conformidad y Someter a Evaluación' }}</span>
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); /* Azul profundo con transparencia */
      backdrop-filter: blur(12px); /* Glassmorphism Blur */
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1.5rem;
    }

    .modal-card {
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 24px; max-width: 600px; width: 100%;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
      display: flex; flex-direction: column; overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    /* Header */
    .modal-header {
      padding: 2.25rem 2.25rem 1.5rem; text-align: center;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f5f9;
      
      .header-icon-container {
        width: 56px; height: 56px; background: #eff6ff; border-radius: 16px;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;
        border: 1px solid #dbeafe;
      }
      .legal-icon { color: #1e3a8a; font-size: 28px; width: 28px; height: 28px; }
      h3 { font-size: 1.35rem; font-weight: 800; color: #1e3a8a; margin: 0 0 0.5rem; line-height: 1.3; }
      .subtitle { font-size: 0.85rem; color: #64748b; margin: 0; font-weight: 500; }
    }

    /* Body */
    .modal-body {
      padding: 1.75rem 2.25rem; display: flex; flex-direction: column; gap: 1.25rem;
      max-height: 55vh; overflow-y: auto;
      
      .protocol-badge {
        align-self: center; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 9999px;
        display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #334155;
        border: 1px solid #e2e8f0;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
      }

      .intro-text { font-size: 0.95rem; color: #334155; line-height: 1.5; margin: 0; }

      /* Warning Banner: Degradado Oro/Ámbar */
      .warning-banner {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 12px;
        display: flex; gap: 0.75rem; align-items: flex-start;
        mat-icon { color: #d97706; font-size: 20px; width: 20px; height: 20px; margin-top: 2px; }
        .warning-content {
          strong { font-size: 0.85rem; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; }
          p { font-size: 0.8rem; color: #b45309; margin: 0; line-height: 1.4; font-weight: 500; }
        }
      }

      .terms-text { font-size: 0.88rem; color: #475569; line-height: 1.6; margin: 0; font-style: italic; background: #fafafa; padding: 0.8rem 1rem; border-radius: 10px; border: 1.5px dashed #cbd5e1; }

      /* Checkbox Estilizado */
      .checkbox-container {
        display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;
        padding: 1rem; background: #f8fafc; border-radius: 14px;
        border: 1px solid #e2e8f0; transition: all 0.2s ease;
        
        &:hover { border-color: #cbd5e1; background: #f1f5f9; }
        &.checked { border-color: #bbf7d0; background: #f0fdf4; }

        input { display: none; }

        .custom-checkbox {
          width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; background: white;
          transition: all 0.2s ease; flex-shrink: 0; margin-top: 2px;
          mat-icon { font-size: 14px; width: 14px; height: 14px; color: white; font-weight: 900; }
        }

        input:checked + .custom-checkbox {
          background: #10b981; border-color: #10b981;
        }

        .checkbox-label { font-size: 0.85rem; color: #334155; font-weight: 600; line-height: 1.4; user-select: none; }
      }
    }

    /* Footer */
    .modal-footer {
      padding: 1.5rem 2.25rem 2.25rem; border-top: 1px solid #f1f5f9;
      background: #fafafa; display: flex; justify-content: stretch;
      
      .btn-primary {
        width: 100%; height: 52px; background: #10b981; color: white; border: none;
        border-radius: 14px; font-weight: 700; font-size: 0.95rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); }
        &:active:not(:disabled) { transform: translateY(0); }
        &:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        
        .btn-spinner { margin-right: 0.25rem; ::ng-deep circle { stroke: white !important; } }
      }
    }

    /* Animations */
    .animate-zoom-in {
      animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes zoomIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class TimelineAcceptanceModalComponent {
  private protocolService = inject(ProtocoloService);

  // Inputs & Outputs
  protocolId = input.required<number>();
  ceishCode = input.required<string>();
  isOpen = input<boolean>(true);
  accepted = output<void>();

  // Reactive State (Signals)
  isAccepted = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  toggleCheckbox() {
    this.isAccepted.update(val => !val);
  }

  onConfirm() {
    this.isLoading.set(true);
    this.protocolService.acceptTimeline(this.protocolId()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.accepted.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error al aceptar tiempos:', err);
        alert(err?.error?.message || 'Hubo un error al procesar su solicitud. Intente nuevamente.');
      }
    });
  }
}
