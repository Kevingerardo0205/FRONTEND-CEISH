import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusTone = 'verde' | 'ambar' | 'rojo' | 'azul' | 'gris';

/** Etiqueta de estado con 5 tonos (spec-ui F00 §5). El color siempre va con texto. */
@Component({
  selector: 'app-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class]="'chip chip--' + tone()">{{ label() }}</span>`,
  styleUrl: './status-chip.component.scss',
})
export class StatusChipComponent {
  readonly tone = input.required<StatusTone>();
  readonly label = input.required<string>();
}
