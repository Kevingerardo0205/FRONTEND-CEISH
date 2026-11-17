import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProtocoloService } from './protocolo.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

describe('ProtocoloService — checklist del protocolo (F09 D16, C3)', () => {
  let service: ProtocoloService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30, rol: 'INVESTIGADOR' }) } },
        { provide: MatSnackBar, useValue: { open: () => undefined } },
        { provide: S3StorageService, useValue: {} },
      ],
    });
    service = TestBed.inject(ProtocoloService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function responder500(sufijo: string): void {
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith(sufijo))
      .flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
  }

  it('obtenerChecklist propaga un 500 sin pedir el detalle del protocolo', () => {
    let lista: unknown;
    let error: unknown;
    service.obtenerChecklist(5).subscribe({
      next: (valor) => (lista = valor),
      error: (err: unknown) => (error = err),
    });

    responder500('/protocols/checklist/5');

    expect(lista).toBeUndefined();
    expect(error).toBeTruthy();
    http.expectNone((req) => req.url.endsWith('/protocols/5'));
  });

  it('getChecklist sigue devolviendo [] cuando fallan el checklist y el detalle (subsanación)', () => {
    let lista: unknown;
    let error: unknown;
    service.getChecklist(5).subscribe({
      next: (valor) => (lista = valor),
      error: (err: unknown) => (error = err),
    });

    responder500('/protocols/checklist/5');
    responder500('/protocols/5');

    expect(error).toBeUndefined();
    expect(lista).toEqual([]);
  });
});

describe('ProtocoloService — Mis protocolos (F09 D18, C4)', () => {
  let service: ProtocoloService;
  let http: HttpTestingController;
  let snackOpen: jasmine.Spy;

  beforeEach(() => {
    snackOpen = jasmine.createSpy('open');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30, rol: 'INVESTIGADOR' }) } },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
        { provide: S3StorageService, useValue: {} },
      ],
    });
    service = TestBed.inject(ProtocoloService);
    http = TestBed.inject(HttpTestingController);
    spyOn(console, 'error');
  });

  afterEach(() => http.verify());

  function responder(status: number): void {
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/mis-protocolos?limit=100'))
      .flush({ message: 'Error de prueba' }, { status, statusText: 'Error de prueba' });
  }

  it('(14) misProtocolos sigue devolviendo [] con su snackbar cuando la consulta falla', () => {
    let lista: unknown;
    let error: unknown;
    service.misProtocolos().subscribe({
      next: (valor) => (lista = valor),
      error: (err: unknown) => (error = err),
    });

    responder(500);

    expect(error).toBeUndefined();
    expect(lista).toEqual([]);
    expect(snackOpen).toHaveBeenCalledTimes(1);
  });

  for (const status of [0, 404, 500]) {
    it(`(15) obtenerMisProtocolos propaga el error con su status ${status}, sin snackbar ni []`, () => {
      let lista: unknown;
      let error: unknown;
      service.obtenerMisProtocolos().subscribe({
        next: (valor) => (lista = valor),
        error: (err: unknown) => (error = err),
      });

      responder(status);

      expect(lista).toBeUndefined();
      expect((error as { status?: unknown }).status).toBe(status);
      expect(snackOpen).not.toHaveBeenCalled();
    });
  }

  it('obtenerMisProtocolos mapea la respuesta paginada como misProtocolos', () => {
    let lista: unknown;
    service.obtenerMisProtocolos().subscribe((valor) => (lista = valor));

    http
      .expectOne((req) => req.url.endsWith('/mis-protocolos?limit=100'))
      .flush({ data: { data: [{ id: 5, title: 'Estudio de prueba', receptionStatus: 'BORRADOR' }] } });

    expect(lista).toEqual([
      jasmine.objectContaining({ id: 5, titulo: 'Estudio de prueba', estado: 'BORRADOR' }),
    ]);
  });

  it('(MP1, T09-6) versionNumber sale de currentVersion y no del texto "N.0" de version', () => {
    let lista: { id: number; versionNumber?: number }[] = [];
    service.obtenerMisProtocolos().subscribe((valor) => (lista = valor));

    http.expectOne((req) => req.url.endsWith('/mis-protocolos?limit=100')).flush({
      data: {
        data: [
          { id: 1, receptionStatus: 'INCOMPLETO', version: '1.0', currentVersion: 1 },
          { id: 2, receptionStatus: 'INCOMPLETO', version: '2.0', currentVersion: 2 },
          { id: 3, receptionStatus: 'INCOMPLETO', version: '1.0' },
        ],
      },
    });

    expect(lista.map((p) => p.versionNumber)).toEqual([1, 2, 1]);
  });

  it('(MP1) mapea etapa, statusId, checklist, submissionDeadline e investigador principal', () => {
    let lista: unknown;
    service.obtenerMisProtocolos().subscribe((valor) => (lista = valor));

    http.expectOne((req) => req.url.endsWith('/mis-protocolos?limit=100')).flush({
      data: {
        data: [
          {
            id: 7,
            title: 'Estudio de prueba con observaciones',
            receptionStatus: 'INCOMPLETO',
            etapa: 'RECEPCION',
            statusId: null,
            submissionDeadline: '2026-12-04',
            principalInvestigator: { id: 30, fullName: 'Persona de prueba' },
            checklist: [
              { id: 1, code: 'A', name: 'Documento A', status: 'RECHAZADO', observations: 'x' },
              { id: 2, code: 'B', name: 'Documento B', status: 'APROBADO', observations: null },
            ],
          },
          { id: 8, title: 'Estudio de prueba sin datos extra', receptionStatus: 'BORRADOR' },
        ],
      },
    });

    expect(lista).toEqual([
      jasmine.objectContaining({
        id: 7,
        etapa: 'RECEPCION',
        statusId: null,
        submissionDeadline: '2026-12-04',
        principalInvestigatorId: 30,
        checklist: [{ status: 'RECHAZADO' }, { status: 'APROBADO' }],
      }),
      jasmine.objectContaining({
        id: 8,
        etapa: null,
        statusId: null,
        submissionDeadline: null,
        principalInvestigatorId: null,
        checklist: [],
      }),
    ]);
  });
});
