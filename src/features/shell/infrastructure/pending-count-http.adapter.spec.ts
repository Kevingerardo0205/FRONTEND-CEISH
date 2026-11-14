import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { PendingCountHttpAdapter } from './pending-count-http.adapter';

describe('PendingCountHttpAdapter (F01 T01-3)', () => {
  let adapter: PendingCountHttpAdapter;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/secretaria/pendientes`;

  const data = (totales: unknown) => ({
    fechaReferencia: '2026-11-04',
    totales,
    // 1 fila con todos = 4: el contador sale de totales, no de contar filas.
    items: [{ protocolId: 1 }],
  });
  const envoltorio = (d: unknown) => ({ statusCode: 200, message: 'OK', data: d });

  function contar(body: object | null): { count?: number; error?: unknown } {
    const r: { count?: number; error?: unknown } = {};
    adapter.count$.subscribe({ next: (c) => (r.count = c), error: (e) => (r.error = e) });
    httpMock.expectOne((req) => req.url === url).flush(body);
    return r;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PendingCountHttpAdapter, provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(PendingCountHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('hace GET /secretaria/pendientes?filtro=todos', () => {
    adapter.count$.subscribe({ error: () => undefined });
    const req = httpMock.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toBe(`${url}?filtro=todos`);
    req.flush(envoltorio(data({ todos: 0, vencidos: 0, hoy: 0, semana: 0 })));
  });

  it('data.totales.todos = 4 → 4 (sin envoltorio de transporte)', () => {
    const r = contar(envoltorio(data({ todos: 4, vencidos: 1, hoy: 1, semana: 2 })));
    expect(r.count).toBe(4);
    expect(r.error).toBeUndefined();
  });

  it('con envoltorio de transporte (doble { statusCode, message, data }) → 4', () => {
    const r = contar(envoltorio(envoltorio(data({ todos: 4, vencidos: 1, hoy: 1, semana: 2 }))));
    expect(r.count).toBe(4);
  });

  it('todos = 0 → 0 (el AppShell decide no mostrarlo)', () => {
    expect(contar(envoltorio(data({ todos: 0, vencidos: 0, hoy: 0, semana: 0 }))).count).toBe(0);
  });

  it('sin totales → error con la ruta del campo', () => {
    const r = contar(envoltorio({ fechaReferencia: '2026-11-04', items: [] }));
    expect(r.count).toBeUndefined();
    expect(r.error).toBeInstanceOf(ContractError);
    expect((r.error as ContractError).path).toBe('data.totales');
  });

  it('todos no numérico → error', () => {
    for (const todos of ['4', null, NaN]) {
      const r = contar(envoltorio(data({ todos })));
      expect(r.count).withContext(String(todos)).toBeUndefined();
      expect((r.error as ContractError).path).toBe('data.totales.todos');
    }
  });

  it('todos negativo → error', () => {
    const r = contar(envoltorio(data({ todos: -1 })));
    expect(r.count).toBeUndefined();
    expect((r.error as ContractError).path).toBe('data.totales.todos');
  });

  it('un arreglo de filas (forma anterior) ya no es válido', () => {
    const r = contar([{ protocolId: 1 }, { protocolId: 2 }]);
    expect(r.count).toBeUndefined();
    expect(r.error).toBeInstanceOf(ContractError);
  });

  it('un 500 llega como error al suscriptor', () => {
    let error: unknown;
    adapter.count$.subscribe({ error: (e) => (error = e) });
    httpMock
      .expectOne((req) => req.url === url)
      .flush({ statusCode: 500, message: 'Error' }, { status: 500, statusText: 'Server Error' });
    expect((error as HttpErrorResponse).status).toBe(500);
  });
});
