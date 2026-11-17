import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Stage } from '@domain/value-objects/stage.vo';
import {
  ProtocolHeaderComponent,
  ProtocolHeaderFact,
  ProtocolHeaderStatus,
} from './protocol-header.component';

// Datos ficticios.
const CODIGO = 'CEISH-ESPOCH-IO-034-2026';
const TITULO = 'Estudio ficticio de adherencia al tratamiento en adultos mayores';

describe('ProtocolHeaderComponent (F00 §5, criterio 10)', () => {
  let fixture: ComponentFixture<ProtocolHeaderComponent>;

  function render(inputs: {
    code?: string | null;
    version?: string | null;
    status?: ProtocolHeaderStatus | null;
    heading?: string;
    facts?: readonly ProtocolHeaderFact[];
    stage?: Stage | null;
  }): HTMLElement {
    fixture.componentRef.setInput('heading', inputs.heading ?? TITULO);
    for (const key of ['code', 'version', 'status', 'facts', 'stage'] as const) {
      if (key in inputs) fixture.componentRef.setInput(key, inputs[key]);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const chipCodigo = (el: HTMLElement) =>
    el.querySelector('.protocol-header__code .chip')?.textContent?.trim() ?? null;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProtocolHeaderComponent] });
    fixture = TestBed.createComponent(ProtocolHeaderComponent);
  });

  it('el título es el h1 de la pantalla', () => {
    const el = render({});

    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('h1')?.textContent?.trim()).toBe(TITULO);
  });

  it('chip neutro con código y versión unidos por "·", en gris', () => {
    const el = render({ code: CODIGO, version: 'v2' });

    expect(chipCodigo(el)).toBe(`${CODIGO} · v2`);
    expect(el.querySelector('.protocol-header__code .chip')?.classList).toContain('chip--gris');
  });

  it('con solo el código o solo la versión, el chip lleva ese dato', () => {
    expect(chipCodigo(render({ code: CODIGO, version: null }))).toBe(CODIGO);
    expect(chipCodigo(render({ code: null, version: 'v1' }))).toBe('v1');
  });

  it('sin código ni versión no hay chip neutro ni texto de relleno', () => {
    const el = render({ code: null, version: '  ' });

    expect(el.querySelector('.protocol-header__code')).toBeNull();
    expect(el.textContent).not.toContain('S/C');
    expect(el.querySelector('.protocol-header__chips')).toBeNull();
  });

  it('chip de estado con su texto y su tono', () => {
    const el = render({ status: { label: 'Aprobado', tone: 'verde' } });
    const chip = el.querySelector('.protocol-header__status .chip');

    expect(chip?.textContent?.trim()).toBe('Aprobado');
    expect(chip?.classList).toContain('chip--verde');
  });

  it('sin estado no hay chip de estado', () => {
    const el = render({ code: CODIGO, status: null });

    expect(el.querySelector('.protocol-header__status')).toBeNull();
    expect(el.querySelector('.protocol-header__code')).not.toBeNull();
  });

  it('la línea de datos muestra solo los pares con valor, separados por "·"', () => {
    const el = render({
      facts: [
        { label: 'Investigador principal', value: null },
        { label: 'Sesión', value: '' },
        { label: 'Riesgo', value: 'Mínimo' },
        { label: 'Tipo', value: 'Observacional' },
      ],
    });
    const facts = Array.from(el.querySelectorAll('.protocol-header__fact'), (n) =>
      n.textContent?.trim(),
    );

    expect(facts).toEqual(['Riesgo: Mínimo', 'Tipo: Observacional']);
    expect(el.querySelectorAll('.protocol-header__sep').length).toBe(1);
    expect(el.querySelector('.protocol-header__sep')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.textContent).not.toContain('Investigador principal');
  });

  it('si ningún dato tiene valor, la línea de datos no existe', () => {
    const el = render({ facts: [{ label: 'Riesgo', value: null }] });

    expect(el.querySelector('.protocol-header__facts')).toBeNull();
  });

  it('con etapa muestra la barra de 6 etapas con la actual marcada', () => {
    const el = render({ stage: Stage.fromBackend('RESOLUCION') });

    expect(el.querySelectorAll('app-stage-bar li').length).toBe(6);
    expect(el.querySelector('[aria-current="step"]')?.getAttribute('data-stage')).toBe('RESOLUCION');
  });

  it('sin etapa no hay barra', () => {
    const el = render({ stage: null });

    expect(el.querySelector('app-stage-bar')).toBeNull();
  });

  it('sin acción proyectada, el lugar de la acción queda vacío y oculto', () => {
    const el = render({});
    const action = el.querySelector('.protocol-header__action') as HTMLElement;

    expect(action.children.length).toBe(0);
    expect(getComputedStyle(action).display).toBe('none');
  });
});

@Component({
  standalone: true,
  imports: [ProtocolHeaderComponent],
  template: `
    <div class="ancho" [style.width.px]="ancho()">
      <app-protocol-header
        code="CEISH-ESPOCH-IO-034-2026"
        version="v1"
        [status]="estado"
        heading="Estudio ficticio de adherencia al tratamiento en adultos mayores de la provincia"
        [facts]="datos"
        [stage]="etapa"
      >
        <div protocolHeaderAction class="accion">
          <button type="button" disabled aria-describedby="motivo">Emitir resolución</button>
          <p id="motivo">Falta subir la carta firmada</p>
        </div>
        <p class="fuera">No proyectado</p>
      </app-protocol-header>
    </div>
  `,
})
class HostComponent {
  readonly ancho = signal(1000);
  readonly estado: ProtocolHeaderStatus = {
    label: 'Aprobado en el pleno · falta la resolución',
    tone: 'azul',
  };
  readonly datos: ProtocolHeaderFact[] = [{ label: 'Riesgo', value: 'Mínimo' }];
  readonly etapa = Stage.fromBackend('RESOLUCION');
}

describe('ProtocolHeaderComponent - acción proyectada y ancho', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('la acción con atributo protocolHeaderAction va en el lugar de la acción, con su motivo', () => {
    const el = fixture.nativeElement as HTMLElement;
    const action = el.querySelector('.protocol-header__action') as HTMLElement;

    expect(action.querySelector('button')?.textContent?.trim()).toBe('Emitir resolución');
    expect(action.querySelector('#motivo')?.textContent?.trim()).toBe('Falta subir la carta firmada');
    expect(getComputedStyle(action).display).not.toBe('none');
  });

  it('lo que no lleva el atributo no se proyecta', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.fuera')).toBeNull();
  });

  it('a 320 px nada se sale del encabezado', () => {
    fixture.componentInstance.ancho.set(320);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelector('.protocol-header') as HTMLElement;
    const limite = (el.querySelector('.ancho') as HTMLElement).getBoundingClientRect().right + 0.5;

    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    card.querySelectorAll('*').forEach((n) => {
      expect(n.getBoundingClientRect().right).withContext(n.className).toBeLessThanOrEqual(limite);
    });
  });
});
