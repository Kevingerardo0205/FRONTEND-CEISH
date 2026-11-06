import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { appConfig } from './app.config';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { GetPendingCountUseCase } from '@features/shell/application/get-pending-count.use-case';
import { GetMenuForRoleUseCase } from '@features/shell/application/get-menu-for-role.use-case';
import { PendingCountPort } from '@features/shell/domain/pending-count.port';
import { PendingCountHttpAdapter } from '@features/shell/infrastructure/pending-count-http.adapter';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

const provides = (providers: Provider[], token: unknown): boolean =>
  providers.some((p) => typeof p === 'object' && p !== null && 'provide' in p && p.provide === token);

describe('Proveedores del shell en la app real', () => {
  describe('F01 T01-3: contador con GET /secretaria/pendientes', () => {
    const url = `${environment.apiUrl}/secretaria/pendientes`;
    let httpMock: HttpTestingController;
    let count: number | null | undefined;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [...appConfig.providers, provideHttpClientTesting()],
      });
      httpMock = TestBed.inject(HttpTestingController);
      count = undefined;
      TestBed.inject(GetPendingCountUseCase)
        .execute()
        .subscribe((c) => (count = c));
    });

    afterEach(() => httpMock.verify());

    it('con appConfig, GetPendingCountUseCase emite totales.todos', () => {
      const req = httpMock.expectOne((r) => r.url === url);
      expect(req.request.params.get('filtro')).toBe('todos');
      req.flush({
        statusCode: 200,
        message: 'OK',
        data: {
          fechaReferencia: '2026-11-04',
          totales: { todos: 4, vencidos: 1, hoy: 1, semana: 2 },
          items: [],
        },
      });

      expect(count).toBe(4);
    });

    it('con appConfig, si la petición falla el contador emite null', () => {
      httpMock
        .expectOne((r) => r.url === url)
        .flush({ statusCode: 500, message: 'Error' }, { status: 500, statusText: 'Server Error' });

      expect(count).toBeNull();
    });
  });

  it('con appConfig, GetMenuForRoleUseCase da las 5 entradas de SECRETARIA', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(GetMenuForRoleUseCase).execute('SECRETARIA').length).toBe(5);
  });

  it('MenuConfigPort se registra en app.config.ts', () => {
    expect(provides(appConfig.providers as Provider[], MenuConfigPort)).toBeTrue();
  });

  it('appConfig provee PendingCountPort con PendingCountHttpAdapter (en root)', () => {
    expect(provides(appConfig.providers as Provider[], PendingCountPort)).toBeTrue();
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(PendingCountPort)).toBeInstanceOf(PendingCountHttpAdapter);
  });
});
