import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

let nextId = 0;

/**
 * Encabezado de página con una sola acción principal (spec-ui F00 §5 y §6.1).
 * Si hay `disabledReason`, la acción se deshabilita y se muestra el motivo.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
  readonly actionLabel = input<string>();
  readonly actionHelp = input<string>();
  readonly disabledReason = input<string>();

  readonly action = output<void>();

  readonly hintId = `page-header-hint-${nextId++}`;

  onAction(): void {
    if (!this.disabledReason()) this.action.emit();
  }
}
