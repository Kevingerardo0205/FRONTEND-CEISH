import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NextMeeting } from '@domain/entities/meeting.entity';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import { PendientesResumen } from '../domain/pendiente.model';
import { PendientesPort } from '../domain/pendientes.port';
import { MisPendientesPage } from './mis-pendientes.page';

const RESUMEN: PendientesResumen = {
  fechaReferencia: '2026-11-04',
  totales: { todos: 3, vencidos: 1, hoy: 0, semana: 0 },
  items: [
    {
      protocolId: 41,
      ceishCode: 'IO-999-2026',
      title: 'Estudio de prueba A',
      estadoActual: 'En evaluación · dictamen vencido',
      etapa: null,
      fechaPlazo: '2026-10-21T04:59:59.999Z',
      estadoPlazo: 'VENCIDO',
      accion: 'REASIGNAR',
      accionTexto: 'Reasignar evaluador',
    },
  ],
};

const REUNION: NextMeeting = {
  id: 'm-1',
  numeroConvocatoria: '12',
  tipoSesion: 'ORDINARIA',
  fechaReunion: '2026-11-10T14:00:00.000Z',
  lugar: null,
  protocolosATratar: 3,
};

describe('MisPendientesPage (F01 T01-5)', () => {
  let obtener: jasmine.Spy;
  let next: jasmine.Spy;
  let fixture: ComponentFixture<MisPendientesPage>;

  beforeEach(() => {
    obtener = jasmine.createSpy('obtener').and.returnValue(of(RESUMEN));
    next = jasmine.createSpy('next').and.returnValue(of(REUNION));
    TestBed.configureTestingModule({
      imports: [MisPendientesPage],
      providers: [
        provideRouter([]),
        { provide: PendientesPort, useValue: { obtener } },
        { provide: IMeetingRepositoryPort, useValue: { next } },
      ],
    });
  });

  async function render(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(MisPendientesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const texto = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const h1 = (el: HTMLElement) => el.querySelector('h1');
  const filtros = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('app-button-group button'));

  it('encabezado "Tiene N pendientes" con N = totales.todos', async () => {
    expect(texto(h1(await render()))).toBe('Tiene 3 pendientes');
  });

  it('con 1: "Tiene 1 pendiente" (singular)', async () => {
    obtener.and.returnValue(of({ ...RESUMEN, totales: { ...RESUMEN.totales, todos: 1 } }));
    expect(texto(h1(await render()))).toBe('Tiene 1 pendiente');
  });

  it('con 0: "No tiene pendientes" y el vacío de la tabla', async () => {
    obtener.and.returnValue(
      of({ ...RESUMEN, totales: { todos: 0, vencidos: 0, hoy: 0, semana: 0 }, items: [] }),
    );
    const el = await render();
    expect(texto(h1(el))).toBe('No tiene pendientes');
    expect(texto(el)).toContain('No tiene pendientes. Los protocolos nuevos aparecerán aquí.');
  });

  it('subtítulo con fechaReferencia en dd/MM/yyyy (2026-11-04 → 04/11/2026), sin "Buenos días"', async () => {
    const el = await render();
    expect(texto(el.querySelector('.page-header__subtitle'))).toBe(
      'Al 04/11/2026 · Empiece por los vencidos.',
    );
    expect(texto(el)).not.toContain('Buenos días');
  });

  it('mientras cargan los totales, el título es "Mis pendientes" y los filtros van sin conteo', async () => {
    obtener.and.returnValue(of());
    const el = await render();
    expect(texto(h1(el))).toBe('Mis pendientes');
    expect(filtros(el).map((b) => texto(b))).toEqual(['Todos', 'Vencidos', 'Hoy', 'Esta semana']);
  });

  it('filtros con los conteos de totales, en una región aria-live="polite"', async () => {
    const el = await render();
    expect(filtros(el).map((b) => texto(b))).toEqual([
      'Todos · 3',
      'Vencidos · 1',
      'Hoy · 0',
      'Esta semana · 0',
    ]);
    expect(el.querySelector('app-button-group')?.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('aria-pressed en el filtro activo; al pulsar Vencidos se pide ese filtro y los conteos no cambian', async () => {
    const el = await render();
    expect(filtros(el).map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);

    obtener.and.returnValue(of({ ...RESUMEN, items: [] }));
    filtros(el)[1].click();
    fixture.detectChanges();

    expect(obtener.calls.mostRecent().args).toEqual(['vencidos']);
    expect(filtros(el).map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(texto(filtros(el)[1])).toBe('Vencidos · 1');
    expect(texto(el)).toContain('No hay pendientes vencidos.');
  });

  it('la tarjeta de la reunión va arriba de los filtros y de la tabla (C1)', async () => {
    const el = await render();
    const orden = Array.from(
      el.querySelectorAll('app-page-header, app-proxima-reunion-card, app-button-group, app-pendientes-table'),
    ).map((n) => n.tagName.toLowerCase());
    expect(orden).toEqual([
      'app-page-header',
      'app-proxima-reunion-card',
      'app-button-group',
      'app-pendientes-table',
    ]);
  });

  it('si falla la reunión, la tabla de pendientes se ve igual', async () => {
    next.and.returnValue(throwError(() => new Error('500')));
    const el = await render();
    expect(texto(el.querySelector('app-proxima-reunion-card'))).toContain(
      'No pudimos cargar la próxima reunión.',
    );
    expect(el.querySelectorAll('app-pendientes-table tbody tr').length).toBe(1);
    expect(texto(h1(el))).toBe('Tiene 3 pendientes');
  });

  it('si fallan los pendientes, la tarjeta de la reunión se ve igual', async () => {
    obtener.and.returnValue(throwError(() => new Error('403')));
    const el = await render();
    expect(texto(el.querySelector('app-pendientes-table'))).toContain('No pudimos cargar sus pendientes.');
    expect(texto(el.querySelector('app-proxima-reunion-card'))).toContain('Convocatoria N.º 12');
  });

  it('al entrar, el foco va al h1 (tabindex="-1")', async () => {
    const el = await render();
    expect(h1(el)?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(h1(el));
  });
});
