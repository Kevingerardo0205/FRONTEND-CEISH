import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Stage } from '@domain/value-objects/stage.vo';

export type StageStatus = 'done' | 'current' | 'pending';

/**
 * Barra de las 6 etapas del protocolo (spec-ui F00 §5).
 * Recibe la etapa actual tal como la devuelve el backend; no la calcula.
 */
@Component({
  selector: 'app-stage-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage-bar.component.html',
  styleUrl: './stage-bar.component.scss',
})
export class StageBarComponent {
  readonly stage = input.required<Stage>();
  /** Texto corto bajo la etapa actual, por ejemplo "Riesgo fijado · 3 de 4 dictámenes". */
  readonly detail = input<string>();

  readonly steps = computed(() => {
    const current = this.stage().order;
    return Stage.all().map((stage) => ({
      stage,
      status: (stage.order < current
        ? 'done'
        : stage.order === current
          ? 'current'
          : 'pending') as StageStatus,
    }));
  });
}
