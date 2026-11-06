import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { ProtocolListResult } from '../domain/protocol-list-item.model';
import { ProtocolosListPort } from '../domain/protocolos-list.port';
import { PROTOCOLOS_PROVIDERS } from '../protocolos.providers';
import { ProtocolosHttpAdapter } from './protocolos-http.adapter';

describe('ProtocolosHttpAdapter (F01 T01-6)', () => {
  let port: ProtocolosListPort;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/protocols`;

  const pagina = {
    data: [
      {
        id: 41,
        ceishCode: null,
        title: 'Estudio de prueba A',
        etapa: 'EVALUACION',
        etapaOrden: 3,
        principalInvestigator: null,
      },
    ],
    total: 21,
    page: 2,
    limit: 20,
    totalPages: 2,
  };
  const envoltorio = { statusCode: 200, message: 'Success', data: pagina };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...PROTOCOLOS_PROVIDERS, provideHttpClient(), provideHttpClientTesting()],
    });
    port = TestBed.inject(ProtocolosListPort);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('PROTOCOLOS_PROVIDERS registra ProtocolosHttpAdapter', () => {
    expect(port instanceof ProtocolosHttpAdapter).toBeTrue();
  });

  it('GET …/protocols?etapa=EVALUACION&page=2&limit=20 sin parámetros vacíos', () => {
    let result: ProtocolListResult | undefined;
    let error: unknown = null;
    port
      .listar({ etapa: 'EVALUACION', page: 2, limit: 20 })
      .subscribe({ next: (r) => (result = r), error: (e) => (error = e) });

    const req = httpMock.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toBe(`${url}?etapa=EVALUACION&page=2&limit=20`);
    req.flush(envoltorio);

    expect(error).toBeNull();
    expect(result?.total).toBe(21);
    expect(result?.items[0].ceishCode).toBeNull();
  });

  it('envía search y year cuando vienen en la consulta', () => {
    let error: unknown = null;
    port
      .listar({ search: 'estudio', year: 2025, page: 1, limit: 20 })
      .subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne((r) => r.url === url);
    expect(req.request.urlWithParams).toBe(`${url}?search=estudio&year=2025&page=1&limit=20`);
    req.flush(envoltorio);
    expect(error).toBeNull();
  });

  it("search '' no se envía", () => {
    let error: unknown = null;
    port.listar({ search: '', page: 1, limit: 20 }).subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne((r) => r.url === url);
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.keys()).toEqual(['page', 'limit']);
    req.flush(envoltorio);
    expect(error).toBeNull();
  });

  it('acepta la página sin envoltorio', () => {
    let result: ProtocolListResult | undefined;
    let error: unknown = null;
    port
      .listar({ page: 2, limit: 20 })
      .subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
    httpMock.expectOne((r) => r.url === url).flush(pagina);
    expect(error).toBeNull();
    expect(result?.totalPages).toBe(2);
  });

  it('un 403 llega como error al suscriptor (no como lista vacía)', () => {
    let emitted = false;
    let error: unknown = null;
    port
      .listar({ page: 1, limit: 20 })
      .subscribe({ next: () => (emitted = true), error: (e) => (error = e) });
    httpMock
      .expectOne((r) => r.url === url)
      .flush({ message: 'Forbidden resource' }, { status: 403, statusText: 'Forbidden' });
    expect(emitted).toBeFalse();
    expect(error instanceof HttpErrorResponse).toBeTrue();
    expect((error as HttpErrorResponse).status).toBe(403);
  });

  it('una respuesta fuera de contrato llega como ContractError al suscriptor', () => {
    let emitted = false;
    let error: unknown = null;
    port
      .listar({ page: 1, limit: 20 })
      .subscribe({ next: () => (emitted = true), error: (e) => (error = e) });
    httpMock
      .expectOne((r) => r.url === url)
      .flush({ ...envoltorio, data: { ...pagina, total: '21' } });
    expect(emitted).toBeFalse();
    expect(error instanceof ContractError).toBeTrue();
    expect((error as ContractError).path).toBe('data.total');
  });
});
