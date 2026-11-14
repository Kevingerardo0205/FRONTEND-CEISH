import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ProtocolListQuery, ProtocolListResult } from '../domain/protocol-list-item.model';
import { ProtocolosListPort } from '../domain/protocolos-list.port';
import { ProtocolosFacade } from './protocolos.facade';

const RESULTADO: ProtocolListResult = {
  items: [{ id: 1, ceishCode: 'IO-001-2026', title: 'Estudio de prueba', etapa: null, principalInvestigator: null }],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};
const Q: ProtocolListQuery = { page: 1, limit: 20 };

describe('ProtocolosFacade (F01 T01-7)', () => {
  let listar: jasmine.Spy;
  let facade: ProtocolosFacade;

  beforeEach(() => {
    listar = jasmine.createSpy('listar').and.returnValue(of(RESULTADO));
    TestBed.configureTestingModule({
      providers: [ProtocolosFacade, { provide: ProtocolosListPort, useValue: { listar } }],
    });
    facade = TestBed.inject(ProtocolosFacade);
  });

  it('antes de cargar, cargando', () => {
    expect(facade.estado().estado).toBe('cargando');
  });

  it('cargar(q) pide esa consulta y queda listo con los datos', () => {
    facade.cargar(Q);
    expect(listar).toHaveBeenCalledOnceWith(Q);
    expect(facade.estado()).toEqual({ estado: 'listo', datos: RESULTADO });
  });

  it('mientras llega la respuesta, cargando', () => {
    listar.and.returnValue(new Subject<ProtocolListResult>());
    facade.cargar(Q);
    expect(facade.estado().estado).toBe('cargando');
  });

  it('un error queda como error (no como lista vacía)', () => {
    listar.and.returnValue(throwError(() => new Error('500')));
    facade.cargar(Q);
    expect(facade.estado()).toEqual({ estado: 'error', datos: null });
  });

  it('una consulta nueva cancela la anterior (switchMap)', () => {
    const lenta = new Subject<ProtocolListResult>();
    const rapida = new Subject<ProtocolListResult>();
    listar.and.returnValues(lenta, rapida);

    facade.cargar(Q);
    facade.cargar({ ...Q, page: 2 });

    expect(lenta.observed).toBeFalse();
    rapida.next({ ...RESULTADO, page: 2 });
    expect(facade.estado().datos?.page).toBe(2);
  });

  it('reintentar vuelve a pedir la última consulta', () => {
    listar.and.returnValue(throwError(() => new Error('500')));
    facade.cargar({ ...Q, etapa: 'EVALUACION' });
    listar.and.returnValue(of(RESULTADO));

    facade.reintentar();

    expect(listar.calls.mostRecent().args).toEqual([{ ...Q, etapa: 'EVALUACION' }]);
    expect(facade.estado().estado).toBe('listo');
  });
});
