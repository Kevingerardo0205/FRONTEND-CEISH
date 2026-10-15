import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from 'src/app/app.config';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import { MeetingApiAdapter } from './meeting-api.adapter';

/**
 * Contrato estable /api/evaluations/meetings.
 * Los payloads replican la forma documentada del contrato (envelope
 * {statusCode, message, data[, meta]}, camelCase, fechas ISO 8601).
 */
const LIST_ENVELOPE = {
  statusCode: 200,
  message: 'Reuniones obtenidas',
  data: [
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000003',
      meetingNumber: 'CEISH-ORD-003-2026',
      academicYear: 2026,
      sessionType: 'ORDINARIA',
      meetingDate: '2026-12-02T14:00:00.000Z',
      evalSubmissionDeadline: '2026-11-25T23:59:00.000Z',
      status: 'PROGRAMADA',
      place: {
        id: 'bbbbbbbb-0000-4000-8000-000000000001',
        name: 'Sala de Sesiones del Rectorado',
        address: 'Panamericana Sur km 1 1/2',
        isVirtual: false,
        meetingLink: null,
      },
      agendaPdfUrl: '/api/evaluations/meetings/aaaaaaaa-0000-4000-8000-000000000003/pdf',
      protocolCount: 3,
    },
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000002',
      meetingNumber: 'CEISH-ORD-002-2026',
      academicYear: 2026,
      sessionType: 'ORDINARIA',
      meetingDate: '2026-10-07T14:00:00.000Z',
      evalSubmissionDeadline: null,
      status: 'FINALIZADA',
      place: {
        id: 'bbbbbbbb-0000-4000-8000-000000000002',
        name: 'Sala virtual',
        address: null,
        isVirtual: true,
        meetingLink: 'https://meet.example/ceish',
      },
      agendaPdfUrl: '/api/evaluations/meetings/aaaaaaaa-0000-4000-8000-000000000002/pdf',
      protocolCount: 1,
    },
    {
      id: 'aaaaaaaa-0000-4000-8000-000000000001',
      meetingNumber: 'CEISH-EXT-001-2026',
      academicYear: null,
      sessionType: 'EXTRAORDINARIA',
      meetingDate: null,
      evalSubmissionDeadline: null,
      status: 'BORRADOR',
      place: null,
      agendaPdfUrl: '/api/evaluations/meetings/aaaaaaaa-0000-4000-8000-000000000001/pdf',
      protocolCount: 0,
    },
  ],
  meta: { total: 3, page: 1, limit: 10 },
};

const DETAIL_ENVELOPE = {
  statusCode: 200,
  message: 'Reunión obtenida',
  data: {
    ...LIST_ENVELOPE.data[0],
    protocols: [
      {
        order: 1,
        protocolId: 'cccccccc-0000-4000-8000-000000000010',
        versionId: 101,
        versionNumber: 1,
        ceishCode: 'CEISH-2026-010',
        title: 'Estudio uno',
        studyType: 'OBSERVACIONAL',
        investigatorName: 'Ana Pérez',
        normativeDeadline: '2026-12-20T00:00:00.000Z',
      },
      {
        order: 2,
        protocolId: 'cccccccc-0000-4000-8000-000000000011',
        versionId: 102,
        versionNumber: 3,
        ceishCode: 'CEISH-2026-011',
        title: 'Estudio dos',
        studyType: null,
        investigatorName: null,
        normativeDeadline: null,
      },
      {
        order: 3,
        protocolId: null,
        versionId: null,
        versionNumber: null,
        ceishCode: null,
        title: null,
        studyType: null,
        investigatorName: null,
        normativeDeadline: null,
      },
    ],
  },
};

