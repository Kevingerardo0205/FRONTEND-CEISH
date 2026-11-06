import { TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ProtocolListQuery, ProtocolListResult } from '../domain/protocol-list-item.model';
import { ProtocolosListPort } from '../domain/protocolos-list.port';
import { ProtocolosPage } from './protocolos.page';

const item = (i: number) => ({
  id: i,
  ceishCode: `IO-${i}-2026`,
  title: `Estudio de prueba ${i}`,
  etapa: null,
  principalInvestigator: null,
});
const RESULTADO: ProtocolListResult = {
  items: [item(1), item(2)],
  total: 57,
  page: 1,
  limit: 20,
  totalPages: 3,
};
const VACIO: ProtocolListResult = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

describe('ProtocolosPage (F01 T01-7)', () => {
  let listar: jasmine.Spy;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(() => {
    listar = jasmine.createSpy('listar').and.callFake((q: ProtocolListQuery) => of({ ...RESULTADO, page: q.page }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'protocolos', component: ProtocolosPage }]),
        { provide: ProtocolosListPort, useValue: { listar } },
      ],
    });
  });

  /** Abre la URL dentro de fakeAsync y deja la vista estable. */
  function abrir(url: string): HTMLElement {
    RouterTestingHarness.create().then((h) => (harness = h));
    flush();
    router = TestBed.inject(Router);
    harness.navigateByUrl(url);
    flush();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  const el = () => harness.routeNativeElement as HTMLElement;
  const texto = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const ultimaConsulta = (): ProtocolListQuery => listar.calls.mostRecent().args[0];
  const etapas = () => Array.from(el().querySelectorAll<HTMLButtonElement>('app-button-group button'));
  const boton = (nombre: string) => etapas().find((b) => texto(b) === nombre)!;
  const escribir = (valor: string) => {
    const input = el().querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };

  it('sin parámetros: h1 "Protocolos", Todos activo, pide page=1&limit=20', fakeAsync(() => {
    const e = abrir('/protocolos');
    expect(texto(e.querySelector('h1'))).toBe('Protocolos');
    expect(boton('Todos').getAttribute('aria-pressed')).toBe('true');
    expect(ultimaConsulta()).toEqual({ page: 1, limit: 20 });
  }));

  it('botones de etapa: Todos y las 6 etapas de Stage, sin selector "Etapa" (C2)', fakeAsync(() => {
    const e = abrir('/protocolos');
    expect(etapas().map((b) => texto(b))).toEqual([
      'Todos',
      'Recepción',
      'Asignación',
      'Evaluación',
      'Resolución',
      'Seguimiento',
      'Renovación',
    ]);
    expect(e.querySelectorAll('select').length).toBe(1);
    expect(texto(e.querySelector('app-filter-bar'))).not.toContain('Etapa');
  }));

  it('?etapa=EVALUACION marca Evaluación, titula "Protocolos · Evaluación" y pide etapa=EVALUACION&page=1&limit=20', fakeAsync(() => {
    const e = abrir('/protocolos?etapa=EVALUACION');
    expect(boton('Evaluación').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Todos').getAttribute('aria-pressed')).toBe('false');
    expect(texto(e.querySelector('h1'))).toBe('Protocolos · Evaluación');
    expect(ultimaConsulta()).toEqual({ etapa: 'EVALUACION', page: 1, limit: 20 });
  }));

  it('?etapa=XYZ → Todos y se quita de la URL', fakeAsync(() => {
    abrir('/protocolos?etapa=XYZ&page=2');
    expect(router.url).toBe('/protocolos?page=2');
    expect(boton('Todos').getAttribute('aria-pressed')).toBe('true');
    expect(listar.calls.allArgs().every(([q]) => q.etapa === undefined)).toBeTrue();
  }));

  it('cambiar la etapa vuelve a page=1', fakeAsync(() => {
    abrir('/protocolos?page=3');
    expect(ultimaConsulta().page).toBe(3);

    boton('Resolución').click();
    flush();
    harness.detectChanges();

    expect(router.url).toBe('/protocolos?etapa=RESOLUCION');
    expect(ultimaConsulta()).toEqual({ etapa: 'RESOLUCION', page: 1, limit: 20 });
  }));

  it('la búsqueda espera 300 ms (tick(299) no pide, tick(1) sí) y vuelve a page=1', fakeAsync(() => {
    abrir('/protocolos?page=2');
    const pedidas = listar.calls.count();

    escribir('  IO-1  ');
    tick(299);
    expect(listar.calls.count()).toBe(pedidas);
    tick(1);
    flush();
    harness.detectChanges();

    expect(router.url).toBe('/protocolos?search=IO-1');
    expect(ultimaConsulta()).toEqual({ search: 'IO-1', page: 1, limit: 20 });
    discardPeriodicTasks();
  }));

  it('la búsqueda tiene maxlength 100', fakeAsync(() => {
    const e = abrir('/protocolos');
    expect(e.querySelector('input[type="search"]')?.getAttribute('maxlength')).toBe('100');
    expect(e.querySelector('input[type="search"]')?.getAttribute('placeholder')).toBe(
      'Código, título o investigador',
    );
  }));

  it('?search=abc se muestra en la búsqueda (la URL manda)', fakeAsync(() => {
    const e = abrir('/protocolos?search=abc');
    expect(e.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('abc');
  }));

  it('Año: Todos por defecto y de 2000 al año en curso; cambiarlo pide ese año y vuelve a page=1', fakeAsync(() => {
    const e = abrir('/protocolos?page=2');
    const select = e.querySelector<HTMLSelectElement>('select')!;
    const opciones = Array.from(select.options).map((o) => o.value);
    const actual = Number(opciones[1]);
    expect(opciones[0]).toBe('');
    expect(select.value).toBe('');
    expect(opciones[opciones.length - 1]).toBe('2000');
    expect(opciones.length).toBe(actual - 2000 + 2);

    select.value = '2000';
    select.dispatchEvent(new Event('change'));
    flush();
    harness.detectChanges();

    expect(router.url).toBe('/protocolos?year=2000');
    expect(ultimaConsulta()).toEqual({ year: 2000, page: 1, limit: 20 });
  }));

  it('?year=2025 deja seleccionada la opción 2025 (no "Todos") y pide year=2025', fakeAsync(() => {
    const select = abrir('/protocolos?year=2025').querySelector<HTMLSelectElement>('select')!;
    expect(select.value).toBe('2025');
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('2025');
    expect(ultimaConsulta()).toEqual({ year: 2025, page: 1, limit: 20 });
  }));

  it('al volver de ?year=2025 a sin año, el select vuelve a "Todos"', fakeAsync(() => {
    abrir('/protocolos?year=2025');
    harness.navigateByUrl('/protocolos');
    flush();
    harness.detectChanges();
    expect(el().querySelector<HTMLSelectElement>('select')!.value).toBe('');
  }));

  it('el año en curso se calcula en hora de Ecuador: 01/01/2027 00:30 UTC sigue siendo 2026', fakeAsync(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2027-01-01T00:30:00.000Z'));
    // Navegador en UTC: su año local ya es 2027. Esta máquina está en UTC−5 (igual que Ecuador)
    // y Chrome en Windows no toma TZ, así que se simula el año local de un navegador en UTC.
    spyOn(Date.prototype, 'getFullYear').and.returnValue(2027);
    try {
      const e = abrir('/protocolos');
      const primero = e.querySelector<HTMLSelectElement>('select')!.options[1].value;
      expect(primero).toBe('2026');
    } finally {
      jasmine.clock().uninstall();
    }
  }));

  it('paginación: "Mostrando 21–40 de 57" en la página 2; Siguiente pide page=3', fakeAsync(() => {
    const e = abrir('/protocolos?page=2');
    expect(texto(e.querySelector('.pager__info'))).toBe('Mostrando 21–40 de 57');

    Array.from(e.querySelectorAll<HTMLButtonElement>('.pager__boton'))
      .find((b) => texto(b) === 'Siguiente')!
      .click();
    flush();
    harness.detectChanges();

    expect(router.url).toBe('/protocolos?page=3');
    expect(ultimaConsulta().page).toBe(3);
  }));

  it('sin filtros y sin protocolos: "Todavía no hay protocolos registrados." y sin paginador', fakeAsync(() => {
    listar.and.returnValue(of(VACIO));
    const e = abrir('/protocolos');
    expect(texto(e)).toContain('Todavía no hay protocolos registrados.');
    expect(e.querySelector('.pager')).toBeNull();
  }));

  it('con filtros y sin resultados: mensaje y "Limpiar filtros" deja Todos, sin búsqueda ni año, página 1', fakeAsync(() => {
    listar.and.returnValue(of(VACIO));
    const e = abrir('/protocolos?etapa=EVALUACION&search=zz&year=2025&page=2');
    expect(texto(e)).toContain('Ningún protocolo coincide con la búsqueda.');

    listar.and.returnValue(of(RESULTADO));
    Array.from(e.querySelectorAll('button')).find((b) => texto(b) === 'Limpiar filtros')!.click();
    flush();
    harness.detectChanges();

    expect(router.url).toBe('/protocolos');
    expect(ultimaConsulta()).toEqual({ page: 1, limit: 20 });
    expect(boton('Todos').getAttribute('aria-pressed')).toBe('true');
    expect(el().querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('');
  }));

  it('error → ErrorState con Reintentar (no "sin resultados")', fakeAsync(() => {
    listar.and.returnValue(throwError(() => new Error('500')));
    const e = abrir('/protocolos?etapa=EVALUACION');
    expect(texto(e)).toContain('No pudimos cargar los protocolos.');
    expect(texto(e)).not.toContain('Ningún protocolo coincide');
    expect(texto(e)).not.toContain('Todavía no hay protocolos');

    listar.and.returnValue(of(RESULTADO));
    e.querySelector<HTMLButtonElement>('.state__retry')!.click();
    harness.detectChanges();
    expect(ultimaConsulta()).toEqual({ etapa: 'EVALUACION', page: 1, limit: 20 });
    expect(e.querySelectorAll('tbody tr').length).toBe(2);
  }));

  it('al entrar, el foco va al h1 (tabindex="-1")', fakeAsync(() => {
    const e = abrir('/protocolos');
    const h1 = e.querySelector('h1');
    expect(h1?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(h1);
  }));
});
