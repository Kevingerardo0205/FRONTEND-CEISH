import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ICallRepositoryPort } from '@domain/ports/ICallRepositoryPort';
import { CallEntity, CreateCallDto, SessionType } from '@domain/entities/call.entity';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

@Component({
  selector: 'app-calls-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule
  ],
  template: `
    <div class="minimal-page animate-fade-in">
      
      <!-- HEADER MINIMALISTA -->
      <header class="page-header border-bottom pb-4 mb-4">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <div class="breadcrumb-text">CEISH / Secretaría / Convocatorias</div>
            <h1 class="title-minimal">Convocatorias y Actas</h1>
            <p class="subtitle-minimal">Agendamiento de sesiones ordinarias y extraordinarias del Pleno del CEISH</p>
          </div>
          <div>
            <button mat-flat-button class="btn-minimal-primary" (click)="toggleCreateForm(!showCreateForm())">
              <mat-icon>{{ showCreateForm() ? 'close' : 'add' }}</mat-icon>
              <span>{{ showCreateForm() ? 'Cerrar' : 'Nueva Convocatoria' }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- MÉTRICAS EN LÍNEA (SUBTILES Y MINIMALISTAS) -->
      <section class="minimal-stats-strip mb-4">
        <div class="stat-item">
          <span class="stat-num">{{ callsList().length }}</span>
          <span class="stat-lbl">Convocatorias</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num text-primary">{{ pendingProtocols().length }}</span>
          <span class="stat-lbl">Protocolos Listos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ getNextSessionDate() }}</span>
          <span class="stat-lbl">Próxima Sesión</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">Salón Dorado</span>
          <span class="stat-lbl">Recinto Principal</span>
        </div>
      </section>

      <!-- FORMULARIO DE AGENDAMIENTO (SLIDING PANEL MINIMALISTA) -->
      <section *ngIf="showCreateForm()" class="minimal-panel mb-5 animate-fade-in">
        <div class="row g-4">
          
          <!-- FORMULARIO E INVENTARIO PROTOCOLOS -->
          <div class="col-lg-7">
            <form [formGroup]="callForm" (ngSubmit)="onSubmitCall()">
              <div class="panel-section-title">1. Parámetros de la Convocatoria</div>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="minimal-label">Número de Convocatoria *</label>
                  <input type="text" class="minimal-input" formControlName="callNumber" placeholder="Ej: 001-2026" />
                </div>

                <div class="col-md-6">
                  <label class="minimal-label">Tipo de Sesión *</label>
                  <div class="minimal-segmented">
                    <button type="button" 
                            class="segmented-btn" 
                            [class.selected]="callForm.get('sessionType')?.value === 'ORDINARIA'"
                            (click)="setSessionType('ORDINARIA')">
                      Ordinaria
                    </button>
                    <button type="button" 
                            class="segmented-btn" 
                            [class.selected]="callForm.get('sessionType')?.value === 'EXTRAORDINARIA'"
                            (click)="setSessionType('EXTRAORDINARIA')">
                      Extraordinaria
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="minimal-label">Fecha y Hora *</label>
                  <input type="datetime-local" class="minimal-input" formControlName="meetingDate" />
                </div>

                <div class="col-md-6">
                  <label class="minimal-label">Lugar de Sesión *</label>
                  <select class="minimal-input" formControlName="meetingPlace">
                    <option *ngFor="let place of defaultPlaces" [value]="place">{{ place }}</option>
                  </select>
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="panel-section-title m-0">2. Expedientes Validados ({{ selectedProtocolIds.length }} seleccionados)</div>
              </div>

              <div class="minimal-search mb-3">
                <input type="text" class="minimal-input" placeholder="Filtrar por código o título..." [(ngModel)]="searchTerm" [ngModelOptions]="{standalone: true}" />
              </div>

              <div class="minimal-protocol-list">
                <div *ngIf="filteredPendingProtocols().length === 0" class="p-4 text-center text-muted small">
                  No hay protocolos pendientes de agendamiento.
                </div>

                <div *ngFor="let p of filteredPendingProtocols()" 
                     class="minimal-protocol-row"
                     [class.active]="isProtocolSelected(p.id)"
                     (click)="onToggleProtocol(p.id)">
                  <mat-checkbox [checked]="isProtocolSelected(p.id)"
                                (click)="$event.stopPropagation()"
                                (change)="onToggleProtocol(p.id)"
                                color="primary">
                  </mat-checkbox>
                  <div class="flex-grow-1 ms-2">
                    <div class="fw-bold text-dark fs-6">{{ p.code || ('PRT-' + p.id) }} — {{ p.title }}</div>
                    <div class="text-muted small">IP: {{ getInvestigatorName(p.principalInvestigator) }}</div>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" mat-button class="btn-minimal-secondary" (click)="toggleCreateForm(false)">Cancelar</button>
                <button type="submit" mat-flat-button class="btn-minimal-primary" [disabled]="callForm.invalid || isSubmitting() || selectedProtocolIds.length === 0">
                  {{ isSubmitting() ? 'Agendando...' : 'Agendar y Notificar' }}
                </button>
              </div>
            </form>
          </div>

          <!-- HOJA OFICIAL MINIMALISTA -->
          <div class="col-lg-5">
            <div class="minimal-paper">
              <div class="paper-header-text">ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO</div>
              <div class="paper-sub-text">COMITÉ DE ÉTICA EN INVESTIGACIÓN EN SERES HUMANOS</div>

              <div class="paper-divider"></div>

              <div class="paper-title">CONVOCATORIA Nº {{ callForm.get('callNumber')?.value || '00X-2026' }}</div>

              <p class="paper-paragraph">
                Se convoca a los miembros del CEISH-ESPOCH a la <strong>Sesión {{ callForm.get('sessionType')?.value }}</strong> 
                a realizarse el <strong>{{ callForm.get('meetingDate')?.value ? (callForm.get('meetingDate')?.value | date:'medium') : '___' }}</strong> 
                en <strong>{{ callForm.get('meetingPlace')?.value }}</strong>.
              </p>

              <div class="paper-agenda-heading">ORDEN DEL DÍA</div>
              <ol class="paper-agenda-ol">
                <li>Constatación del quórum.</li>
                <li>Lectura y aprobación del orden del día.</li>
                <li>
                  Evaluación de protocolos postulados:
                  <ul class="paper-sub-ul">
                    <li *ngFor="let title of getSelectedProtocolTitles()">{{ title }}</li>
                    <li *ngIf="getSelectedProtocolTitles().length === 0" class="text-muted fst-italic">(Seleccione protocolos a la izquierda)</li>
                  </ul>
                </li>
                <li>Asuntos varios.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <!-- TABLA MINIMALISTA DE CONVOCATORIAS -->
      <main class="minimal-table-wrapper">
        <table class="minimal-table">
          <thead>
            <tr>
              <th>Convocatoria</th>
              <th>Tipo</th>
              <th>Fecha y Hora</th>
              <th>Lugar</th>
              <th class="text-center">Expedientes</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of callsList()">
              <td class="fw-bold text-dark">{{ c.callNumber || 'Nº 001' }}</td>
              <td>
                <span class="minimal-badge" [class.badge-ord]="c.sessionType === 'ORDINARIA'">
                  {{ c.sessionType || 'ORDINARIA' }}
                </span>
              </td>
              <td>{{ c.meetingDate ? (c.meetingDate | date:'dd/MM/yyyy HH:mm') : 'Por agendar' }}</td>
              <td class="text-secondary">{{ c.meetingPlace || 'Salón Dorado de la Facultad de Medicina' }}</td>
              <td class="text-center">
                <span class="count-pill">{{ c.protocolVersionIds?.length || c.protocols?.length || 0 }}</span>
              </td>
              <td class="text-end">
                <button mat-icon-button class="minimal-icon-btn" matTooltip="Ver detalle" (click)="onViewCall(c)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button class="minimal-icon-btn" matTooltip="Enviar recordatorio" (click)="onNotifyCall(c)">
                  <mat-icon>mail</mat-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="callsList().length === 0">
              <td colspan="6" class="text-center py-5 text-muted">
                No hay convocatorias agendadas. Haga clic en "Nueva Convocatoria" para registrar una.
              </td>
            </tr>
          </tbody>
        </table>
      </main>

    </div>
  `,
  styles: [`
    .minimal-page {
      padding: 2rem 3rem;
      max-width: 1300px;
      margin: 0 auto;
      background-color: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .breadcrumb-text {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-minimal {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 2px 0;
      color: #0f172a;
    }
    .subtitle-minimal {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
    }

    /* BOTONES MINIMALISTAS */
    .btn-minimal-primary {
      background-color: #0f172a !important;
      color: #ffffff !important;
      border-radius: 8px !important;
      padding: 0.5rem 1.25rem !important;
      font-weight: 600 !important;
      font-size: 0.88rem !important;
      box-shadow: none !important;
      transition: background 0.2s ease !important;
      &:hover { background-color: #334155 !important; }
    }
    .btn-minimal-secondary {
      color: #475569 !important;
      font-weight: 600 !important;
    }

    /* STATS STRIP MINIMALISTA */
    .minimal-stats-strip {
      display: flex;
      align-items: center;
      gap: 2rem;
      background: #f8fafc;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .stat-item { display: flex; flex-direction: column; }
    .stat-num { font-size: 1.25rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .stat-lbl { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-divider { width: 1px; height: 28px; background: #cbd5e1; }

    /* PANEL MINIMALISTA DE CREACIÓN */
    .minimal-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .panel-section-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }

    .minimal-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
      display: block;
    }
    .minimal-input {
      width: 100%;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.88rem;
      outline: none;
      background: #ffffff;
      transition: border-color 0.2s ease;
      &:focus { border-color: #0f172a; }
    }

    /* SEGMENTED TOGGLE */
    .minimal-segmented {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
    }
    .segmented-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      &.selected {
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
    }

    /* PROTOCOL LIST */
    .minimal-protocol-list {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .minimal-protocol-row {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s ease;
      &:last-child { border-bottom: none; }
      &:hover { background: #f8fafc; }
      &.active { background: #f1f5f9; }
    }

    /* HOJA DE PREVISUALIZACIÓN */
    .minimal-paper {
      background: #fafbfc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.75rem;
      font-size: 0.85rem;
      color: #334155;
    }
    .paper-header-text { font-size: 0.75rem; font-weight: 800; color: #0f172a; text-align: center; }
    .paper-sub-text { font-size: 0.65rem; color: #64748b; text-align: center; margin-top: 2px; }
    .paper-divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
    .paper-title { font-weight: 800; text-align: center; margin-bottom: 12px; color: #0f172a; }
    .paper-paragraph { margin-bottom: 12px; line-height: 1.5; }
    .paper-agenda-heading { font-weight: 700; font-size: 0.8rem; margin-top: 12px; color: #0f172a; }
    .paper-agenda-ol { padding-left: 16px; margin-top: 4px; }
    .paper-sub-ul { padding-left: 14px; margin-top: 4px; }

    /* TABLA MINIMALISTA */
    .minimal-table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .minimal-table {
      width: 100%;
      border-collapse: collapse;
      th {
        background: #f8fafc;
        padding: 12px 20px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }
      td {
        padding: 16px 20px;
        font-size: 0.88rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fafbfc; }
    }

    .minimal-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      &.badge-ord { background: #e0f2fe; color: #0369a1; }
    }
    .count-pill {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      font-size: 0.78rem;
    }
    .minimal-icon-btn {
      color: #64748b !important;
      &:hover { color: #0f172a !important; }
    }
  `]
})
export class CallsManagementPage implements OnInit {
  private callRepo = inject(ICallRepositoryPort);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  showCreateForm = signal(false);
  isSubmitting = signal(false);
  pendingProtocols = signal<ProtocolEntity[]>([]);
  callsList = signal<CallEntity[]>([]);
  selectedProtocolIds: number[] = [];
  searchTerm = '';

