import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Stage, StageCode } from '@domain/value-objects/stage.vo';
import { WorkspaceStageState, isStageNotReached } from '@domain/value-objects/workspace-stage-state.vo';

export type StageStatus =
  | 'completed'
  | 'in-progress'
  | 'pending'
  | 'closed'
  | 'not-applicable'
  | 'unavailable'
  | 'undetermined';

/** Texto oculto con el estado de cada etapa (F00 §5, EP1; ep2c §3.4). */
const STATUS_TEXT: Readonly<Record<StageStatus, string>> = {
  completed: 'completada',
  'in-progress': 'en curso',
  pending: 'pendiente',
  closed: 'cerrada',
  'not-applicable': 'no aplica',
  unavailable: 'no disponible',
  undetermined: 'estado no determinado',
};

function toStageStatus(state: WorkspaceStageState | undefined): StageStatus {
  if (state?.kind === 'unavailable') return 'unavailable';
  if (state?.kind !== 'determined') return 'undetermined';
  switch (state.status) {
    case 'COMPLETADA':
      return 'completed';
    case 'EN_CURSO':
      return 'in-progress';
    case 'CERRADA':
      return 'closed';
    case 'NO_APLICA':
      return 'not-applicable';
    default:
      return 'pending';
  }
}

/**
 * Barra de las 6 etapas del protocolo (spec-ui F00 §5; aspecto del canvas desde EP1).
 * Recibe la etapa actual tal como la devuelve el backend; no la calcula.
 */
@Component({
  selector: 'app-stage-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './stage-bar.component.html',
  styleUrl: './stage-bar.component.scss',
})
export class StageBarComponent {
  readonly stage = input<Stage | null>(null);
  readonly selectedStage = input<StageCode | null>(null);
  readonly stageStates = input<Readonly<Partial<Record<StageCode, WorkspaceStageState>>> >({});
  readonly links = input<Readonly<Partial<Record<StageCode, string>>>>({});
  /** Texto corto bajo la etapa actual, por ejemplo "Riesgo fijado · 3 de 4 dictámenes". */
  readonly detail = input<string>();
  /** Clic en una etapa posterior a la actual: no navega; la pantalla muestra el aviso (F11-41). */
  readonly notReachedClick = output<StageCode>();

  readonly steps = computed(() => {
    const current = this.stage();
    const selected = this.selectedStage() ?? (Object.keys(this.links()).length ? null : current?.code ?? null);
    const states = this.stageStates();
    const links = this.links();

    return Stage.all().map((stage) => {
      const status = toStageStatus(states[stage.code]);

      const isCurrent = current?.code === stage.code;
      const notReached = isStageNotReached(current, states[stage.code], stage);

      return {
        stage,
        status,
        /** Texto oculto: la etapa actual no pierde que esté cerrada (ep2c §4.2). */
        announce: isCurrent
          ? status === 'closed'
            ? 'etapa actual, cerrada'
            : 'etapa actual'
          : notReached
            ? 'etapa pendiente, aún no disponible'
            : STATUS_TEXT[status],
        notReached,
        current: isCurrent,
        selected: !notReached && selected === stage.code,
        link: notReached ? null : (links[stage.code] ?? null),
      };
    });
  });
}
