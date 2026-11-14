import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { PendientesResumen } from '../domain/pendiente.model';
import { PendientesPort } from '../domain/pendientes.port';
import { PENDIENTES_PROVIDERS } from '../pendientes.providers';
import { PendientesHttpAdapter } from './pendientes-http.adapter';

describe('PendientesHttpAdapter (F01 T01-2)', () => {
  let port: PendientesPort;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/secretaria/pendientes`;

  const data = {
    fechaReferencia: '2026-11-04',
    totales: { todos: 1, vencidos: 1, hoy: 0, semana: 0 },
    items: [
      {
        protocolId: 41,
        ceishCode: 'IO-999-2026',
        title: 'Estudio de prueba A',
        estadoActual: 'En evaluación · dictamen vencido',
        etapa: 'EVALUACION',
        etapaOrden: 3,
        fechaPlazo: '2026-11-01T05:00:00.000Z',
        estadoPlazo: 'VENCIDO',
        accion: 'REASIGNAR',
        accionTexto: 'Reasignar',
      },
    ],
  };
  const envoltorio = { statusCode: 200, message: 'OK', data };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...PENDIENTES_PROVIDERS, provideHttpClient(), provideHttpClientTesting()],
    });
    port = TestBed.inject(PendientesPort);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('PENDIENTES_PROVIDERS registra PendientesHttpAdapter para PendientesPort', () => {
    expect(port).toBeInstanceOf(PendientesHttpAdapter);
  });

  it('GET …/secretaria/pendientes?filtro=vencidos', () => {
    port.obtener('vencidos').subscribe();

    const req = httpMock.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('filtro')).toBe('vencidos');
    expect(req.request.urlWithParams).toBe(`${url}?filtro=vencidos`);
    req.flush(envoltorio);
  });

  it('respuesta sin envoltorio de transporte ({ statusCode, message, data })', () => {
    let r: PendientesResumen | undefined;
    port.obtener('todos').subscribe((v) => (r = v));

    httpMock.expectOne((req) => req.url === url).flush(envoltorio);

    expect(r?.fechaReferencia).toBe('2026-11-04');
    expect(r?.items[0].ceishCode).toBe('IO-999-2026');
  });

  it('respuesta con envoltorio de transporte (doble { statusCode, message, data })', () => {
    let r: PendientesResumen | undefined;
    port.obtener('todos').subscribe((v) => (r = v));

    httpMock
      .expectOne((req) => req.url === url)
      .flush({ statusCode: 200, message: 'OK', data: envoltorio });

    expect(r?.totales).toEqual({ todos: 1, vencidos: 1, hoy: 0, semana: 0 });
    expect(r?.items.length).toBe(1);
  });

  it('un 400 llega como error al suscriptor (no como lista vacía)', () => {
    let next = false;
    let error: unknown;
    port.obtener('hoy').subscribe({ next: () => (next = true), error: (e) => (error = e) });

    httpMock
      .expectOne((req) => req.url === url)
      .flush({ statusCode: 400, message: 'Filtro inválido' }, { status: 400, statusText: 'Bad Request' });

    expect(next).toBeFalse();
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(400);
  });

  it('una respuesta fuera de contrato llega como ContractError al suscriptor', () => {
    let next = false;
    let error: unknown;
    port.obtener('semana').subscribe({ next: () => (next = true), error: (e) => (error = e) });

    httpMock
      .expectOne((req) => req.url === url)
      .flush({ statusCode: 200, message: 'OK', data: { ...data, fechaReferencia: '04/11/2026' } });

    expect(next).toBeFalse();
    expect(error).toBeInstanceOf(ContractError);
    expect((error as ContractError).path).toBe('data.fechaReferencia');
  });
});
