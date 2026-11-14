import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface ButtonGroupOption {
  id: string;
  label: string;
}

/**
 * Fila de botones rellenos para cambiar de vista dentro de un módulo (spec-ui F00 §5).
 * Un solo botón activo y sin contadores.
 */
@Component({
  selector: 'app-button-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="button-group" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.id) {
        <button
          type="button"
          class="button-group__button"
          [class.button-group__button--active]="option.id === active()"
          [attr.aria-pressed]="option.id === active()"
          (click)="active.set(option.id)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './button-group.component.scss',
})
export class ButtonGroupComponent {
  readonly options = input.required<readonly ButtonGroupOption[]>();
  readonly active = model.required<string>();
  readonly label = input<string>();
}
