import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ValidateDocumentaryUseCase } from '../../../application/use-cases/validate-documentary.use-case';
import { ValidationContext } from '../../../strategies/validation-context';
import { ProtocolType } from '@domain/enums/protocol-type.enum';

@Component({
  selector: 'app-protocol-validation-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatButtonModule, 
    MatIconModule, 
    MatCheckboxModule, 
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="detail-container">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/protocols/validate">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-area">
          <h1>Revisión de Protocolo</h1>
          <p>ID Temporal: #{{ protocolId }} | Tipo: {{ protocolType() }}</p>
        </div>
      </header>

      <div class="validation-layout">
        <!-- Checklist Section -->
        <main class="checklist-section">
          <div class="card">
            <h3>Checklist PET 2023</h3>
            <p class="subtitle">Verifique la existencia y validez de cada documento requerido.</p>
            
            <div class="doc-list">
              <div class="doc-item" *ngFor="let doc of requiredDocs(); let i = index">
                <mat-checkbox [(ngModel)]="checklist()[i].checked" (change)="updateProgress()">
                  <span class="doc-label">{{ doc.label }}</span>
                </mat-checkbox>
                <div class="doc-actions">
                  <button mat-icon-button color="primary" matTooltip="Ver documento">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- Decision Section -->
        <aside class="decision-section">
          <div class="card status-card">
            <h4>Estado de Validación</h4>
            <div class="progress-info">
              <span class="percent">{{ progress() }}%</span>
              <span class="label">Documentos Verificados</span>
            </div>
            
            <mat-divider></mat-divider>

            <div class="observations-area">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observaciones / Faltantes</mat-label>
                <textarea matInput [(ngModel)]="observations" placeholder="Liste los documentos faltantes o errores..."></textarea>
              </mat-form-field>
            </div>

            <div class="action-buttons">
              <button mat-flat-button class="approve-btn" 
                      [disabled]="progress() < 100"
                      (click)="onApprove()">
                <mat-icon>verified</mat-icon>
                Validar y Generar Código
              </button>
              
              <button mat-stroked-button color="warn" class="reject-btn" (click)="onObserve()">
                <mat-icon>report_problem</mat-icon>
                Notificar Faltantes
              </button>
            </div>
            
            <p class="disclaimer">
              Al notificar faltantes, el investigador tendrá un plazo de 15 días para completar la carga.
            </p>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .detail-container { animation: slideIn 0.4s ease-out; }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.75rem; font-weight: 800; color: #003366; }
      p { margin: 0.25rem 0 0; color: #64748b; font-weight: 500; }
    }

    .validation-layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    .card {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      
      h3 { margin: 0; font-weight: 800; color: #003366; }
      .subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem; }
    }

    .doc-list {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #edf2f7;
      transition: all 0.2s ease;

      &:hover { border-color: #cbd5e1; }
      
      .doc-label { font-size: 0.9rem; font-weight: 600; color: #475569; }
    }

    .status-card {
      h4 { margin: 0 0 1.5rem; font-weight: 800; color: #003366; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
      
      .progress-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 2rem;
        .percent { font-size: 3rem; font-weight: 800; color: #003366; line-height: 1; }
        .label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; margin-top: 0.5rem; }
      }
    }

    .observations-area { margin: 2rem 0; .full-width { width: 100%; } }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      button { height: 50px; border-radius: 12px; font-weight: 700; }
      .approve-btn { background-color: #10b981; color: white; &:disabled { opacity: 0.5; } }
    }

    .disclaimer { font-size: 0.7rem; color: #94a3b8; margin-top: 1.5rem; line-height: 1.4; font-style: italic; }

    @media (max-width: 1024px) { .validation-layout { grid-template-columns: 1fr; } }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ProtocolValidationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private validateUseCase = inject(ValidateDocumentaryUseCase);
  private validationContext = new ValidationContext();

  protocolId = '';
  protocolType = signal(ProtocolType.IO);
  observations = '';
  progress = signal(0);
  
  checklist = signal<{type: string, checked: boolean}[]>([]);

  requiredDocs = computed(() => {
    return this.validationContext.getStrategy(this.protocolType()).getRequiredDocuments();
  });

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    // Inicializamos el checklist basado en los requerimientos del tipo de protocolo
    const docs = this.requiredDocs();
    this.checklist.set(docs.map(d => ({ type: d.type, checked: false })));
  }

  updateProgress() {
    const checkedCount = this.checklist().filter(c => c.checked).length;
    const total = this.checklist().length;
    this.progress.set(Math.round((checkedCount / total) * 100));
  }

  onApprove() {
    this.validateUseCase.execute(this.protocolId, true).subscribe(() => {
      alert('Protocolo Validado con éxito. Código institucional generado.');
      this.router.navigate(['/dashboard/protocols/validate']);
    });
  }

  onObserve() {
    this.validateUseCase.execute(this.protocolId, false, this.observations).subscribe(() => {
      alert('Observaciones enviadas al investigador.');
      this.router.navigate(['/dashboard/protocols/validate']);
    });
  }
}
