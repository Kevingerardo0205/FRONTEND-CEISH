import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { ProtocolHeaderData, ProtocolHeaderPort } from '../domain/protocol-header';
import { PROTOCOL_HEADER_PROVIDERS } from '../protocol-header.providers';
import { ProtocolHeaderHttpAdapter } from './protocol-header-http.adapter';

describe('ProtocolHeaderHttpAdapter (F10 D18)', () => {
  let port: ProtocolHeaderPort;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/protocols/5`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...PROTOCOL_HEADER_PROVIDERS, provideHttpClient(), provideHttpClientTesting()],
    });
    port = TestBed.inject(ProtocolHeaderPort);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('PROTOCOL_HEADER_PROVIDERS registra el adapter HTTP', () => {
    expect(port).toEqual(jasmine.any(ProtocolHeaderHttpAdapter));
  });

  it('pide GET /protocols/:id y entrega el encabezado sin rellenos', () => {
    let header: ProtocolHeaderData | undefined;
    port.get('5').subscribe((h) => (header = h));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({ statusCode: 200, message: 'Success', data: { id: 5, version: '1.0' } });

    expect(header).toEqual({ code: null, version: '1.0', title: null, riskLevel: null });
  });

  it('el error HTTP llega al suscriptor', () => {
    let error: unknown;
    port.get('5').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne(url).flush({}, { status: 404, statusText: 'Not Found' });

    expect(error).toEqual(jasmine.any(HttpErrorResponse));
    expect((error as HttpErrorResponse).status).toBe(404);
  });

  it('una respuesta fuera de contrato llega como ContractError', () => {
    let error: unknown;
    port.get('5').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne(url).flush({ id: 5, title: 7 });

    expect(error).toEqual(jasmine.any(ContractError));
  });
});
