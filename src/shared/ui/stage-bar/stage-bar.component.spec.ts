import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stage } from '@domain/value-objects/stage.vo';
import { StageBarComponent } from './stage-bar.component';

describe('StageBarComponent', () => {
  let fixture: ComponentFixture<StageBarComponent>;

  function render(code: string, detail?: string): HTMLElement {
    fixture.componentRef.setInput('stage', Stage.fromBackend(code));
    if (detail !== undefined) fixture.componentRef.setInput('detail', detail);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function item(el: HTMLElement, code: string): HTMLElement {
    return el.querySelector(`li[data-stage="${code}"]`) as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StageBarComponent] });
    fixture = TestBed.createComponent(StageBarComponent);
  });

  it('muestra las 6 etapas en orden dentro de una lista ordenada', () => {
    const el = render('RECEPCION');
    const labels = Array.from(el.querySelectorAll('ol > li .step__label')).map((n) =>
      n.textContent?.trim(),
    );

    expect(labels).toEqual([
      'Recepción',
      'Asignación',
      'Evaluación',
      'Resolución',
      'Seguimiento',
      'Renovación',
    ]);
  });

  it('criterio 2: con EVALUACION, Recepción y Asignación con ✓, Evaluación actual y el resto pendiente', () => {
    const el = render('EVALUACION');

    for (const code of ['RECEPCION', 'ASIGNACION']) {
      expect(item(el, code).classList).toContain('step--done');
      expect(item(el, code).querySelector('.step__marker')?.textContent?.trim()).toBe('✓');
    }

    const current = item(el, 'EVALUACION');
    expect(current.classList).toContain('step--current');
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(current.querySelector('.step__marker')?.textContent?.trim()).toBe('3');

    for (const code of ['RESOLUCION', 'SEGUIMIENTO', 'RENOVACION']) {
      expect(item(el, code).classList).toContain('step--pending');
      expect(item(el, code).hasAttribute('aria-current')).toBeFalse();
    }
  });

  it('solo una etapa tiene aria-current', () => {
    const el = render('SEGUIMIENTO');

    expect(el.querySelectorAll('[aria-current]').length).toBe(1);
  });

  it('anuncia el estado de cada etapa para lectores de pantalla', () => {
    const el = render('ASIGNACION');

    expect(item(el, 'RECEPCION').textContent).toContain('(completada)');
    expect(item(el, 'RESOLUCION').textContent).toContain('(pendiente)');
  });

  it('muestra el texto corto solo bajo la etapa actual', () => {
    const el = render('EVALUACION', 'Riesgo fijado · 3 de 4 dictámenes');
    const details = el.querySelectorAll('.step__detail');

    expect(details.length).toBe(1);
    expect(item(el, 'EVALUACION').querySelector('.step__detail')?.textContent).toBe(
      'Riesgo fijado · 3 de 4 dictámenes',
    );
  });

  it('sin texto corto no muestra el detalle', () => {
    const el = render('EVALUACION');

    expect(el.querySelector('.step__detail')).toBeNull();
  });
});
