import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Stage } from '@domain/value-objects/stage.vo';
import { AccionPendiente, FiltroPendientes, PendienteItem } from '../../../domain/pendiente.model';
import { PendientesTableComponent } from './pendientes-table.component';

const BASE: PendienteItem = {
  protocolId: 41,
  ceishCode: 'IO-999-2026',
  title: 'Estudio de prueba A',
  estadoActual: 'En evaluación · dictamen vencido',
  etapa: Stage.fromBackend('EVALUACION'),
  // 04:59 UTC del 21 = 23:59 del 20 en Ecuador (criterio 7)
  fechaPlazo: '2026-10-21T04:59:59.999Z',
  estadoPlazo: 'VENCIDO',
  accion: 'REASIGNAR',
  accionTexto: 'Reasignar evaluador',
};

describe('PendientesTableComponent (F01 T01-5)', () => {
  let fixture: ComponentFixture<PendientesTableComponent>;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PendientesTableComponent],
      providers: [provideRouter([])],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PendientesTableComponent);
  });

  function render(
    items: PendienteItem[] | null,
    estado: 'cargando' | 'listo' | 'error' = 'listo',
    filtro: FiltroPendientes = 'todos',
  ): HTMLElement {
    fixture.componentRef.setInput('estado', estado);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('filtro', filtro);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const texto = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const chips = (el: HTMLElement) => Array.from(el.querySelectorAll('app-status-chip .chip'));

  describe('Plazo: tono y texto (spec-ui §5.2)', () => {
    const casos: [PendienteItem['estadoPlazo'], string | null, string, string][] = [
      ['VENCIDO', '2026-10-21T04:59:59.999Z', 'chip--rojo', 'Venció 20/10/2026'],
      ['HOY', '2026-11-06T20:00:00.000Z', 'chip--ambar', 'Vence hoy'],
      ['SEMANA', '2026-11-10T20:00:00.000Z', 'chip--azul', 'Vence 10/11/2026'],
      ['PROXIMO', '2026-11-30T20:00:00.000Z', 'chip--gris', 'Vence 30/11/2026'],
      ['SIN_PLAZO', null, 'chip--gris', 'Sin plazo'],
      ['VENCIDO', null, 'chip--gris', 'Sin plazo'],
    ];
    for (const [estadoPlazo, fechaPlazo, clase, esperado] of casos) {
      it(`${estadoPlazo} con fecha ${fechaPlazo} → ${clase} "${esperado}"`, () => {
        const chip = chips(render([{ ...BASE, estadoPlazo, fechaPlazo }]))[0];
        expect(chip.classList).toContain(clase);
        expect(texto(chip)).toBe(esperado);
      });
    }
  });

  it('Protocolo: código arriba y título; estado actual tal cual', () => {
    const el = render([BASE]);
    expect(texto(el.querySelector('.pendientes__codigo'))).toBe('IO-999-2026');
    expect(texto(el.querySelector('.pendientes__titulo'))).toBe('Estudio de prueba A');
    expect(texto(el)).toContain('En evaluación · dictamen vencido');
  });

  it('Etapa: chip neutro con la etiqueta; null → "Etapa no reconocida" y la fila completa', () => {
    const el = render([BASE, { ...BASE, protocolId: 42, etapa: null }]);
    const etapas = Array.from(el.querySelectorAll('tbody tr')).map((tr) => tr.querySelectorAll('.chip')[1]);
    expect(texto(etapas[0])).toBe('Evaluación');
    expect(etapas[0].classList).toContain('chip--gris');
    expect(texto(etapas[1])).toBe('Etapa no reconocida');
    expect(etapas[1].classList).toContain('chip--gris');
    expect(el.querySelectorAll('tbody tr')[1].querySelectorAll('button').length).toBe(1);
  });

  it('Acción: botón con accionTexto y aria-label="{accionTexto} {ceishCode}"', () => {
    const boton = render([BASE]).querySelector('tbody button');
    expect(texto(boton)).toBe('Reasignar evaluador');
    expect(boton?.getAttribute('aria-label')).toBe('Reasignar evaluador IO-999-2026');
  });

  it('sin ceishCode: aria-label solo con accionTexto', () => {
    const boton = render([{ ...BASE, ceishCode: null }]).querySelector('tbody button');
    expect(boton?.getAttribute('aria-label')).toBe('Reasignar evaluador');
  });

  it('acción desconocida → la fila se muestra sin botón', () => {
    const el = render([{ ...BASE, accion: null }]);
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    expect(el.querySelector('tbody button')).toBeNull();
    expect(texto(el)).toContain('Estudio de prueba A');
  });

  describe('destinos (spec-ui §3.1.1, criterio 20)', () => {
    const casos: [AccionPendiente, (string | number)[]][] = [
      ['ASIGNAR', ['/dashboard/protocols/workspace', 41, 'info']],
      ['VALIDAR', ['/dashboard/protocols/workspace', 41, 'validation']],
      ['REASIGNAR', ['/dashboard/evaluations/reassignment', 41]],
    ];
    for (const [accion, destino] of casos) {
      it(`${accion} → ${destino.join('/')}`, () => {
        render([{ ...BASE, accion }]).querySelector<HTMLButtonElement>('tbody button')?.click();
        expect(navigate).toHaveBeenCalledOnceWith(destino);
      });
    }
  });

  it('tabla accesible: caption y th scope="col"', () => {
    const el = render([BASE]);
    expect(texto(el.querySelector('caption'))).toBe('Pendientes de la Secretaría');
    const ths = Array.from(el.querySelectorAll('th'));
    expect(ths.length).toBe(5);
    expect(ths.every((th) => th.getAttribute('scope') === 'col')).toBeTrue();
  });

  describe('los 4 vacíos', () => {
    const casos: [FiltroPendientes, string, boolean][] = [
      ['todos', 'No tiene pendientes. Los protocolos nuevos aparecerán aquí.', false],
      ['vencidos', 'No hay pendientes vencidos.', true],
      ['hoy', 'No hay pendientes para hoy.', true],
      ['semana', 'No hay pendientes para esta semana.', true],
    ];
    for (const [filtro, mensaje, conVerTodos] of casos) {
      it(`${filtro}: "${mensaje}"${conVerTodos ? ' + Ver todos' : ''}`, () => {
        const el = render([], 'listo', filtro);
        expect(texto(el)).toContain(mensaje);
        const verTodos = Array.from(el.querySelectorAll('button')).find((b) => texto(b) === 'Ver todos');
        expect(!!verTodos).toBe(conVerTodos);
        expect(el.querySelector('table')).toBeNull();
      });
    }

    it('"Ver todos" emite verTodos', () => {
      let veces = 0;
      // Un output de Angular no tiene canal de error: solo emite.
      fixture.componentInstance.verTodos.subscribe(() => veces++);
      const el = render([], 'listo', 'vencidos');
      Array.from(el.querySelectorAll('button')).find((b) => texto(b) === 'Ver todos')?.click();
      expect(veces).toBe(1);
    });
  });

  it('cargando → "Cargando pendientes…"', () => {
    expect(texto(render(null, 'cargando'))).toContain('Cargando pendientes…');
  });

  it('error → "No pudimos cargar sus pendientes." con Reintentar (nunca como vacío)', () => {
    let reintentos = 0;
    fixture.componentInstance.reintentar.subscribe(() => reintentos++);
    const el = render(null, 'error', 'vencidos');
    expect(texto(el)).toContain('No pudimos cargar sus pendientes.');
    expect(texto(el)).not.toContain('No hay pendientes');
    el.querySelector<HTMLButtonElement>('.state__retry')?.click();
    expect(reintentos).toBe(1);
  });
});
