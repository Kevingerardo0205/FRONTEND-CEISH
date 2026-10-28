import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { UndoToastService, UndoToastTone } from './undo-toast.service';

/** Presentación de un aviso: mensaje, "Deshacer" opcional y cerrar. */
@Component({
  selector: 'app-undo-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast" [class]="'toast toast--' + tone()">
      <span class="toast__message">{{ message() }}</span>
      @if (canUndo()) {
        <button type="button" class="toast__undo" (click)="undo.emit()">Deshacer</button>
      }
      <button type="button" class="toast__close" aria-label="Cerrar aviso" (click)="dismiss.emit()">
        ×
      </button>
    </div>
  `,
  styleUrl: './undo-toast.component.scss',
})
export class UndoToastComponent {
  readonly message = input.required<string>();
  readonly tone = input<UndoToastTone>('success');
  readonly canUndo = input(false);

  readonly undo = output<void>();
  readonly dismiss = output<void>();
}

/**
 * Región de avisos. Se monta una sola vez, en el componente raíz.
 * La región aria-live existe siempre para que los lectores de pantalla anuncien cada aviso.
 */
@Component({
  selector: 'app-undo-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UndoToastComponent],
  template: `
    <div class="toast-host" role="status" aria-live="polite">
      @if (service.toast(); as toast) {
        <app-undo-toast
          [message]="toast.message"
          [tone]="toast.tone"
          [canUndo]="!!toast.undo"
          (undo)="service.undo()"
          (dismiss)="service.dismiss()"
        />
      }
    </div>
  `,
  styleUrl: './undo-toast.component.scss',
})
export class UndoToastHostComponent {
  protected readonly service = inject(UndoToastService);
}
