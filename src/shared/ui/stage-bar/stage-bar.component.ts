import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Stage, StageCode } from '@domain/value-objects/stage.vo';
import { WorkspaceStageState } from '@domain/value-objects/workspace-stage-state.vo';

export type StageStatus = 'completed' | 'in-progress' | 'pending' | 'undetermined';

/** Texto oculto con el estado de cada etapa (F00 §5, EP1). */
const STATUS_TEXT: Readonly<Record<StageStatus, string>> = {
  completed: 'completada',
  'in-progress': 'en curso',
  pending: 'pendiente',
  undetermined: 'estado no determinado',
};

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

  protected readonly statusText = STATUS_TEXT;

  readonly steps = computed(() => {
    const current = this.stage();
    const selected = this.selectedStage() ?? (Object.keys(this.links()).length ? null : current?.code ?? null);
    const states = this.stageStates();
    const links = this.links();

    return Stage.all().map((stage) => {
      const state = states[stage.code];
      const status: StageStatus =
        state?.kind === 'determined'
          ? state.status === 'COMPLETADA'
            ? 'completed'
            : state.status === 'EN_CURSO'
              ? 'in-progress'
              : 'pending'
          : 'undetermined';

      return {
        stage,
        status,
        current: current?.code === stage.code,
        selected: selected === stage.code,
        link: links[stage.code] ?? null,
      };
    });
  });
}
