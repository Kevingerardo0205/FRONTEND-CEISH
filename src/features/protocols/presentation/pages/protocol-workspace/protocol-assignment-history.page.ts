import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AssignmentHistoryEntry, ActiveAssignmentsResult } from '@domain/entities/peer-evaluation.entity';
import { LoadActiveAssignmentsUseCase } from '@features/evaluations/application/load-active-assignments.use-case';
import { LoadAssignmentHistoryUseCase } from '@features/evaluations/application/load-assignment-history.use-case';
import { WorkspaceInformationState } from '../../../domain/workspace-stage-state';

@Component({
  selector: 'app-protocol-assignment-history',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="assignment-history" aria-labelledby="assignment-history-title">
      <header class="assignment-history__header">
        <p class="assignment-history__eyebrow">Expediente · Asignación</p>
        <h2 id="assignment-history-title">Consulta de asignación</h2>
        <p>Consulta de solo lectura de las asignaciones y reasignaciones registradas.</p>
      </header>

      @if (informationState().kind === 'loading') {
        <p role="status">Cargando información de asignación…</p>
      } @else if (informationState().kind === 'error') {
        <p role="alert">No pudimos consultar el historial de asignación.</p>
      } @else if (informationState().kind === 'empty' && !hasRecords()) {
        <p role="status">Sin registros de asignación confirmados para este protocolo.</p>
      } @else if (informationState().kind === 'unavailable') {
        <p role="status">Fuente no disponible para consultar la asignación.</p>
      } @else {
        @if (activeAssignments().length) {
          <section aria-labelledby="active-assignments-title">
            <h3 id="active-assignments-title">Asignaciones registradas</h3>
            <div class="assignment-history__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Evaluador</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha de asignación</th>
                  </tr>
                </thead>
                <tbody>
                  @for (assignment of activeAssignments(); track assignment.assignmentId) {
                    <tr>
                      <td>{{ assignment.evaluatorFullName }}</td>
                      <td>{{ assignment.evaluatorProfile ?? 'Perfil no disponible' }}</td>
                      <td>{{ assignment.status }}</td>
                      <td>{{ assignment.assignedAt ?? 'Fecha no disponible' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (history().length) {
          <section aria-labelledby="assignment-reassignments-title">
            <h3 id="assignment-reassignments-title">Historial de reasignaciones</h3>
            <ul>
              @for (entry of history(); track entry.id) {
                <li>
                  <strong>{{ entry.previousEvaluatorName }} → {{ entry.newEvaluatorName }}</strong>
                  <span>{{ entry.reassignmentReason }} · {{ entry.executedAt }}</span>
                </li>
              }
            </ul>
          </section>
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .assignment-history { padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--c-border); border-radius: var(--radius-card); background: var(--c-surface); }
    .assignment-history__header { margin-bottom: 1.5rem; }
    .assignment-history__eyebrow { margin: 0 0 .25rem; color: var(--c-text-2); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
    h2, h3 { color: var(--c-text); }
    .assignment-history__table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .75rem; border-bottom: 1px solid var(--c-border); text-align: left; }
    th { color: var(--c-text-2); font-size: .8rem; }
    ul { display: grid; gap: .75rem; padding-left: 1.25rem; }
    li { display: grid; gap: .25rem; color: var(--c-text); }
    li span { color: var(--c-text-2); }
  `,
})
export class ProtocolAssignmentHistoryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly loadActiveAssignments = inject(LoadActiveAssignmentsUseCase);
  private readonly loadHistory = inject(LoadAssignmentHistoryUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly informationState = signal<WorkspaceInformationState>({ kind: 'loading' });
  readonly activeAssignments = signal<ActiveAssignmentsResult['assignments']>([]);
  readonly history = signal<AssignmentHistoryEntry[]>([]);
  readonly protocolId = signal<number | null>(null);
  readonly hasRecords = signal(false);

  ngOnInit(): void {
    const rawId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    const protocolId = /^\d+$/.test(rawId) ? Number(rawId) : 0;
    this.protocolId.set(protocolId > 0 ? protocolId : null);
    if (protocolId <= 0) {
      this.informationState.set({ kind: 'unavailable' });
      return;
    }

    forkJoin({
      active: this.loadActiveAssignments.execute(protocolId),
      history: this.loadHistory.execute(protocolId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ active, history }) => {
          this.activeAssignments.set(active.assignments);
          this.history.set(history);
          this.hasRecords.set(active.assignments.length > 0 || history.length > 0);
          this.informationState.set({ kind: 'empty' });
        },
        error: () => {
          this.activeAssignments.set([]);
          this.history.set([]);
          this.hasRecords.set(false);
          this.informationState.set({ kind: 'error' });
        },
      });
  }
}
