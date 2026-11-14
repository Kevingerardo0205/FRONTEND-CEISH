import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { NextMeeting } from '@domain/entities/meeting.entity';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import { FiltroPendientes, PendientesResumen } from '../domain/pendiente.model';
import { PendientesPort } from '../domain/pendientes.port';
import { MisPendientesFacade } from './mis-pendientes.facade';

const RESUMEN: PendientesResumen = {
  fechaReferencia: '2026-11-04',
  totales: { todos: 2, vencidos: 1, hoy: 0, semana: 0 },
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

describe('MisPendientesFacade (F01 T01-5)', () => {
  let obtener: jasmine.Spy;
  let next: jasmine.Spy;
  let facade: MisPendientesFacade;

  beforeEach(() => {
    obtener = jasmine.createSpy('obtener').and.returnValue(of(RESUMEN));
    next = jasmine.createSpy('next').and.returnValue(of(REUNION));
    TestBed.configureTestingModule({
      providers: [
        MisPendientesFacade,
        { provide: PendientesPort, useValue: { obtener } },
        { provide: IMeetingRepositoryPort, useValue: { next } },
      ],
    });
    facade = TestBed.inject(MisPendientesFacade);
  });

  it('antes de iniciar, los dos bloques están cargando', () => {
    expect(facade.pendientes().estado).toBe('cargando');
    expect(facade.reunion().estado).toBe('cargando');
    expect(facade.cabecera()).toBeNull();
  });

  it('carga inicial: pide filtro=todos y la próxima reunión', () => {
    facade.iniciar();

    expect(obtener).toHaveBeenCalledOnceWith('todos');
    expect(next).toHaveBeenCalledTimes(1);
    expect(facade.pendientes()).toEqual({ estado: 'listo', datos: RESUMEN.items });
    expect(facade.cabecera()).toEqual({
      fechaReferencia: '2026-11-04',
      totales: RESUMEN.totales,
    });
    expect(facade.reunion()).toEqual({ estado: 'listo', datos: REUNION });
  });

  it('reunión null → listo sin datos (no hay reunión programada)', () => {
    next.and.returnValue(of(null));
    facade.iniciar();
    expect(facade.reunion()).toEqual({ estado: 'listo', datos: null });
  });

  it('un error de la reunión no toca los pendientes', () => {
    next.and.returnValue(throwError(() => new Error('500')));
    facade.iniciar();

    expect(facade.reunion().estado).toBe('error');
    expect(facade.pendientes()).toEqual({ estado: 'listo', datos: RESUMEN.items });
    expect(facade.cabecera()?.totales).toEqual(RESUMEN.totales);
  });

  it('un error de los pendientes no toca la reunión', () => {
    obtener.and.returnValue(throwError(() => new Error('403')));
    facade.iniciar();

    expect(facade.pendientes().estado).toBe('error');
    expect(facade.cabecera()).toBeNull();
    expect(facade.reunion()).toEqual({ estado: 'listo', datos: REUNION });
  });

  it("cambiarFiltro('vencidos') pide ese filtro y conserva los totales mientras carga", () => {
    facade.iniciar();
    const respuesta = new Subject<PendientesResumen>();
    obtener.and.returnValue(respuesta);

    facade.cambiarFiltro('vencidos');

    expect(obtener).toHaveBeenCalledWith('vencidos');
    expect(facade.filtro()).toBe('vencidos');
    expect(facade.pendientes().estado).toBe('cargando');
    expect(facade.cabecera()?.totales).toEqual(RESUMEN.totales);

    respuesta.next({ ...RESUMEN, items: [] });
    respuesta.complete();
    expect(facade.pendientes()).toEqual({ estado: 'listo', datos: [] });
    expect(facade.cabecera()?.totales).toEqual(RESUMEN.totales);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('un filtro nuevo cancela la petición anterior (switchMap)', () => {
    facade.iniciar();
    const lenta = new Subject<PendientesResumen>();
    const rapida = new Subject<PendientesResumen>();
    const porFiltro: Partial<Record<FiltroPendientes, Subject<PendientesResumen>>> = {
      vencidos: lenta,
      hoy: rapida,
    };
    obtener.and.callFake((f: FiltroPendientes) => porFiltro[f]);

    facade.cambiarFiltro('vencidos');
    facade.cambiarFiltro('hoy');
    expect(lenta.observed).toBeFalse();

    rapida.next({ ...RESUMEN, items: [] });
    expect(facade.pendientes()).toEqual({ estado: 'listo', datos: [] });
  });

  it('reintentarPendientes vuelve a pedir el filtro activo', () => {
    obtener.and.returnValue(throwError(() => new Error('500')));
    facade.iniciar();
    facade.cambiarFiltro('hoy');
    expect(facade.pendientes().estado).toBe('error');

    obtener.and.returnValue(of(RESUMEN));
    facade.reintentarPendientes();

    expect(obtener.calls.mostRecent().args).toEqual(['hoy']);
    expect(facade.pendientes().estado).toBe('listo');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reintentarReunion vuelve a pedir solo la reunión', () => {
    next.and.returnValue(throwError(() => new Error('500')));
    facade.iniciar();
    expect(facade.reunion().estado).toBe('error');

    next.and.returnValue(of(REUNION));
    facade.reintentarReunion();

    expect(facade.reunion()).toEqual({ estado: 'listo', datos: REUNION });
    expect(obtener).toHaveBeenCalledTimes(1);
  });

  it('una fila con acción desconocida se registra con console.warn', () => {
    const warn = spyOn(console, 'warn');
    obtener.and.returnValue(
      of({ ...RESUMEN, items: [{ ...RESUMEN.items[0], accion: null }] }),
    );
    facade.iniciar();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