  getInvestigatorName(pi: any): string {
    if (!pi) return 'No registrado';
    if (typeof pi === 'string') return pi;
    if (typeof pi === 'object') {
      if (pi.name) return pi.name;
      if (pi.fullName) return pi.fullName;
      if (pi.firstName || pi.lastName) return `${pi.firstName || ''} ${pi.lastName || ''}`.trim();
      if (pi.email) return pi.email;
    }
    return String(pi);
  }

  defaultPlaces = [
    'Salón Dorado de la Facultad de Medicina',
    'Aula Magna de Nutrición y Dietética',
    'Sala de Sesiones del Rectorado',
    'Virtual (Microsoft Teams / Zoom)'
  ];

  callForm: FormGroup = this.fb.group({
    callNumber: ['', [Validators.required]],
    sessionType: ['ORDINARIA', [Validators.required]],
    meetingDate: ['', [Validators.required]],
    meetingPlace: [this.defaultPlaces[0], [Validators.required]]
  });

  ngOnInit() {
    this.loadCalls();
    this.loadPendingProtocols();
  }

  loadCalls() {
    this.callRepo.getCalls().subscribe({
      next: (list) => this.callsList.set(list || []),
      error: (err) => console.error('Error al cargar convocatorias:', err)
    });
  }

  loadPendingProtocols() {
    this.callRepo.getPendingProtocols().subscribe({
      next: (list) => this.pendingProtocols.set(list || []),
      error: (err) => console.error('Error al cargar protocolos pendientes:', err)
    });
  }

