import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { PendingCountHttpAdapter } from './pending-count-http.adapter';

describe('PendingCountHttpAdapter', () => {
  let adapter: PendingCountHttpAdapter;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/secretaria/pendientes`;
  const row = { codigo: 'CEISH-001', titulo: 'Estudio A', estado: 'RECIBIDO', etapa: 'RECEPCION' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PendingCountHttpAdapter, provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(PendingCountHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('hace GET /secretaria/pendientes y cuenta las filas', () => {
    let count: number | undefined;
    adapter.count$.subscribe((c) => (count = c));

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([row, row, row]);

    expect(count).toBe(3);
  });

  it('acepta las filas envueltas en { data }', () => {
    let count: number | undefined;
    adapter.count$.subscribe((c) => (count = c));

    httpMock.expectOne(url).flush({ data: [row] });

    expect(count).toBe(1);
  });

  it('falla con un error controlado si la respuesta no trae filas', () => {
    let error: Error | undefined;
    adapter.count$.subscribe({ error: (e: Error) => (error = e) });

    httpMock.expectOne(url).flush({ total: 4 });

    expect(error?.message).toBe('Respuesta inesperada de /secretaria/pendientes');
  });

  it('una respuesta nula también es un error controlado', () => {
    let error: Error | undefined;
    adapter.count$.subscribe({ error: (e: Error) => (error = e) });

    httpMock.expectOne(url).flush(null);

    expect(error).toBeDefined();
  });
});
