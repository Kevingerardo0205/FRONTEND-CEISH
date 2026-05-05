import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

@Component({
  selector: 'app-protocol-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container" *ngIf="protocol()">
      <header class="page-header">
        <div class="title-row">
          <button mat-icon-button routerLink="/protocols/list">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-area">
            <h1>{{ protocol()?.title }}</h1>
            <div class="badges">
              <mat-chip>{{ protocol()?.code | protocolCode }}</mat-chip>
              <mat-chip class="status-chip">{{ protocol()?.status }}</mat-chip>
              <mat-chip class="type-chip">{{ protocol()?.type }}</mat-chip>
            </div>
          </div>
        </div>
      </header>

      <mat-tab-group class="detail-tabs">
        <mat-tab label="Información General">
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <label>Investigador Principal</label>
                <p>{{ protocol()?.investigator }}</p>
              </div>
              <div class="info-item">
                <label>Fecha de Envío</label>
                <p>{{ protocol()?.submissionDate | date:'mediumDate' }}</p>
              </div>
              <div class="info-item full-width">
                <label>Descripción / Resumen</label>
                <p>{{ protocol()?.description || 'No proporcionada' }}</p>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Documentación">
          <div class="tab-content">
            <div class="doc-list">
              <div class="doc-item" *ngFor="let doc of protocol()?.documents">
                <mat-icon>description</mat-icon>
                <span class="doc-name">{{ doc.name }}</span>
                <button mat-icon-button color="primary">
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Historial de Cambios">
          <div class="tab-content">
            <p>No hay eventos registrados en el historial.</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .title-row { display: flex; align-items: flex-start; gap: 1rem; }
    .title-area {
      h1 { margin: 0; font-size: 1.5rem; color: #003366; line-height: 1.2; }
      .badges { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
    }
    .detail-tabs { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .tab-content { padding: 2rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item {
      label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
      p { margin: 0; color: #1e293b; font-weight: 500; }
    }
    .full-width { grid-column: span 2; }
    .doc-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .doc-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      .doc-name { flex: 1; font-weight: 500; }
    }
    .status-chip { background: #dcfce7 !important; color: #166534 !important; }
    .type-chip { background: #e0f2f1 !important; color: #00796b !important; }
  `]
})
export class ProtocolDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  
  protocol = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadProtocol(id);
  }

  loadProtocol(id: string) {
    // Mock for now
    this.protocol.set({
      id,
      code: '2026-IO-001',
      title: 'Impacto del COVID-19 en la salud mental docente de la ESPOCH',
      investigator: 'Dr. Juan Perez',
      type: 'IO',
      status: 'SUBMITTED',
      submissionDate: new Date(),
      description: 'Este estudio busca analizar las secuelas psicológicas en el personal docente post-pandemia.',
      documents: [
        { name: 'Protocolo_Final.pdf' },
        { name: 'Consentimiento_Informado.pdf' },
        { name: 'Hoja_Vida_Investigador.pdf' }
      ]
    });
  }
}
