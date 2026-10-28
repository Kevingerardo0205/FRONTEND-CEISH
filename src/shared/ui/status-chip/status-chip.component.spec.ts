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
});
