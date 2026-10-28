import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

@Component({
  standalone: true,
  imports: [DialogComponent],
  template: `
    <button type="button" class="opener" (click)="open.set(true)">Enviar resolución</button>
    <app-dialog
      heading="Enviar resolución"
      confirmLabel="Enviar"
      [confirmDisabled]="disabled()"
      [(open)]="open"
      (confirmed)="confirmed = confirmed + 1"
      (closed)="closed = closed + 1"
    >
      <p>Se enviará un correo oficial al investigador.</p>
      <input class="nota" />
    </app-dialog>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly disabled = signal(false);
  confirmed = 0;
  closed = 0;
}

describe('DialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;
  const dialog = () => el.querySelector('[role="dialog"]') as HTMLElement | null;
  const buttons = () => Array.from(dialog()!.querySelectorAll('button')) as HTMLButtonElement[];

  async function openFromButton(): Promise<HTMLButtonElement> {
    const opener = el.querySelector('.opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return opener;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
    document.body.appendChild(el);
  });

  afterEach(() => el.remove());

  it('cerrado no muestra nada', () => {
    expect(dialog()).toBeNull();
  });

  it('abierto es un diálogo modal etiquetado por su título, con el contenido proyectado', async () => {
    await openFromButton();

    expect(dialog()!.getAttribute('aria-modal')).toBe('true');
    const title = el.querySelector(`#${dialog()!.getAttribute('aria-labelledby')}`);
    expect(title?.textContent).toContain('Enviar resolución');
    expect(dialog()!.textContent).toContain('Se enviará un correo oficial');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Cancelar', 'Enviar']);
  });

  it('al abrir, el foco entra al diálogo y queda atrapado', async () => {
    await openFromButton();

    expect(dialog()!.contains(document.activeElement)).toBeTrue();

    const anchors = el.querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor');
    expect(anchors.length).toBe(2);
    anchors[1].focus();
    expect(dialog()!.contains(document.activeElement)).toBeTrue();
    anchors[0].focus();
    expect(dialog()!.contains(document.activeElement)).toBeTrue();
  });

  it('Esc lo cierra y el foco vuelve al botón que lo abrió', async () => {
    const opener = await openFromButton();

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialog()).toBeNull();
    expect(host.open()).toBeFalse();
    expect(host.closed).toBe(1);
    expect(document.activeElement).toBe(opener);
  });

  it('Cancelar lo cierra', async () => {
    await openFromButton();

    buttons()[0].click();
    fixture.detectChanges();

    expect(dialog()).toBeNull();
    expect(host.closed).toBe(1);
  });

  it('Confirmar emite y deja que la pantalla decida cuándo cerrar', async () => {
    await openFromButton();

    buttons()[1].click();
    fixture.detectChanges();

    expect(host.confirmed).toBe(1);
    expect(dialog()).not.toBeNull();
  });

  it('la acción principal puede estar deshabilitada', async () => {
    host.disabled.set(true);
    await openFromButton();

    expect(buttons()[1].disabled).toBeTrue();
  });

  it('close() con el diálogo cerrado no emite', () => {
    const dialogCmp = fixture.debugElement.children
      .map((c) => c.componentInstance)
      .find((c): c is DialogComponent => c instanceof DialogComponent)!;

    dialogCmp.close();

    expect(host.closed).toBe(0);
  });
});
