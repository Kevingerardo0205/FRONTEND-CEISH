import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stage } from '@domain/value-objects/stage.vo';
import { StageBarComponent } from './stage-bar.component';

describe('StageBarComponent', () => {
  let fixture: ComponentFixture<StageBarComponent>;

  function render(code: string, detail?: string): HTMLElement {
    fixture.componentRef.setInput('stage', Stage.fromBackend(code));
    fixture.componentRef.setInput('selectedStage', code);
    const current = Stage.fromBackend(code).order;
    fixture.componentRef.setInput(
      'stageStates',
      Object.fromEntries(
        Stage.all().map((stage) => [
          stage.code,
          {
            kind: 'determined',
            status: stage.order < current ? 'COMPLETADA' : stage.order === current ? 'EN_CURSO' : 'PENDIENTE',
          },
        ]),
      ),
    );
    if (detail !== undefined) fixture.componentRef.setInput('detail', detail);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function item(el: HTMLElement, code: string): HTMLElement {
    return el.querySelector(`li[data-stage="${code}"]`) as HTMLElement;
  }

  function hiddenText(li: HTMLElement): string | undefined {
    return li.querySelector('.visually-hidden')?.textContent?.trim();
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

    expect(el.querySelector('ol')?.getAttribute('aria-label')).toBe('Etapas del protocolo');
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
      expect(item(el, code).querySelector('.step__check')?.textContent?.trim()).toBe('✓');
    }

    const current = item(el, 'EVALUACION');
    expect(current.classList).toContain('step--current');
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(current.querySelector('.step__check')).toBeNull();

    for (const code of ['RESOLUCION', 'SEGUIMIENTO', 'RENOVACION']) {
      expect(item(el, code).classList).toContain('step--pending');
      expect(item(el, code).hasAttribute('aria-current')).toBeFalse();
      expect(item(el, code).querySelector('.step__check')).toBeNull();
    }
  });

  it('cada etapa tiene su barra, oculta para lectores de pantalla', () => {
    const el = render('RESOLUCION');
    const bars = el.querySelectorAll('li > .step__bar');

    expect(bars.length).toBe(6);
    bars.forEach((bar) => expect(bar.getAttribute('aria-hidden')).toBe('true'));
  });

  it('solo una etapa tiene aria-current', () => {
    const el = render('SEGUIMIENTO');

    expect(el.querySelectorAll('[aria-current]').length).toBe(1);
    expect(el.querySelector('[aria-current="step"]')?.getAttribute('data-stage')).toBe('SEGUIMIENTO');
  });

  it('anuncia con texto oculto "completada", "etapa actual" o "pendiente"', () => {
    const el = render('ASIGNACION');

    expect(hiddenText(item(el, 'RECEPCION'))).toBe(', completada');
    expect(hiddenText(item(el, 'ASIGNACION'))).toBe(', etapa actual');
    for (const code of ['EVALUACION', 'RESOLUCION', 'SEGUIMIENTO', 'RENOVACION']) {
      expect(hiddenText(item(el, code))).withContext(code).toBe(', pendiente');
    }
  });

  it('con RECEPCION ninguna etapa está completada', () => {
    const el = render('RECEPCION');

    expect(el.querySelectorAll('.step--done').length).toBe(0);
    expect(hiddenText(item(el, 'RECEPCION'))).toBe(', etapa actual');
  });

  it('con RENOVACION las 5 anteriores están completadas', () => {
    const el = render('RENOVACION');

    expect(el.querySelectorAll('.step--done').length).toBe(5);
    expect(el.querySelectorAll('.step--pending').length).toBe(0);
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

  it('no infiere estados individuales cuando no recibe una fuente de estados', () => {
    fixture.componentRef.setInput('stage', Stage.fromBackend('EVALUACION'));
    fixture.componentRef.setInput('selectedStage', 'RESOLUCION');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.step--done, .step--completed, .step--pending').length).toBe(0);
    expect(el.querySelectorAll('.step--undetermined').length).toBe(6);
    expect(el.querySelector('[aria-current="step"]')?.getAttribute('data-stage')).toBe('RESOLUCION');
  });
});

@Component({
  standalone: true,
  imports: [StageBarComponent],
  template: `<div class="ancho" [style.width.px]="ancho()"><app-stage-bar [stage]="stage" /></div>`,
})
class AnchoHostComponent {
  readonly ancho = signal(1000);
  readonly stage = Stage.fromBackend('EVALUACION');
}

describe('StageBarComponent - rejilla sin desplazamiento horizontal (F00 §5, EP1)', () => {
  let fixture: ComponentFixture<AnchoHostComponent>;

  function columnasAncho(ancho: number): { columnas: number; ol: HTMLElement; host: HTMLElement } {
    fixture.componentInstance.ancho.set(ancho);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('.ancho') as HTMLElement;
    const ol = host.querySelector('ol') as HTMLElement;
    const columnas = getComputedStyle(ol).gridTemplateColumns.trim().split(/\s+/).length;
    return { columnas, ol, host };
  }

  function sinDesbordar(ol: HTMLElement, host: HTMLElement): void {
    expect(ol.scrollWidth).toBeLessThanOrEqual(ol.clientWidth);
    const limite = host.getBoundingClientRect().right + 0.5;
    ol.querySelectorAll('li').forEach((li) => {
      expect(li.getBoundingClientRect().right).toBeLessThanOrEqual(limite);
      expect(li.scrollWidth).toBeLessThanOrEqual(li.clientWidth);
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnchoHostComponent] });
    fixture = TestBed.createComponent(AnchoHostComponent);
  });

  it('desde 768 px: 6 columnas', () => {
    const { columnas, ol, host } = columnasAncho(1000);
    expect(columnas).toBe(6);
    sinDesbordar(ol, host);
    expect(columnasAncho(768).columnas).toBe(6);
  });

  it('por debajo de 768 px: 3×2 sin desbordar', () => {
    const { columnas, ol, host } = columnasAncho(767);
    expect(columnas).toBe(3);
    sinDesbordar(ol, host);
    expect(columnasAncho(400).columnas).toBe(3);
  });

  it('por debajo de 400 px: 2×3 sin desbordar, comprobado a 320 px', () => {
    expect(columnasAncho(399).columnas).toBe(2);
    const { columnas, ol, host } = columnasAncho(320);
    expect(columnas).toBe(2);
    sinDesbordar(ol, host);
  });
});
