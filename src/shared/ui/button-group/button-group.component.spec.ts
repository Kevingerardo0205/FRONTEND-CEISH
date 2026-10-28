import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonGroupComponent } from './button-group.component';

describe('ButtonGroupComponent', () => {
  let fixture: ComponentFixture<ButtonGroupComponent>;
  let el: HTMLElement;
  const buttons = () => Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ButtonGroupComponent] });
    fixture = TestBed.createComponent(ButtonGroupComponent);
    fixture.componentRef.setInput('options', [
      { id: 'recepcion', label: 'Recepción' },
      { id: 'asignacion', label: 'Asignación' },
      { id: 'evaluacion', label: 'Evaluación' },
    ]);
    fixture.componentRef.setInput('active', 'asignacion');
    fixture.componentRef.setInput('label', 'Etapas');
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('muestra un botón por opción, solo con su texto', () => {
    expect(buttons().map((b) => b.textContent?.trim())).toEqual([
      'Recepción',
      'Asignación',
      'Evaluación',
    ]);
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Etapas');
  });

  it('marca un solo botón activo', () => {
    const pressed = buttons().filter((b) => b.getAttribute('aria-pressed') === 'true');

    expect(pressed.length).toBe(1);
    expect(pressed[0].textContent?.trim()).toBe('Asignación');
    expect(pressed[0].classList).toContain('button-group__button--active');
  });

  it('al pulsar otro botón cambia el activo y lo emite', () => {
    const changes: string[] = [];
    fixture.componentInstance.active.subscribe((v) => changes.push(v));

    buttons()[2].click();
    fixture.detectChanges();

    expect(changes).toEqual(['evaluacion']);
    expect(buttons()[2].getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');
  });
});