describe('CONTRATO /api/evaluations/meetings', () => {
  let repo: IMeetingRepositoryPort;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IMeetingRepositoryPort, useClass: MeetingApiAdapter },
      ],
    });
    repo = TestBed.inject(IMeetingRepositoryPort);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // verify() falla ante cualquier petición no esperada (incluido el endpoint legacy).
  afterEach(() => httpMock.verify());

  it('appConfig registra IMeetingRepositoryPort -> MeetingApiAdapter', () => {
    const provider = appConfig.providers.find(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        p.provide === IMeetingRepositoryPort,
    ) as { useClass?: unknown } | undefined;
    expect(provider?.useClass).toBe(MeetingApiAdapter);
  });

  it('GET /meetings: preserva el orden del backend (fechaReunion DESC NULLS LAST) y la meta', () => {
    let ids: string[] = [];
    let dates: (string | null)[] = [];
    let total = -1;
    repo.list().subscribe((r) => {
      ids = r.items.map((m) => m.id);
      dates = r.items.map((m) => m.meetingDate);
      total = r.meta.total;
    });
    httpMock.expectOne('/api/evaluations/meetings').flush(LIST_ENVELOPE);

    expect(ids).toEqual([
      'aaaaaaaa-0000-4000-8000-000000000003',
      'aaaaaaaa-0000-4000-8000-000000000002',
      'aaaaaaaa-0000-4000-8000-000000000001',
    ]);
    expect(dates).toEqual(['2026-12-02T14:00:00.000Z', '2026-10-07T14:00:00.000Z', null]);
    expect(total).toBe(3);
  });

  it('GET /meetings: no introduce defaults en place/status/academicYear', () => {
    let last: unknown;
    repo.list().subscribe((r) => (last = r.items[2]));
    httpMock.expectOne('/api/evaluations/meetings').flush(LIST_ENVELOPE);

    expect(last).toEqual(LIST_ENVELOPE.data[2]);
  });

  it('GET /meetings/:id: protocolos en orden ASC, con nulos preservados', () => {
    let orders: number[] = [];
    let third: unknown;
    repo.getById('aaaaaaaa-0000-4000-8000-000000000003').subscribe((d) => {
      orders = d.protocols.map((p) => p.order);
      third = d.protocols[2];
    });
    httpMock
      .expectOne('/api/evaluations/meetings/aaaaaaaa-0000-4000-8000-000000000003')
      .flush(DETAIL_ENVELOPE);

    expect(orders).toEqual([1, 2, 3]);
    expect(third).toEqual(DETAIL_ENVELOPE.data.protocols[2]);
  });

  it('POST /meetings: el número lo asigna el backend; el cliente no lo envía', () => {
    let number = '';
    repo
      .create({
        sessionType: 'ORDINARIA',
        meetingDate: '2027-01-13T14:00:00.000Z',
        protocolVersionIds: [101],
      })
      .subscribe((c) => (number = c.meetingNumber));

    const req = httpMock.expectOne('/api/evaluations/meetings');
    expect(req.request.body).toEqual({
      sessionType: 'ORDINARIA',
      meetingDate: '2027-01-13T14:00:00.000Z',
      protocolVersionIds: [101],
    });
    req.flush({
      statusCode: 201,
      message: 'Reunión creada',
      data: {
        id: 'aaaaaaaa-0000-4000-8000-000000000004',
        meetingNumber: 'CEISH-ORD-001-2027',
        sessionType: 'ORDINARIA',
        meetingDate: '2027-01-13T14:00:00.000Z',
        evalSubmissionDeadline: null,
        agendaPdfUrl: '/api/evaluations/meetings/aaaaaaaa-0000-4000-8000-000000000004/pdf',
      },
    });
    expect(number).toBe('CEISH-ORD-001-2027');
  });

  it('POST /meetings 400 SEGUIMIENTO_NO_DISPONIBLE llega tipado a la UI', () => {
    let code = '';
    repo
      .create({ sessionType: 'ORDINARIA', meetingDate: '2027-01-13T14:00:00.000Z' })
      .subscribe({ error: (e) => (code = e.code) });

    httpMock
      .expectOne('/api/evaluations/meetings')
      .flush(
        { statusCode: 400, message: 'SEGUIMIENTO_NO_DISPONIBLE', error: 'Bad Request' },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(code).toBe('SEGUIMIENTO_NO_DISPONIBLE');
  });
});
