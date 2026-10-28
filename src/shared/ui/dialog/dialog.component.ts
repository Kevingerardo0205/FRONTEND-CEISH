import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

let nextId = 0;

/**
 * Ventana flotante de confirmación (spec-ui F00 §5 y §6.2).
 * Úsala solo para acciones irreversibles (enviar un correo oficial, firmar); para lo
 * reversible se usa UndoToast. El foco queda atrapado dentro, Esc la cierra y al cerrarse
 * el foco vuelve al elemento que la abrió.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  readonly heading = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmDisabled = input(false);
  readonly open = model(false);

  /** El diálogo no se cierra solo al confirmar: la pantalla decide cuándo cerrarlo. */
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  readonly headingId = `dialog-heading-${nextId++}`;

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }
}
