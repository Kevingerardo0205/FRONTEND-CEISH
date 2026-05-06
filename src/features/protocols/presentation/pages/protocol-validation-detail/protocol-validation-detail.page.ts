import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ValidateDocumentaryUseCase } from '../../../application/use-cases/validate-documentary.use-case';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { REQUISITOS_DOCUMENTOS, TipoEstudio } from '../../../../investigador/constants/anexos-pet.constants';

@Component({
  selector: 'app-protocol-validation-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCheckboxModule, 
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="validation-wrapper animate-fade-in">
      
      <div *ngIf="isLoading()" class="loading-overlay">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>Cargando información del protocolo...</p>
      </div>

      <div *ngIf="!isLoading() && protocolNotFound()" class="error-state">
        <mat-icon>error</mat-icon>
        <h2>Protocolo no encontrado</h2>
        <button mat-flat-button color="primary" routerLink="/dashboard/protocols/validation/list">Volver a la lista</button>
      </div>

      <div *ngIf="!isLoading() && !protocolNotFound()">
        <!-- ENCABEZADO ESTILO OFICIAL PET 2023 -->
        <header class="official-header">
          <div class="top-row">
            <button mat-icon-button routerLink="/dashboard/protocols/validation/list" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-text">
              <span class="institution">ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</span>
              <h1>NOTIFICACIÓN DE RECEPCIÓN DE PROTOCOLO DE INVESTIGACIÓN ({{ protocolTypeLabel() }})</h1>
              <p class="subtitle">COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS (CEISH-ESPOCH)</p>
            </div>
          </div>

          <div class="protocol-info-grid">
            <div class="info-item">
              <span class="label">CÓDIGO DE TRÁMITE:</span>
              <span class="value code">{{ generatedCode() || 'TRÁMITE EN PROCESO' }}</span>
            </div>
            <div class="info-item full">
              <span class="label">TEMA DEL PROYECTO:</span>
              <span class="value title">"{{ protocolTitle() }}"</span>
            </div>
          </div>
        </header>

        <!-- CHECKLIST DE REQUISITOS (ESTILO EXCEL) -->
        <div class="checklist-container mt-4">
          <h2 class="checklist-title">LISTA DE VERIFICACIÓN DE REQUISITOS DOCUMENTALES (PET 2023)</h2>
          
          <div class="table-scroll">
            <table class="excel-table">
              <thead>
                <tr>
                  <th class="col-req">REQUISITOS</th>
                  <th class="col-check">SI</th>
                  <th class="col-check">NO</th>
                  <th class="col-pages">NRO. PÁGS</th>
                  <th class="col-date">FECHA ENTREGA</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of checklist()">
                  <td class="req-label">
                    <span class="req-id">{{ item.anexo }}</span>
                    {{ item.label }}
                  </td>
                  <td class="text-center">
                    <mat-checkbox color="primary" [(ngModel)]="item.si" (change)="toggleSi(item)"></mat-checkbox>
                  </td>
                  <td class="text-center">
                    <mat-checkbox color="warn" [(ngModel)]="item.no" (change)="toggleNo(item)"></mat-checkbox>
                  </td>
                  <td>
                    <input type="number" class="mini-input" [(ngModel)]="item.pages">
                  </td>
                  <td>
                    <input type="date" class="mini-input date" [(ngModel)]="item.completionDate">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DE ACCIÓN Y NOTIFICACIONES -->
        <div class="action-footer mt-4">
          <div class="observations-section">
            <label class="section-label">OBSERVACIONES Y CAMBIOS SOLICITADOS:</label>
            <textarea class="obs-textarea" [(ngModel)]="observations" 
                      placeholder="Describa aquí si falta algún documento o si se requieren correcciones específicas para que el investigador las vea..."></textarea>
          </div>

          <div class="summary-panel">
            <div class="progress-container">
              <div class="progress-labels">
                <span>Progreso de validación:</span>
                <strong>{{ progress() }}%</strong>
              </div>
              <mat-progress-bar mode="determinate" [value]="progress()" 
                                [color]="progress() === 100 ? 'primary' : 'accent'"></mat-progress-bar>
            </div>

            <div class="action-buttons">
              <button mat-flat-button class="btn-validate" 
                      [disabled]="!canApprove() || isProcessing" (click)="onApprove()">
                <mat-icon>verified</mat-icon>
                VALIDAR Y NOTIFICAR EVALUACIÓN
              </button>
              
              <button mat-stroked-button color="warn" class="btn-observe"
                      [disabled]="isProcessing" (click)="onObserve()">
                <mat-icon>announcement</mat-icon>
                NOTIFICAR CAMBIOS AL INVESTIGADOR
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .validation-wrapper { padding: 1.5rem; max-width: 1250px; margin: 0 auto; min-height: 80vh; }
    
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #64748b; }
    .error-state { text-align: center; padding: 4rem; color: #64748b; mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; } }

    .official-header {
      background: white; border: 2px solid #000; padding: 1.5rem;
      .top-row { display: flex; align-items: flex-start; gap: 1rem; border-bottom: 1px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; }
      .header-text { flex: 1; text-align: center; 
        .institution { font-weight: 800; font-size: 1.1rem; display: block; color: #000; }
        h1 { font-size: 1.25rem; font-weight: 900; color: #003366; margin: 0.5rem 0; }
        .subtitle { font-size: 0.9rem; font-weight: 600; color: #000; margin: 0; }
      }
    }

    .protocol-info-grid {
      display: grid; grid-template-columns: 250px 1fr; gap: 0; border: 1px solid #000;
      .info-item { padding: 0.75rem; border-right: 1px solid #000; border-bottom: 1px solid #000; display: flex; flex-direction: column;
        &.full { grid-column: 1 / -1; border-right: none; border-bottom: none; }
        .label { font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 4px; }
        .value { font-weight: 700; &.code { color: #003366; font-size: 1.1rem; } &.title { font-style: italic; } }
      }
    }

    .checklist-title { background: #003366; color: white; padding: 10px; font-size: 0.9rem; font-weight: 700; margin: 0; text-align: center; }

    .excel-table {
      width: 100%; border-collapse: collapse; border: 1px solid #000; background: white;
      th { background: #d1d5db; color: #000; border: 1px solid #000; padding: 10px; font-size: 0.75rem; text-transform: uppercase; }
      td { border: 1px solid #000; padding: 8px; font-size: 0.85rem; vertical-align: middle; }
      .req-label { .req-id { font-weight: 900; color: #003366; margin-right: 8px; } }
      .text-center { text-align: center; }
      .mini-input { width: 100%; border: 1px solid #d1d5db; padding: 4px; border-radius: 4px; text-align: center; &.date { font-size: 0.75rem; } }
    }

    .action-footer {
      display: grid; grid-template-columns: 1fr 400px; gap: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px;
    }

    .section-label { font-weight: 800; font-size: 0.8rem; color: #1e293b; display: block; margin-bottom: 10px; }
    .obs-textarea { width: 100%; height: 120px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-family: inherit; resize: none; &:focus { outline: 2px solid #003366; } }

    .summary-panel { display: flex; flex-direction: column; gap: 1.5rem; }
    .progress-labels { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
    
    .action-buttons { display: flex; flex-direction: column; gap: 1rem;
      button { height: 52px; font-weight: 700; border-radius: 8px; }
      .btn-validate { background: #003366 !important; color: white !important; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProtocolValidationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private repository = inject(IProtocolRepositoryPort);
  private validateUseCase = inject(ValidateDocumentaryUseCase);

  isLoading = signal(true);
  protocolNotFound = signal(false);
  protocolId = '';
  protocolTitle = signal('');
  protocolType = signal(ProtocolType.IO);
  protocolTypeLabel = computed(() => {
    switch(this.protocolType()) {
      case ProtocolType.IO: return 'ESTUDIO OBSERVACIONAL';
      case ProtocolType.EC: return 'ENSAYO CLÍNICO';
      case ProtocolType.EI: return 'ESTUDIO DE INTERVENCIÓN';
      default: return 'PROTOCOLO';
    }
  });

  observations = '';
  progress = signal(0);
  isProcessing = false;
  generatedCode = signal<string | null>(null);
  
  checklist = signal<any[]>([]);

  canApprove = computed(() => {
    const list = this.checklist();
    return list.length > 0 && list.every(item => item.si === true);
  });

  ngOnInit() {
    this.protocolId = this.route.snapshot.params['id'];
    this.loadProtocol();
  }

  loadProtocol() {
    this.isLoading.set(true);
    this.repository.getById(this.protocolId).subscribe({
      next: (protocol) => {
        this.protocolTitle.set(protocol.title);
        this.protocolType.set(protocol.type);
        this.generatedCode.set(protocol.code || null);
        
        // Cargar requisitos basados en el PET 2023 configurado en anexos-pet.constants.ts
        let tipo: TipoEstudio;
        if (protocol.type === ProtocolType.IO) tipo = TipoEstudio.OBSERVACIONAL;
        else if (protocol.type === ProtocolType.EC) tipo = TipoEstudio.ENSAYO_CLINICO;
        else tipo = TipoEstudio.INTERVENCION;

        const docs = REQUISITOS_DOCUMENTOS.filter(req => req.obligatorioPara.includes(tipo));
        
        this.checklist.set(docs.map(d => ({ 
          label: d.nombre,
          anexo: d.anexo,
          type: d.id, 
          si: false, 
          no: false,
          pages: 0,
          completionDate: new Date().toISOString().split('T')[0]
        })));

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading protocol:', err);
        this.protocolNotFound.set(true);
        this.isLoading.set(false);
        this.snackBar.open('❌ No se pudo cargar el protocolo. Verifique el ID.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  toggleSi(item: any) {
    if (item.si) item.no = false;
    this.updateProgress();
  }

  toggleNo(item: any) {
    if (item.no) item.si = false;
    this.updateProgress();
  }

  updateProgress() {
    const total = this.checklist().length;
    if (total === 0) return;
    const answered = this.checklist().filter(c => c.si || c.no).length;
    this.progress.set(Math.round((answered / total) * 100));
  }

  onApprove() {
    this.isProcessing = true;
    this.validateUseCase.execute(this.protocolId, true).subscribe({
      next: () => {
        this.snackBar.open('✅ Protocolo validado. Se ha notificado al investigador que será evaluado por el comité.', 'Cerrar', { duration: 6000 });
        this.router.navigate(['/dashboard/protocols/validation/list']);
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al procesar la validación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onObserve() {
    if (!this.observations) {
      this.snackBar.open('⚠️ Debe escribir observaciones para notificar al investigador.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.isProcessing = true;
    this.validateUseCase.execute(this.protocolId, false, this.observations).subscribe({
      next: () => {
        this.snackBar.open('📨 Observaciones enviadas. El investigador ha sido notificado para realizar los cambios solicitados.', 'Cerrar', { duration: 6000 });
        this.router.navigate(['/dashboard/protocols/validation/list']);
      },
      error: () => {
        this.isProcessing = false;
        this.snackBar.open('❌ Error al enviar la notificación', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

