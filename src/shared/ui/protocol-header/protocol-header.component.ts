import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Stage } from '@domain/value-objects/stage.vo';
import { StageBarComponent } from '../stage-bar/stage-bar.component';
import { StageCode } from '@domain/value-objects/stage.vo';
import { WorkspaceStageState } from '@domain/value-objects/workspace-stage-state.vo';
import { StatusChipComponent, StatusTone } from '../status-chip/status-chip.component';

/** Estado del protocolo para el chip: texto y tono (el color siempre va con texto). */
export interface ProtocolHeaderStatus {
  readonly label: string;
  readonly tone: StatusTone;
}

/** Un dato de la línea de datos, por ejemplo `{ label: 'Riesgo', value: 'Mínimo' }`. */
export interface ProtocolHeaderFact {
  readonly label: string;
  readonly value: string | null;
}

/**
 * Encabezado de toda pantalla de un protocolo, igual para los 4 roles (F00 spec-ui §5, EP1).
 * Si falta un dato, no se muestra: nunca un texto de relleno. La acción principal de la pantalla
 * se proyecta con el atributo `protocolHeaderAction` (con su motivo, si está deshabilitada); la
 * página es dueña de ella. Las pestañas de la pantalla van debajo y fuera del componente.
 */
@Component({
  selector: 'app-protocol-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent, StageBarComponent],
  templateUrl: './protocol-header.component.html',
  styleUrl: './protocol-header.component.scss',
})
export class ProtocolHeaderComponent {
  readonly code = input<string | null>(null);
  /** Versión ya lista para mostrar (por ejemplo `v2`). */
  readonly version = input<string | null>(null);
  readonly status = input<ProtocolHeaderStatus | null>(null);
  readonly heading = input.required<string>();
  readonly facts = input<readonly ProtocolHeaderFact[]>([]);
  readonly stage = input<Stage | null>(null);
  readonly selectedStage = input<StageCode | null>(null);
  readonly stageStates = input<Readonly<Partial<Record<StageCode, WorkspaceStageState>>> >({});
  readonly stageLinks = input<Readonly<Partial<Record<StageCode, string>>>>({});
  /** Clic en una etapa que el protocolo aún no alcanza (la pantalla muestra el aviso). */
  readonly notReachedStageClick = output<StageCode>();
  /** Clic en una etapa «no aplica» de un protocolo cerrado. */
  readonly notApplicableStageClick = output<StageCode>();

  /** Chip neutro: código y versión que existan, unidos por "·"; sin ninguno, no hay chip. */
  readonly identity = computed(() => {
    const partes = [this.code(), this.version()].filter(conTexto);
    return partes.length ? partes.join(' · ') : null;
  });

  /** Solo los datos con valor; si no queda ninguno, la línea no existe. */
  readonly visibleFacts = computed(() => this.facts().filter((fact) => conTexto(fact.value)));
}

function conTexto(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
