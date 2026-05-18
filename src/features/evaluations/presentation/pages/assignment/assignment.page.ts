import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ProtocolCodePipe } from '@shared/pipes/protocol-code.pipe';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { EvaluatorEntity, EvaluatorProfile } from '@domain/entities/evaluator.entity';
import { GetEvaluatorsDashboardUseCase } from '../../../application/get-evaluators-dashboard.use-case';
import { SuggestEvaluatorsUseCase } from '../../../application/suggest-evaluators.use-case';
import { ConfirmAssignmentUseCase } from '../../../application/confirm-assignment.use-case';
import { RejectSuggestionUseCase } from '../../../application/reject-suggestion.use-case';
import { GetPendingSuggestionsUseCase } from '../../../application/get-pending-suggestions.use-case';
import { ProtocolType } from '@domain/enums/protocol-type.enum';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatChipsModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ProtocolCodePipe
  ],
  template: `
    <div class="page-container animate-fade-in">

      <!-- LOADING STATE -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando panel de asignación...</p>
      </div>

      <ng-container *ngIf="!isLoading()">
        <header class="page-header">
          <div class="title-section">
            <div class="breadcrumb">Evaluación / Asignación</div>
            <h1>Motor de Asignación Inteligente</h1>
            <p>{{ isPresident() ? 'Presidenta: Sugerir evaluadores cumpliendo perfiles PET' : 'Secretaría: Oficializar asignaciones y plazos' }}</p>
          </div>

          <div class="filters-section">
            <div class="role-badge" [ngClass]="userRole().toLowerCase()">
              PERFIL: {{ userRole() }}
            </div>
          </div>
        </header>

        <!-- NO ACCESS MESSAGE -->
        <div class="empty-state" *ngIf="!isPresident() && !isSecretary()">
          <mat-icon color="warn">lock</mat-icon>
          <h3>Acceso Restringido</h3>
          <p>Su rol ({{ userRole() }}) no tiene permisos para gestionar la asignación de evaluadores.</p>
        </div>

        <!-- VISTA PRESIDENTA: Sugerencia -->
        <div class="table-card shadow-soft mb-5" *ngIf="isPresident()">
          <div class="table-info-header p-3">
            <mat-icon color="primary">hub</mat-icon>
            <span>Validación de Perfiles PET 5.1 & Reglas de Negocio (Presidenta)</span>
          </div>

          <table mat-table [dataSource]="pendingProtocols()">

            <ng-container matColumnDef="protocol">
              <th mat-header-cell *matHeaderCellDef>Protocolo / Tipo de Revisión</th>
              <td mat-cell *matCellDef="let p">
                <div class="protocol-info">
                  <span class="code">{{ p.protocolCode | protocolCode }}</span>
                  <span class="title">{{ p.protocolTitle }}</span>
                  <span class="review-badge" [ngClass]="getReviewType(p.type).toLowerCase()">
                    {{ getReviewType(p.type) === 'PLENO' ? 'REVISIÓN EN PLENO' : 'REVISIÓN EXPEDITA' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="evaluators">
              <th mat-header-cell *matHeaderCellDef>Asignación de Expertos</th>
              <td mat-cell *matCellDef="let p">
                <div class="assignment-cell">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-select multiple placeholder="Seleccionar evaluadores" [(ngModel)]="p.selectedEvaluatorIds">
                      <mat-option *ngFor="let eval of evaluators()" [value]="eval.id">
                        <div class="eval-option">
                          <div class="eval-main">
                            <span class="name">{{ eval.nombre }}</span>
                            <span class="badge-perfil">{{ eval.perfil }}</span>
                          </div>
                          <span class="workload" [ngClass]="getWorkloadClass(eval.cargaActiva)">
                            Carga: {{ eval.cargaActiva }}
                          </span>
                        </div>
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Indicadores de Perfiles PET (Solo para Pleno) -->
                  <div class="profile-indicators" *ngIf="getReviewType(p.type) === 'PLENO'">
                    <div class="profile-chip" *ngFor="let profile of mandatoryProfiles" 
                         [class.covered]="isProfileCovered(p, profile)">
                      <mat-icon>{{ isProfileCovered(p, profile) ? 'check_circle' : 'pending' }}</mat-icon>
                      <span>{{ profile.replace('_', ' ') }}</span>
                    </div>
                  </div>

                  <div class="expedita-info" *ngIf="getReviewType(p.type) === 'EXPEDITA'">
                     <span [class.covered]="p.selectedEvaluatorIds?.length === 2">
                       <mat-icon>{{ p.selectedEvaluatorIds?.length === 2 ? 'check_circle' : 'info' }}</mat-icon>
                       Requiere 2 evaluadores ({{ p.selectedEvaluatorIds?.length }}/2)
                     </span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-end">Validación Final</th>
              <td mat-cell *matCellDef="let p" class="text-end">
                <button mat-flat-button color="primary" 
                        [disabled]="!isValidAssignment(p) || isProcessing"
                        (click)="onSuggest(p)">
                  <mat-icon>send</mat-icon> ENVIAR A SECRETARÍA
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['protocol', 'evaluators', 'actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['protocol', 'evaluators', 'actions'];"></tr>
          </table>

          <div class="empty-state" *ngIf="pendingProtocols().length === 0">
            <mat-icon>verified</mat-icon>
            <p>No hay protocolos pendientes de sugerencia.</p>
          </div>
        </div>

        <!-- VISTA SECRETARÍA: Confirmación -->
        <div class="table-card shadow-soft" *ngIf="isSecretary()">
          <div class="table-info-header p-3 secretary-header">
            <mat-icon color="accent">event_available</mat-icon>
            <span>Sugerencias de la Presidencia por Oficializar (Secretaría)</span>
          </div>

          <table mat-table [dataSource]="suggestedEvaluations()">

            <ng-container matColumnDef="protocol">
              <th mat-header-cell *matHeaderCellDef>Protocolo</th>
              <td mat-cell *matCellDef="let s">
                <div class="protocol-info">
                  <span class="code">{{ s.protocolCode | protocolCode }}</span>
                  <span class="title">{{ s.protocolTitle }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="evaluator">
              <th mat-header-cell *matHeaderCellDef>Evaluador Sugerido</th>
              <td mat-cell *matCellDef="let s">
                <div class="evaluator-info">
                  <div class="avatar-sm">{{ s.evaluatorName ? s.evaluatorName[0] : 'E' }}</div>
                  <div class="eval-meta">
                     <span class="name">{{ s.evaluatorName }}</span>
                     <span class="profile">{{ s.evaluatorProfile }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="deadline">
              <th mat-header-cell *matHeaderCellDef>Fecha Límite</th>
              <td mat-cell *matCellDef="let s">
                <mat-form-field appearance="outline" class="deadline-picker mt-2">
                  <input matInput [matDatepicker]="picker" [(ngModel)]="s.deadline" placeholder="Vence el...">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-end">Acciones</th>
              <td mat-cell *matCellDef="let s" class="text-end">
                <div class="btn-group-secretary">
                  <button mat-button color="warn" 
                          [disabled]="isProcessing"
                          (click)="onReject(s)">
                    <mat-icon>block</mat-icon> Rechazar
                  </button>
                  <button mat-flat-button color="accent" 
                          [disabled]="!s.deadline || isProcessing"
                          (click)="onConfirm(s)">
                    <mat-icon>task_alt</mat-icon> Oficializar
                  </button>
                </div>
              </td>
            </ng-container>

          <tr mat-header-row *matHeaderRowDef="['protocol', 'evaluator', 'deadline', 'actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['protocol', 'evaluator', 'deadline', 'actions'];"></tr>
        </table>

        <div class="empty-state" *ngIf="suggestedEvaluations().length === 0">
          <mat-icon>notifications_off</mat-icon>
          <p>No hay asignaciones sugeridas pendientes.</p>
        </div>
      </div>
    </ng-container>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; min-height: 100vh; position: relative; }
    .page-header { margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .breadcrumb { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }

    .loading-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255, 255, 255, 0.8); z-index: 10;
      p { margin-top: 1rem; font-weight: 600; color: #64748b; }
    }

    .btn-group-secretary { display: flex; gap: 8px; justify-content: flex-end; }

    .role-badge {
      padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; border: 1.5px solid;
      &.admin { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
      &.presidente, &.presidenta { background: #e0f2fe; color: #075985; border-color: #bae6fd; }
      &.secretaria { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    }

    .table-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
    .table-info-header { 
      background: #f8fafc; color: #334155; display: flex; align-items: center; gap: 12px; 
      font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;
      &.secretary-header { background: #fffbeb; color: #92400e; border-bottom-color: #fef3c7; }
    }

    .protocol-info {
      display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 0;
      .code { font-weight: 800; color: #003366; font-size: 0.7rem; }
      .title { font-size: 0.9rem; color: #1e293b; font-weight: 600; line-height: 1.3; }
      .review-badge { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; width: fit-content; margin-top: 4px;
        &.pleno { background: #003366; color: white; }
        &.expedita { background: #e2e8f0; color: #475569; }
      }
    }

    .assignment-cell { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.75rem 0; }

    .profile-indicators { display: flex; flex-wrap: wrap; gap: 8px; 
      .profile-chip { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0;
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        &.covered { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
      }
    }

    .expedita-info { font-size: 0.75rem; font-weight: 700; color: #94a3b8; 
      .covered { color: #16a34a; display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .eval-option {
      display: flex; justify-content: space-between; align-items: center; width: 100%;
      .eval-main { display: flex; flex-direction: column; }
      .name { font-weight: 600; }
      .badge-perfil { font-size: 0.65rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; width: fit-content; }
      .workload { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;
        &.low { background: #f0fdf4; color: #16a34a; } &.med { background: #fffbeb; color: #d97706; } &.high { background: #fef2f2; color: #dc2626; }
      }
    }

    .evaluator-info {
      display: flex; align-items: center; gap: 12px; padding: 0.5rem 0;
      .avatar-sm { width: 32px; height: 32px; background: #e2e8f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748b; }
      .eval-meta { display: flex; flex-direction: column; .name { font-weight: 700; color: #1e293b; font-size: 0.85rem; } .profile { font-size: 0.7rem; color: #64748b; } }
    }

    .deadline-picker { width: 180px; }
    table { width: 100%; }
    th { background: #f8fafc; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 0.65rem; padding: 1.25rem 1rem; letter-spacing: 0.5px; }
    td { padding: 0.75rem 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }

    .empty-state {
      padding: 5rem 3rem; display: flex; flex-direction: column; align-items: center; color: #94a3b8;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5; }
      p { font-weight: 600; font-size: 0.9rem; }
      h3 { margin-bottom: 0.5rem; color: #1e293b; }
    }

    .text-end { text-align: right; }
    .w-100 { width: 100%; }
    button { font-weight: 800; border-radius: 10px; height: 48px; padding: 0 1.5rem; }
  `]
})
export class AssignmentPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);
  private getDashboardUC = inject(GetEvaluatorsDashboardUseCase);
  private suggestUC = inject(SuggestEvaluatorsUseCase);
  private confirmUC = inject(ConfirmAssignmentUseCase);
  private rejectUC = inject(RejectSuggestionUseCase);
  private getPendingSuggestionsUC = inject(GetPendingSuggestionsUseCase);

  userRole = computed(() => this.authFacade.currentUser()?.rol?.toUpperCase() || 'PRESIDENTE');

  isPresident = computed(() => {
    const role = this.userRole();
    return role.includes('PRESIDENT') || role.includes('ADMIN');
  });

  isSecretary = computed(() => {
    const role = this.userRole();
    return role.includes('SECRETARIA') || role.includes('ADMIN');
  });

  pendingProtocols = signal<any[]>([]);
  suggestedEvaluations = signal<any[]>([]);
  evaluators = signal<EvaluatorEntity[]>([]);
  isLoading = signal<boolean>(true);
  isProcessing = false;

  readonly mandatoryProfiles: EvaluatorProfile[] = ['JURIDICO', 'SALUD', 'METODOLOGIA', 'BIOETICA', 'SOCIEDAD_CIVIL'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Si es secretaria, carga directamente las sugerencias pendientes
    if (this.isSecretary() && !this.isPresident()) {
       this.loadSecretaryView();
    } else {
       this.loadPresidentView();
    }
  }

  loadPresidentView() {
    this.getDashboardUC.execute().subscribe({
      next: (data) => {
        if (data.pendingProtocols) {
          this.pendingProtocols.set(data.pendingProtocols.map((p: any) => ({
            ...p,
            selectedEvaluatorIds: []
          })));
        }
        if (data.evaluators) {
          this.evaluators.set(data.evaluators);
        }

        // También cargamos las sugerencias si el dashboard las incluye
        if (data.suggestedEvaluations) {
          this.suggestedEvaluations.set(data.suggestedEvaluations.map((s: any) => ({
            ...s,
            deadline: s.deadline ? new Date(s.deadline) : null
          })));
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('❌ Error al cargar dashboard de carga', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  loadSecretaryView() {
    this.getPendingSuggestionsUC.execute().subscribe({
      next: (data) => {
        this.suggestedEvaluations.set(data.map((s: any) => ({
          ...s,
          deadline: s.deadline ? new Date(s.deadline) : null
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('❌ Error al cargar sugerencias pendientes', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  getReviewType(type: ProtocolType): 'PLENO' | 'EXPEDITA' {
    return (type === ProtocolType.IO) ? 'EXPEDITA' : 'PLENO';
  }

  isProfileCovered(protocol: any, profile: EvaluatorProfile): boolean {
    if (!protocol.selectedEvaluatorIds) return false;
    return protocol.selectedEvaluatorIds.some((id: string) => {
      const ev = this.evaluators().find(e => e.id === id);
      return ev?.perfil === profile;
    });
  }

  isValidAssignment(protocol: any): boolean {
    const selectedIds = protocol.selectedEvaluatorIds || [];
    const reviewType = this.getReviewType(protocol.type);

    if (reviewType === 'EXPEDITA') {
      return selectedIds.length === 2;
    } else {
      if (selectedIds.length !== 5) return false;
      const profilesCovered = selectedIds.map((id: string) => {
        return this.evaluators().find(e => e.id === id)?.perfil;
      });
      const uniqueProfiles = new Set(profilesCovered);
      return uniqueProfiles.size === 5 && this.mandatoryProfiles.every(p => uniqueProfiles.has(p));
    }
  }

  getWorkloadClass(carga: number): string {
    if (carga <= 2) return 'low';
    if (carga <= 4) return 'med';
    return 'high';
  }

  onSuggest(protocol: any) {
    this.isProcessing = true;
    const evaluatorsWithProfiles = protocol.selectedEvaluatorIds.map((id: string) => {
      const ev = this.evaluators().find(e => e.id === id);
      return { id, profile: ev?.perfil || '' };
    });

    this.suggestUC.execute(protocol.protocolId, evaluatorsWithProfiles, protocol.type).subscribe({
      next: () => {
        this.snackBar.open(`✅ Sugerencia para ${protocol.protocolCode} enviada`, 'Cerrar', { duration: 3000 });
        this.loadData();
        this.isProcessing = false;
      },
      error: (err) => {
        this.snackBar.open(`❌ ${err.message || 'Error en validación'}`, 'Cerrar', { duration: 5000 });
        this.isProcessing = false;
      }
    });
  }

  onReject(suggestion: any) {
    if (!confirm('¿Está seguro de rechazar esta sugerencia?')) return;

    this.isProcessing = true;
    this.rejectUC.execute(suggestion.id).subscribe({
      next: () => {
        this.snackBar.open('✅ Sugerencia rechazada', 'Cerrar', { duration: 3000 });
        this.loadData();
        this.isProcessing = false;
      },
      error: () => {
        this.snackBar.open('❌ Error al rechazar sugerencia', 'Cerrar', { duration: 3000 });
        this.isProcessing = false;
      }
    });
  }

  onConfirm(suggestion: any) {
    if (!suggestion.deadline) return;

    this.isProcessing = true;
    const payload = {
      evaluationId: suggestion.id,
      deadline: suggestion.deadline.toISOString()
    };

    this.confirmUC.execute(payload).subscribe({
      next: () => {
        this.snackBar.open(`✅ Asignación oficializada`, 'Cerrar', { duration: 3000 });
        this.loadData();
        this.isProcessing = false;
      },
      error: () => {
        this.snackBar.open('❌ Error al oficializar', 'Cerrar', { duration: 3000 });
        this.isProcessing = false;
      }
    });
  }
}