  filteredPendingProtocols = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.pendingProtocols();
    return this.pendingProtocols().filter(p => 
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (this.getInvestigatorName(p.principalInvestigator).toLowerCase().includes(term))
    );
  });

  getNextSessionDate(): string {
    const list = this.callsList();
    if (!list || list.length === 0) return 'Sin agendar';
    const future = list.filter(c => new Date(c.meetingDate) >= new Date());
    if (future.length === 0) return 'Ninguna próxima';
    const next = future[0];
    return new Date(next.meetingDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }

  toggleCreateForm(show: boolean) {
    this.showCreateForm.set(show);
    if (show) {
      this.generateNextCallNumber();
    } else {
      this.callForm.reset({ sessionType: 'ORDINARIA', meetingPlace: this.defaultPlaces[0] });
      this.selectedProtocolIds = [];
      this.searchTerm = '';
    }
  }

  setSessionType(type: SessionType) {
    this.callForm.patchValue({ sessionType: type });
  }

  generateNextCallNumber() {
    const year = new Date().getFullYear();
    const count = this.callsList().length + 1;
    const padCount = String(count).padStart(3, '0');
    this.callForm.patchValue({ callNumber: `${padCount}-${year}` });
  }

  isProtocolSelected(id: number | string): boolean {
    return this.selectedProtocolIds.includes(Number(id));
  }

  onToggleProtocol(id: number | string) {
    const numId = Number(id);
    const index = this.selectedProtocolIds.indexOf(numId);
    if (index > -1) {
      this.selectedProtocolIds.splice(index, 1);
    } else {
      this.selectedProtocolIds.push(numId);
    }
  }

  getSelectedProtocolTitles(): string[] {
    return this.pendingProtocols()
      .filter(p => this.selectedProtocolIds.includes(Number(p.id)))
      .map(p => `${p.code || ('PRT-' + p.id)}: ${p.title}`);
  }

  onSubmitCall() {
    if (this.callForm.invalid) return;

    if (this.selectedProtocolIds.length === 0) {
      this.snackBar.open('⚠️ Debe seleccionar al menos un protocolo para incluir en la convocatoria.', 'Cerrar', { duration: 4000 });
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.callForm.value;
    const titles = this.getSelectedProtocolTitles();
    const agendaText = `1. Constatación del quórum. 2. Lectura y aprobación del orden del día. 3. Evaluación de protocolos: ${titles.join('; ')}. 4. Asuntos varios.`;

    // Extraer IDs numéricos limpios para evitar HTTP 400 en el DTO del backend
    const versionIds = this.pendingProtocols()
      .filter(p => this.isProtocolSelected(p.id))
      .map(p => {
        const num = parseInt(String(p.id).replace(/\D/g, ''), 10);
        return isNaN(num) ? 1 : num;
      });

    const dto: CreateCallDto = {
      callNumber: formVal.callNumber,
      sessionType: formVal.sessionType as SessionType,
      meetingDate: new Date(formVal.meetingDate).toISOString(),
      meetingPlace: formVal.meetingPlace,
      agenda: agendaText,
      protocolVersionIds: versionIds
    };

    this.callRepo.createCall(dto).subscribe({
      next: () => {
        this.snackBar.open('✅ Convocatoria agendada con éxito.', 'Cerrar', { duration: 4000 });
        this.isSubmitting.set(false);
        this.toggleCreateForm(false);
        this.loadCalls();
        this.loadPendingProtocols();
      },
      error: (err) => {
        console.error('Error al crear convocatoria:', err);
        const detailMsg = err?.error?.message || err?.message || 'Error en el servidor (400 Bad Request)';
        this.snackBar.open(`❌ Error al agendar convocatoria: ${detailMsg}`, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }

  onViewCall(call: CallEntity) {
    this.snackBar.open(`Convocatoria ${call.callNumber}: ${call.sessionType} en ${call.meetingPlace}`, 'Cerrar', { duration: 3000 });
  }

  onNotifyCall(call: CallEntity) {
    this.snackBar.open(`Recordatorio enviado para Convocatoria ${call.callNumber}`, 'Cerrar', { duration: 3000 });
  }
}
