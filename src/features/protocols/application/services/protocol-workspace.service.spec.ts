import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ProtocolWorkspaceService } from './protocol-workspace.service';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { ProtocolHeaderData, ProtocolHeaderPort } from '../../domain/protocol-header';
import { ContractError } from '@infrastructure/mappers/contract-readers';
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

/** Encabezado ficticio del `:id` (F10 D18). */
function headerOf(id: string): ProtocolHeaderData {
  return { code: `CEISH-PRUEBA-${id}`, version: '1.0', title: `Encabezado ${id}`, riskLevel: null, stage: null };
}

describe('ProtocolWorkspaceService - carga y errores (F10 D14, S-1g)', () => {
  let service: ProtocolWorkspaceService;
  let http: HttpTestingController;
  let evaluationRepo: { getByProtocolId: jasmine.Spy; getActiveAssignments: jasmine.Spy };
  /** F10 D18: el encabezado sale de su propio port; aquí, sin HTTP. */
  let headerPort: { get: jasmine.Spy<(id: string) => Observable<ProtocolHeaderData>> };

  beforeEach(() => {
    evaluationRepo = {
      getByProtocolId: jasmine.createSpy('getByProtocolId'),
      getActiveAssignments: jasmine.createSpy('getActiveAssignments'),
    };
    headerPort = { get: jasmine.createSpy('get').and.callFake((id: string) => of(headerOf(id))) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: IProtocolRepositoryPort, useClass: ProtocolApiAdapter },
        { provide: IEvaluationRepositoryPort, useValue: evaluationRepo },
        { provide: ProtocolHeaderPort, useValue: headerPort },
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

  it('D18: el encabezado se pide junto con el protocolo y queda con el mismo :id', () => {
    load('5');
    expect(headerPort.get).toHaveBeenCalledOnceWith('5');
    expect(service.header()).toBeNull();

    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    expect(service.header()).toEqual(headerOf('5'));
    expect(service.protocol()?.id).toBe('5');
  });

  it('D18: al cambiar de :id no queda el encabezado anterior mientras carga el nuevo', () => {
    load('5');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    load('6');

    expect(service.header()).toBeNull();
    http.expectOne(url('6')).flush(protocolBody(6, 'Estudio de prueba seis'));
    expect(service.header()).toEqual(headerOf('6'));
  });

  it('D18: si falla la recarga del mismo :id, se conservan el protocolo y el encabezado', () => {
    load('5');
    http.expectOne(url('5')).flush(protocolBody(5, 'Estudio de prueba cinco'));

    load('5');
    http
      .expectOne(url('5'))
      .flush(SERVER_ERROR_BODY, { status: 500, statusText: 'Internal Server Error' });

    expect(service.error()).toBe('failed');
    expect(service.protocol()?.title).toBe('Estudio de prueba cinco');
    expect(service.header()).toEqual(headerOf('5'));
  });

  it('D18: si el encabezado no se puede leer, la carga falla como cualquier error (D14)', () => {
    headerPort.get.and.returnValue(throwError(() => new ContractError('response.title', 'string | null')));

    load('5');
    // La petición del protocolo ya salió; su respuesta no cambia el resultado.
    http.match(url('5'));

    expect(service.error()).toBe('failed');
    expect(service.protocol()).toBeNull();
    expect(service.header()).toBeNull();
    expect(service.isLoading()).toBeFalse();
  });

  describe('asignaciones activas (F11-35, F11-36, F11-38)', () => {
    const result = (n: number) => ({
      protocolId: 5, ceishCode: 'C', versionId: 1, versionNumber: 1,
      assignments: Array.from({ length: n }, (_, i) => ({
        assignmentId: i + 1, evaluatorId: i + 1, evaluatorFullName: 'E' + i,
        evaluatorProfile: 'SALUD' as const, status: 'ASSIGNED' as const,
        isAssignedForAnnex10: false, assignedAt: null, deadlineDate: null, submittedAt: null,
      })),
    });

    it('empieza sin pedir nada (idle)', () => {
      expect(service.activeAssignments()).toEqual({ kind: 'idle' });
    });

    it('con asignaciones queda como has y sin ellas como none', () => {
      evaluationRepo.getActiveAssignments.and.returnValue(of(result(2)));
      service.ensureActiveAssignments(5);
      expect(service.activeAssignments()).toEqual({ kind: 'has', count: 2 });

      evaluationRepo.getActiveAssignments.and.returnValue(of(result(0)));
      service.ensureActiveAssignments(6);
      expect(service.activeAssignments()).toEqual({ kind: 'none' });
    });

    it('un error queda como error, nunca como none, y Reintentar lo vuelve a pedir', () => {
      evaluationRepo.getActiveAssignments.and.returnValue(throwError(() => new Error('x')));
      service.ensureActiveAssignments(5);
      expect(service.activeAssignments()).toEqual({ kind: 'error' });

      evaluationRepo.getActiveAssignments.and.returnValue(of(result(1)));
      service.retryActiveAssignments();
      expect(service.activeAssignments()).toEqual({ kind: 'has', count: 1 });
    });

    it('pide una sola vez por protocolo salvo con force', () => {
      evaluationRepo.getActiveAssignments.and.returnValue(of(result(0)));
      service.ensureActiveAssignments(5);
      service.ensureActiveAssignments(5);
      expect(evaluationRepo.getActiveAssignments).toHaveBeenCalledTimes(1);

      service.ensureActiveAssignments(5, true);
      expect(evaluationRepo.getActiveAssignments).toHaveBeenCalledTimes(2);
    });

    it('clear() vuelve a idle', () => {
      evaluationRepo.getActiveAssignments.and.returnValue(of(result(1)));
      service.ensureActiveAssignments(5);
      service.clear();
      expect(service.activeAssignments()).toEqual({ kind: 'idle' });
    });
  });
});
