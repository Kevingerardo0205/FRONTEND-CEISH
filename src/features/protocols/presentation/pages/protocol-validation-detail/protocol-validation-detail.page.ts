import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatTooltipModule,
    MatProgressBarModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="validation-detail-container animate-fade-in">
      
      <!-- TOP NAV / BREADCRUMBS -->
      <header class="detail-header mb-4">
        <div class="header-left">
          <button mat-icon-button class="back-btn me-3" routerLink="/dashboard/protocols/validation/list" matTooltip="Regresar al listado">
            <mat-icon>arrow_back_ios</mat-icon>
          </button>
          <div class="title-info">
            <div class="breadcrumb-chip">CEISH / Secretaría / Validación Documental</div>
            <h1 class="protocol-title">Validación del Protocolo #{{ protocolId }}</h1>
            <div class="protocol-meta">
              <span class="type-tag" [ngClass]="protocolType().toLowerCase()">
                {{ protocolType() === 'IO' ? 'Observacional' : 'Ensayo Clínico' }}
              </span>
              <span class="date-tag">
                <mat-icon>calendar_today</mat-icon> Recibido: 20 Abr 2026
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <div class="progress-widget shadow-soft">
            <div class="progress-label">
              <span>Progreso de Revisión</span>
              <strong>{{ progress() }}%</strong>
            </div>
            <mat-progress-bar mode="determinate" [value]="progress()" color="primary"></mat-progress-bar>
          </div>
        </div>
      </header>

      <div class="main-layout">
        <!-- LEFT COLUMN: CHECKLIST -->
        <div class="checklist-column">
          <div class="premium-card">
            <div class="card-header-luxury mb-4">
              <div class="header-icon">
                <mat-icon>fact_check</mat-icon>
              </div>
              <div class="header-text">
                <h2>Requisitos PET 2023</h2>
                <p>Confirme la presencia y corrección de cada anexo institucional.</p>
              </div>
            </div>

            <div class="doc-checklist">
              <div class="checklist-item" *ngFor="let doc of requiredDocs(); let i = index" [class.checked]="checklist()[i].checked">
                <div class="item-main">
                  <mat-checkbox color="primary" [(ngModel)]="checklist()[i].checked" (change)="updateProgress()">
                    <div class="doc-info-wrapper">
                      <span class="doc-name">{{ doc.label }}</span>
                      <span class="doc-code">{{ doc.type }}</span>
                    </div>
                  </mat-checkbox>
                </div>
                
                <div class="item-actions">
                  <button mat-icon-button class="action-btn view" matTooltip="Abrir documento en pestaña nueva">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button class="action-btn comment" [class.has-comment]="checklist()[i].observation" 
                          (click)="toggleComment(i)" matTooltip="Añadir observación específica">
                    <mat-icon>{{ checklist()[i].observation ? 'comment' : 'add_comment' }}</mat-icon>
                  </button>
                </div>

                <!-- Input de observación específico por documento (opcional para un diseño más granular) -->
                <div class="item-observation-input animate-slide-down" *ngIf="checklist()[i].showComment">
                  <mat-form-field appearance="outline" class="full-width mini-field">
                    <input matInput [(ngModel)]="checklist()[i].observation" placeholder="¿Qué error tiene este documento?">
                    <button mat-icon-button matSuffix (click)="toggleComment(i)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: SUMMARY & DECISION -->
        <div class="decision-column">
          <div class="premium-card sticky-card shadow-lg">
            <div class="card-header-luxury mb-4">
              <div class="header-icon accent">
                <mat-icon>gavel</mat-icon>
              </div>
              <div class="header-text">
                <h2>Dictamen Técnico</h2>
                <p>Emitir resultado de la revisión documental</p>
              </div>
            </div>

            <div class="summary-stats mb-4">
              <div class="stat-item">
                <span class="s-label">Total Documentos</span>
                <span class="s-value">{{ checklist().length }}</span>
              </div>
              <div class="stat-item">
                <span class="s-label">Revisados</span>
                <span class="s-value">{{ checkedCount() }}</span>
              </div>
              <div class="stat-item">
                <span class="s-label">Pendientes</span>
                <span class="s-value primary-text">{{ checklist().length - checkedCount() }}</span>
              </div>
            </div>

            <mat-divider class="mb-4"></mat-divider>

            <div class="global-observations mb-4">
              <label class="field-label-luxury">Observaciones Generales</label>
              <mat-form-field appearance="outline" class="full-width custom-textarea">
                <textarea matInput rows="6" [(ngModel)]="observations" 
                          placeholder="Escriba aquí los comentarios que se enviarán al investigador..."></textarea>
                <mat-icon matPrefix class="text-muted">rate_review</mat-icon>
              </mat-form-field>
            </div>

            <div class="decision-actions d-grid gap-3">
              <button mat-flat-button class="btn-approve" 
                      [disabled]="progress() < 100 || isProcessing"
                      (click)="onApprove()">
                <mat-icon>verified</mat-icon>
                <span>Validar y Notificar</span>
              </button>
              
              <button mat-stroked-button color="warn" class="btn-observe"
                      [disabled]="isProcessing"
                      (click)="onObserve()">
                <mat-icon>assignment_late</mat-icon>
                <span>Solicitar Correcciones</span>
              </button>
            </div>

            <div class="security-disclaimer mt-4">
              <mat-icon>lock</mat-icon>
              <p>Al validar el protocolo, el sistema notificará al investigador y este trámite pasará a la etapa de <strong>Asignación de Evaluadores</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'variables' as vars;

    .validation-detail-container { padding: 1.5rem; }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left { display: flex; align-items: center; }
      
      .back-btn {
        background: white; border: 1px solid #e2e8f0; border-radius: 12px;
        mat-icon { font-size: 18px; margin-left: 6px; }
        &:hover { background: #f8fafc; color: vars.$color-primary; }
      }

      .breadcrumb-chip {
        background: rgba(0, 51, 102, 0.05); color: vars.$color-primary;
        padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 0.5rem;
      }

      .protocol-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
      
      .protocol-meta {
        display: flex; gap: 1rem; margin-top: 0.5rem; align-items: center;
        .type-tag { 
          padding: 2px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;
          &.io { background: #eff6ff; color: #2563eb; }
          &.ec { background: #fff7ed; color: #f59e0b; }
        }
        .date-tag {
          display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748b; font-weight: 500;
          mat-icon { font-size: 16px; width: 16px; height: 16px; }
        }
      }
    }

    .progress-widget {
      background: white; padding: 1rem 1.5rem; border-radius: 16px; width: 260px;
      .progress-label {
        display: flex; justify-content: space-between; margin-bottom: 8px;
        span { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        strong { color: vars.$color-primary; }
      }
      ::ng-deep .mat-mdc-progress-bar { border-radius: 100px; height: 8px; }
    }

    .main-layout {
      display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start;
    }

    .premium-card {
      background: white; border-radius: 24px; padding: 2rem; border: 1px solid #f1f5f9;
      box-shadow: 0 4px 25px rgba(0,0,0,0.02);
    }

    .card-header-luxury {
      display: flex; align-items: center; gap: 1.25rem;
      .header-icon {
        width: 48px; height: 48px; background: #f0f7ff; color: #003366;
        border-radius: 14px; display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 24px; }
        &.accent { background: #fff4e5; color: #e65100; }
      }
      h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; letter-spacing: -0.3px; }
      p { margin: 0; font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
    }

    .doc-checklist { display: flex; flex-direction: column; gap: 0.75rem; }

    .checklist-item {
      display: grid; grid-template-columns: 1fr auto; align-items: center;
      padding: 1rem 1.5rem; background: #f8fafc; border-radius: 16px;
      border: 1px solid #edf2f7; transition: all 0.2s ease;
      
      &:hover { border-color: #cbd5e1; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
      &.checked { border-color: #10b981; background: #f0fdf4; .doc-name { color: #065f46; } }

      .doc-info-wrapper {
        display: flex; flex-direction: column; margin-left: 8px;
        .doc-name { font-size: 0.95rem; font-weight: 700; color: #334155; line-height: 1.2; }
        .doc-code { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
      }

      .item-actions { display: flex; gap: 4px; }
      .action-btn { 
        color: #94a3b8; 
        &:hover { color: vars.$color-primary; background: #f1f5f9; }
        &.has-comment { color: #f59e0b; }
      }
    }

    .item-observation-input { grid-column: span 2; margin-top: 1rem; }
    .mini-field { ::ng-deep .mat-mdc-text-field-wrapper { height: 48px; background: white !important; } }

    .stat-item {
      display: flex; justify-content: space-between; padding: 0.5rem 0;
      .s-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }
      .s-value { font-size: 0.9rem; font-weight: 800; color: #1e293b; }
      .primary-text { color: vars.$color-primary; }
    }

    .field-label-luxury { display: block; font-size: 0.8rem; font-weight: 800; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .custom-textarea {
      ::ng-deep .mat-mdc-text-field-wrapper { background: #f8fafc !important; border-radius: 16px !important; }
      mat-icon { margin-top: 10px; }
    }

    .btn-approve {
      height: 54px; background: #10b981 !important; color: white !important; border-radius: 14px; font-weight: 800;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
      &:disabled { opacity: 0.5; }
    }

    .btn-observe {
      height: 52px; border-radius: 14px; font-weight: 700; border-width: 2px;
      &:hover { background: #fef2f2; }
    }

    .security-disclaimer {
      display: flex; gap: 12px; background: #f0f9ff; padding: 1rem; border-radius: 14px;
      mat-icon { color: #0369a1; font-size: 20px; }
      p { margin: 0; font-size: 0.75rem; color: #0c4a6e; font-weight: 500; line-height: 1.4; }
    }

    .sticky-card { position: sticky; top: 1.5rem; }

    @media (max-width: 1150px) {
      .main-layout { grid-template-columns: 1fr; }
      .sticky-card { position: static; }
    }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private validateUseCase = inject(ValidateDocumentaryUseCase);
  private validationContext = new ValidationContext();

  protocolId = '';
  protocolType = signal(ProtocolType.IO);
  observations = '';
  progress = signal(0);
  isProcessing = false;
  
  checklist = signal<{type: string, checked: boolean, observation?: string, showComment?: boolean}[]>([]);

  requiredDocs = computed(() => {
    return this.validationContext.getStrategy(this.protocolType()).getRequiredDocuments();
  });

  checkedCount = computed(() => {
    return this.checklist().filter(c => c.checked).length;
  });

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    const docs = this.requiredDocs();
    this.checklist.set(docs.map(d => ({ type: d.type, checked: false, observation: '', showComment: false })));
  }

  updateProgress() {
    const total = this.checklist().length;
    this.progress.set(Math.round((this.checkedCount() / total) * 100));
  }

  toggleComment(index: number) {
    const list = [...this.checklist()];
    list[index].showComment = !list[index].showComment;
    this.checklist.set(list);
  }

  onApprove() {
    this.isProcessing = true;
    this.validateUseCase.execute(this.protocolId, true).subscribe({
      next: () => {
        this.snackBar.open('✅ Protocolo validado con éxito. Se ha generado el código institucional.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/protocols/validation/list']);
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al procesar la validación', 'Cerrar', { duration: 5000 });
      }
    });
  }

  onObserve() {
    if (!this.observations && this.checkedCount() < this.checklist().length) {
      this.snackBar.open('⚠️ Por favor, detalle las observaciones o documentos faltantes.', 'Entendido', { duration: 4000 });
      return;
    }

    this.isProcessing = true;
    this.validateUseCase.execute(this.protocolId, false, this.observations).subscribe({
      next: () => {
        this.snackBar.open('📨 Observaciones enviadas al investigador.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/dashboard/protocols/validation/list']);
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al enviar observaciones', 'Cerrar', { duration: 5000 });
      }
    });
  }
}
