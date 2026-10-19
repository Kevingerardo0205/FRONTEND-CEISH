import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TarjetaEvaluadorComponent } from '../../components/tarjeta-evaluador/tarjeta-evaluador.component';
import {
  ModalReasignacionComponent,
  ModalReasignacionData,
  REASSIGN_SUCCESS_MESSAGE
} from '../../components/modal-reasignacion/modal-reasignacion.component';
import { TablaHistorialReasignacionesComponent } from '../../components/tabla-historial-reasignaciones/tabla-historial-reasignaciones.component';
import { LoadAssignmentHistoryUseCase } from '../../../application/load-assignment-history.use-case';
import { LoadActiveAssignmentsUseCase } from '../../../application/load-active-assignments.use-case';
import {
  ActiveAssignment,
  ActiveAssignmentsResult,
  AssignmentHistoryEntry
} from '@domain/entities/peer-evaluation.entity';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import { canReassign } from '../../utils/active-assignment-view.util';

type LoadOutcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

function settle<T>(source$: Observable<T>): Observable<LoadOutcome<T>> {
  return source$.pipe(
    map((value): LoadOutcome<T> => ({ ok: true, value })),
    catchError((error: unknown) => of<LoadOutcome<T>>({ ok: false, error }))
  );
}

/** El protocolId de la ruta debe ser un entero positivo en base 10 (sin signos, decimales ni espacios). */
export function parseProtocolId(raw: string | null): number | null {
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

@Component({
  selector: 'app-reassignment-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TarjetaEvaluadorComponent,
    TablaHistorialReasignacionesComponent
  ],
  templateUrl: './reassignment.page.html',
  styleUrls: ['./reassignment.page.scss']
})
export class ReassignmentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly loadActiveAssignmentsUseCase = inject(LoadActiveAssignmentsUseCase);
  private readonly loadHistoryUseCase = inject(LoadAssignmentHistoryUseCase);

  readonly protocolId = signal<number | null>(null);
  readonly protocolInfo = signal<ActiveAssignmentsResult | null>(null);
  readonly auditHistory = signal<AssignmentHistoryEntry[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly historyWarning = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly activeAssignments = computed(() => this.protocolInfo()?.assignments ?? []);
  readonly hasActiveAssignments = computed(() => this.activeAssignments().length > 0);

  readonly canReassign = canReassign;

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('protocolId') ?? this.route.snapshot.paramMap.get('id');
    const id = parseProtocolId(raw);
    if (id === null) {
      this.errorMessage.set(
        `El identificador de protocolo "${raw ?? ''}" no es válido: debe ser un número entero positivo.`
      );
      return;
    }
    this.protocolId.set(id);
    this.loadData();
  }

  loadData(): void {
    const id = this.protocolId();
    if (id === null) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.historyWarning.set(null);

    forkJoin({
      assignments: settle(this.loadActiveAssignmentsUseCase.execute(id)),
      history: settle(this.loadHistoryUseCase.execute(id))
    }).subscribe(({ assignments, history }) => {
      if (assignments.ok) {
        this.protocolInfo.set(assignments.value);
      } else {
        this.protocolInfo.set(null);
        this.errorMessage.set(
          extractApiErrorMessage(assignments.error, 'No se pudieron cargar las asignaciones activas del protocolo.')
        );
      }

      if (history.ok) {
        this.auditHistory.set(history.value);
      } else {
        this.auditHistory.set([]);
        this.historyWarning.set(
          'No se pudo cargar el historial de reasignaciones: ' +
            extractApiErrorMessage(history.error, 'error desconocido.')
        );
      }

      this.isLoading.set(false);
    });
  }

  openReassignModal(assignment: ActiveAssignment): void {
    const modalData: ModalReasignacionData = {
      outgoingAssignment: assignment,
      activeEvaluatorIds: this.activeAssignments().map(a => a.evaluatorId)
    };

    const dialogRef = this.dialog.open(ModalReasignacionComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: modalData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((reassigned: boolean | null) => {
      if (reassigned) {
        this.successMessage.set(REASSIGN_SUCCESS_MESSAGE);
        this.snack.open(REASSIGN_SUCCESS_MESSAGE, 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadData();
      }
    });
  }
}
