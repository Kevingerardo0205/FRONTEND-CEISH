import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';

import { ProtocolWorkspaceService } from './protocol-workspace.service';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { ProtocolApiAdapter } from '@infrastructure/adapters/protocol-api.adapter';
import { ErrorInterceptor } from '@infrastructure/interceptors/error.interceptor';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { RoleHome } from '@infrastructure/guards/role-home.guard';
import { environment } from 'src/environments/environment';

/**
 * F10 S-1g (D14). Cadena real: servicio → ProtocolApiAdapter → HttpClient → ErrorInterceptor.
 * Las respuestas de error copian la forma de `HttpExceptionFilter` del backend (`dev`):
 * `{ statusCode, timestamp, path, error: { message, error, statusCode } }`, con los textos de
 * `protocols.service.ts:73-78` y `protocol.controller.ts:238-241`.
 */
const url = (id: string) => `${environment.apiUrl}/protocols/${id}`;

const NOT_FOUND_BODY = {
  statusCode: 404,
  timestamp: '2026-11-11T21:00:00.000Z',
  path: '/api/protocols/5',
  error: { message: 'Protocol with ID 5 not found', error: 'Not Found', statusCode: 404 },
};
const BAD_ID_BODY = {
  statusCode: 400,
  timestamp: '2026-11-11T21:00:00.000Z',
  path: '/api/protocols/abc',
  error: { message: 'ID de protocolo debe ser un número', error: 'Bad Request', statusCode: 400 },
};
const SERVER_ERROR_BODY = {
  statusCode: 500,
  timestamp: '2026-11-11T21:00:00.000Z',
  path: '/api/protocols/5',
  error: { message: 'Internal server error' },
};

/** `GET /protocols/:id` real: objeto plano con `receptionStatus` y `statusId` (Paso 0 de S-1f). */
function protocolBody(id: number, title: string) {
  return { id, title, receptionStatus: 'COMPLETO', statusId: null };
}

describe('ProtocolWorkspaceService - carga y errores (F10 D14, S-1g)', () => {
  let service: ProtocolWorkspaceService;
  let http: HttpTestingController;
  let evaluationRepo: { getByProtocolId: jasmine.Spy };

  beforeEach(() => {
    evaluationRepo = { getByProtocolId: jasmine.createSpy('getByProtocolId') };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: IProtocolRepositoryPort, useClass: ProtocolApiAdapter },
        { provide: IEvaluationRepositoryPort, useValue: evaluationRepo },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open'), openDialogs: [] } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']) },
        { provide: AuthFacade, useValue: jasmine.createSpyObj('AuthFacade', ['refreshToken', 'logout']) },
        { provide: RoleHome, useValue: { urlTree: () => 'inicio-del-rol-activo' } },
        ProtocolWorkspaceService,
      ],
    });
    service = TestBed.inject(ProtocolWorkspaceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function load(id: string): void {
    service.loadProtocol(id).subscribe({ error: () => undefined });
  }

  it('un 404 del backend queda como no encontrado y deja de cargar', () => {
    load('5');
    expect(service.isLoading()).toBeTrue();

    http.expectOne(url('5')).flush(NOT_FOUND_BODY, { status: 404, statusText: 'Not Found' });

    expect(service.error()).toBe('not-found');
    expect(service.protocol()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  });

  it('un 400 por id que no es número también queda como no encontrado', () => {
    load('abc');
    http.expectOne(url('abc')).flush(BAD_ID_BODY, { status: 400, statusText: 'Bad Request' });

    expect(service.error()).toBe('not-found');
    expect(service.isLoading()).toBeFalse();
  });

  it('un 500 queda como error de carga, no como no encontrado', () => {
    load('5');
    http
      .expectOne(url('5'))
      .flush(SERVER_ERROR_BODY, { status: 500, statusText: 'Internal Server Error' });

    expect(service.error()).toBe('failed');
    expect(service.isLoading()).toBeFalse();
  });

  it('sin conexión, después de los 2 reintentos del interceptor, queda como error y deja de cargar', fakeAsync(() => {
    load('5');
    for (let attempt = 0; attempt < 3; attempt++) {
      http.expectOne(url('5')).error(new ProgressEvent('error'), { status: 0, statusText: '' });
      tick(1000);
    }

    expect(service.error()).toBe('failed');
    expect(service.isLoading()).toBeFalse();
  }));

  it('cargar el protocolo no pide las evaluaciones (las pide el Resumen)', () => {
    load('5');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    expect(service.protocol()?.id).toBe('5');
    expect(evaluationRepo.getByProtocolId).not.toHaveBeenCalled();
  });

  it('al cambiar de :id no queda el protocolo anterior mientras carga el nuevo', () => {
    load('5');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    load('6');

    expect(service.protocol()).toBeNull();
    http.expectOne(url('6')).flush(protocolBody(6, 'Estudio de prueba seis'));
    expect(service.protocol()?.title).toBe('Estudio de prueba seis');
  });

  it('al recargar el mismo :id se conserva el protocolo mientras llega la respuesta', () => {
    load('5');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    load('5');

    expect(service.protocol()?.title).toBe('Estudio de prueba cinco');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));
  });

  it('un error de evaluaciones queda como error, no como lista vacía; Reintentar lo limpia', () => {
    const list = [{ id: '1', investigator: 'Evaluador Prueba', status: 'PENDING' }] as unknown as EvaluationEntity[];
    const retry$ = new Subject<EvaluationEntity[]>();
    evaluationRepo.getByProtocolId.and.returnValues(throwError(() => new Error('fallo')), retry$);

    service.loadEvaluations('5');
    expect(service.evaluationsError()).toBeTrue();
    expect(service.evaluationsLoading()).toBeFalse();

    service.loadEvaluations('5');
    expect(service.evaluationsError()).toBeFalse();
    expect(service.evaluationsLoading()).toBeTrue();
    retry$.next(list);
    retry$.complete();

    expect(service.evaluations()).toEqual(list);
    expect(service.evaluationsLoading()).toBeFalse();
  });
});
