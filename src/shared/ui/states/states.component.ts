import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Estados de carga (spec-ui F00 §5). Mensajes en lenguaje del comité, no técnico. */

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state state--empty">
      <p class="state__message">{{ message() }}</p>
      @if (hint()) {
        <p class="state__hint">{{ hint() }}</p>
      }
    </div>
  `,
  styleUrl: './states.component.scss',
})
export class EmptyStateComponent {
  readonly message = input('No hay nada por aquí todavía.');
  readonly hint = input<string>();
}

@Component({
  selector: 'app-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state state--loading" role="status" aria-live="polite">
      <span class="state__spinner" aria-hidden="true"></span>
      <p class="state__message">{{ message() }}</p>
    </div>
  `,
  styleUrl: './states.component.scss',
})
export class LoadingStateComponent {
  readonly message = input('Cargando…');
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state state--error" role="alert">
      <p class="state__message">{{ message() }}</p>
      @if (showRetry()) {
        <button type="button" class="state__retry" (click)="retry.emit()">
          {{ retryLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './states.component.scss',
})
export class ErrorStateComponent {
  readonly message = input('No pudimos cargar la información. Intente de nuevo.');
  readonly retryLabel = input('Reintentar');
  readonly showRetry = input(true);
  readonly retry = output<void>();
}
