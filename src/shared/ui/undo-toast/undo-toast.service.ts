import { Injectable, signal } from '@angular/core';

export type UndoToastTone = 'info' | 'success' | 'error';

export interface UndoToastOptions {
  message: string;
  /** Acción inversa. Si existe, el aviso muestra el botón "Deshacer". */
  undo?: () => void;
  /** Milisegundos hasta que el aviso se cierra solo. */
  duration?: number;
  tone?: UndoToastTone;
}

export interface UndoToast {
  id: number;
  message: string;
  tone: UndoToastTone;
  undo?: () => void;
}

export const UNDO_TOAST_DEFAULT_DURATION = 5000;

/**
 * Aviso de éxito con "Deshacer" (spec-ui F00 §5 y §6.2): reemplaza los "¿Está seguro?"
 * en acciones reversibles. Un solo aviso a la vez; uno nuevo reemplaza al anterior.
 */
@Injectable({ providedIn: 'root' })
export class UndoToastService {
  private readonly current = signal<UndoToast | null>(null);
  readonly toast = this.current.asReadonly();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 0;

  show(options: UndoToastOptions): void {
    this.clearTimer();
    this.current.set({
      id: ++this.nextId,
      message: options.message,
      tone: options.tone ?? 'success',
      undo: options.undo,
    });
    this.timer = setTimeout(() => this.dismiss(), options.duration ?? UNDO_TOAST_DEFAULT_DURATION);
  }

  undo(): void {
    const toast = this.current();
    if (!toast?.undo) return;
    this.dismiss();
    toast.undo();
  }

  dismiss(): void {
    this.clearTimer();
    this.current.set(null);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
