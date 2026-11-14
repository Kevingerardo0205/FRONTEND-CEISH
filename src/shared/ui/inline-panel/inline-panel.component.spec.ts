import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlinePanelComponent } from './inline-panel.component';

@Component({
  standalone: true,
  imports: [InlinePanelComponent],
  template: `
    <app-inline-panel
      heading="Corregir decisión"
      confirmLabel="Guardar corrección"
      [confirmDisabled]="disabled()"
      [(open)]="open"
      (confirmed)="confirmed = confirmed + 1"
      (cancelled)="cancelled = cancelled + 1"
    >
      <textarea class="motivo" aria-label="Motivo"></textarea>
    </app-inline-panel>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly disabled = signal(false);
  confirmed = 0;
  cancelled = 0;
}

describe('InlinePanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;
  const panel = () => el.querySelector('.inline-panel') as HTMLElement | null;
  const buttons = () => Array.from(panel()!.querySelectorAll('button')) as HTMLButtonElement[];

  function openPanel(): void {
    host.open.set(true);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('cerrado no se muestra', () => {
    expect(panel()).toBeNull();
  });

  it('abierto muestra título, contenido y los botones Cancelar y Confirmar', () => {
    openPanel();

    const title = el.querySelector(`#${panel()!.getAttribute('aria-labelledby')}`);
    expect(title?.textContent).toContain('Corregir decisión');
    expect(panel()!.querySelector('textarea.motivo')).not.toBeNull();
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Cancelar', 'Guardar corrección']);
  });

  it('Cancelar lo cierra y emite', () => {
    openPanel();

    buttons()[0].click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(host.open()).toBeFalse();
    expect(host.cancelled).toBe(1);
  });

  it('Confirmar emite y lo deja abierto hasta que la pantalla lo cierre', () => {
    openPanel();

    buttons()[1].click();
    fixture.detectChanges();

    expect(host.confirmed).toBe(1);
    expect(panel()).not.toBeNull();
  });

  it('Confirmar puede estar deshabilitado', () => {
    host.disabled.set(true);
    openPanel();

    expect(buttons()[1].disabled).toBeTrue();
  });
});
