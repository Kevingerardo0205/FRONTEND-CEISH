import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

let nextId = 0;

/**
 * Panel que se despliega dentro de la página (spec-ui F00 §5), por ejemplo para escribir
 * el motivo de una observación o corregir una decisión. Cancelar lo cierra; Confirmar
 * emite y la pantalla decide cuándo cerrarlo.
 */
@Component({
  selector: 'app-inline-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <section class="inline-panel" [attr.aria-labelledby]="headingId">
        <h3 class="inline-panel__title" [id]="headingId">{{ heading() }}</h3>
        <div class="inline-panel__body">
          <ng-content />
        </div>
        <div class="inline-panel__actions">
          <button type="button" class="inline-panel__button" (click)="cancel()">
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="inline-panel__button inline-panel__button--primary"
            [disabled]="confirmDisabled()"
            (click)="confirmed.emit()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </section>
    }
  `,
  styleUrl: './inline-panel.component.scss',
})
export class InlinePanelComponent {
  readonly heading = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmDisabled = input(false);
  readonly open = model(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly headingId = `inline-panel-heading-${nextId++}`;

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }
}
