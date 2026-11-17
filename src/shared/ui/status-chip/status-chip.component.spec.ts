import { TestBed } from '@angular/core/testing';
import { StatusChipComponent, StatusTone } from './status-chip.component';

describe('StatusChipComponent', () => {
  const tones: StatusTone[] = ['verde', 'ambar', 'rojo', 'azul', 'gris'];

  beforeEach(() => TestBed.configureTestingModule({ imports: [StatusChipComponent] }));

  tones.forEach((tone) => {
    it(`tono ${tone}: aplica su clase y muestra el texto`, () => {
      const fixture = TestBed.createComponent(StatusChipComponent);
      fixture.componentRef.setInput('tone', tone);
      fixture.componentRef.setInput('label', 'En evaluación');
      fixture.detectChanges();

      const chip = (fixture.nativeElement as HTMLElement).querySelector('.chip') as HTMLElement;
      expect(chip.classList).toContain(`chip--${tone}`);
      expect(chip.textContent?.trim()).toBe('En evaluación');
    });
  });

  function chipCon(partir?: boolean): HTMLElement {
    const fixture = TestBed.createComponent(StatusChipComponent);
    fixture.componentRef.setInput('tone', 'azul');
    fixture.componentRef.setInput('label', 'Recepción completa · acepte los tiempos');
    if (partir !== undefined) fixture.componentRef.setInput('partir', partir);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.chip') as HTMLElement;
  }

  it('(F09 D29) sin partir queda como hoy: en una línea y sin la clase chip--partir', () => {
    const chip = chipCon();
    expect(chip.classList).toContain('chip--azul');
    expect(chip.classList).not.toContain('chip--partir');
    expect(getComputedStyle(chip).whiteSpace).toBe('nowrap');
  });

  it('(F09 D29) con partir el texto puede ocupar varias líneas y conserva su tono', () => {
    const chip = chipCon(true);
    expect(chip.classList).toContain('chip--azul');
    expect(chip.classList).toContain('chip--partir');
    expect(getComputedStyle(chip).whiteSpace).toBe('normal');
  });
});
