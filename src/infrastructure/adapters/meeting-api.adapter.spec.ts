import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MeetingApiError, MeetingContractError } from '@domain/entities/meeting.entity';
import { MeetingApiAdapter, normalizeMeetingError } from './meeting-api.adapter';

const MEETING = {
  id: '6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f',
  meetingNumber: 'CEISH-ORD-003-2026',
  academicYear: 2026,
  sessionType: 'ORDINARIA',
  meetingDate: '2026-11-04T14:00:00.000Z',
  evalSubmissionDeadline: null,
  status: 'PROGRAMADA',
  place: null,
  agendaPdfUrl: '/api/evaluations/meetings/6f1c2a10-1b2c-4d3e-8f90-0a1b2c3d4e5f/pdf',
  protocolCount: 1,
};

describe('MeetingApiAdapter', () => {
  let adapter: MeetingApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(MeetingApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() envía page/limit/status como query params y desenvuelve data/meta', () => {
    let result: unknown;
    adapter.list({ page: 2, limit: 20, status: 'PROGRAMADA' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url === '/api/evaluations/meetings');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('status')).toBe('PROGRAMADA');
    expect(req.request.params.keys().length).toBe(3);
    req.flush({
      statusCode: 200,
      message: 'OK',
      data: [MEETING],
      meta: { total: 21, page: 2, limit: 20 },
    });

    expect(result).toEqual({
      items: [{ ...MEETING, sessionType: 'ORDINARIA' }],
      meta: { total: 21, page: 2, limit: 20 },
    });
  });

  it('list() sin parámetros no envía query params', () => {
    adapter.list().subscribe();
    const req = httpMock.expectOne('/api/evaluations/meetings');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ statusCode: 200, message: 'OK', data: [], meta: { total: 0, page: 1, limit: 10 } });
  });

  it('getById() usa el uuid string en la URL y mapea el detalle', () => {
    let protocolsLength = -1;
    adapter.getById(MEETING.id).subscribe((d) => (protocolsLength = d.protocols.length));

    const req = httpMock.expectOne(`/api/evaluations/meetings/${MEETING.id}`);
    expect(req.request.method).toBe('GET');
    req.flush({
      statusCode: 200,
      message: 'OK',
      data: {
        ...MEETING,
        protocols: [
          {
            order: 1,
            protocolId: null,
            versionId: 42,
            versionNumber: 1,
            ceishCode: 'CEISH-2026-015',
            title: 'Estudio A',
            studyType: null,
            investigatorName: null,
            normativeDeadline: null,
          },
        ],
      },
    });
    expect(protocolsLength).toBe(1);
  });

  it('getPendingProtocols() llama a /meetings/pending-protocols', () => {
    let versionIds: number[] = [];
    adapter.getPendingProtocols().subscribe((list) => (versionIds = list.map((p) => p.versionId)));

    const req = httpMock.expectOne('/api/evaluations/meetings/pending-protocols');
    req.flush({
      statusCode: 200,
      message: 'OK',
      data: [
        {
          protocolId: 'c0ffee00-0000-4000-8000-000000000015',
          versionId: 87,
          versionNumber: 3,
          ceishCode: 'CEISH-2026-021',
          title: 'Estudio B',
          studyType: 'EXPERIMENTAL',
          investigatorName: 'Luis Andrade',
          receptionDate: '2026-10-01T00:00:00.000Z',
          deadline: null,
        },
      ],
    });
    expect(versionIds).toEqual([87]);
  });

  it('getPlaces() hace GET /meetings/places SIN query params (sin includeInactive)', () => {
    let names: string[] = [];
    adapter.getPlaces().subscribe((list) => (names = list.map((p) => p.name)));

    const req = httpMock.expectOne((r) => r.url === '/api/evaluations/meetings/places');
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toBe('/api/evaluations/meetings/places');
    expect(req.request.params.has('includeInactive')).toBeFalse();
    req.flush({
      statusCode: 200,
      message: 'OK',
      data: [
        {
          id: '9a8b7c6d-0000-4000-8000-000000000001',
          name: 'Sala de Sesiones del Rectorado',
          address: null,
          isVirtual: false,
          meetingLink: null,
          isActive: true,
        },
      ],
    });
    expect(names).toEqual(['Sala de Sesiones del Rectorado']);
  });

  it('create() envía exactamente el cuerpo permitido por el contrato', () => {
    let meetingNumber = '';
    adapter
      .create({
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-18T14:00:00.000Z',
        evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
        locationId: '9a8b7c6d-0000-4000-8000-000000000001',
        protocolVersionIds: [87, 42],
      })
      .subscribe((c) => (meetingNumber = c.meetingNumber));

    const req = httpMock.expectOne('/api/evaluations/meetings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      sessionType: 'ORDINARIA',
      meetingDate: '2026-11-18T14:00:00.000Z',
      evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
      locationId: '9a8b7c6d-0000-4000-8000-000000000001',
      protocolVersionIds: [87, 42],
    });
    for (const forbidden of [
      'callNumber',
      'meetingNumber',
      'agenda',
      'followUpReportIds',
      'meetingPlace',
    ]) {
      expect(Object.keys(req.request.body)).not.toContain(forbidden);
    }
    req.flush({
      statusCode: 201,
      message: 'Reunión creada',
      data: {
        id: '22222222-3333-4444-8555-666666666666',
        meetingNumber: 'CEISH-ORD-004-2026',
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-18T14:00:00.000Z',
        evalSubmissionDeadline: '2026-11-11T23:59:00.000Z',
        agendaPdfUrl: '/api/evaluations/meetings/22222222-3333-4444-8555-666666666666/pdf',
      },
    });
    expect(meetingNumber).toBe('CEISH-ORD-004-2026');
  });

  it('create() omite los opcionales no informados', () => {
    adapter
      .create({ sessionType: 'EXTRAORDINARIA', meetingDate: '2026-12-01T15:00:00.000Z' })
      .subscribe();
    const req = httpMock.expectOne('/api/evaluations/meetings');
    expect(req.request.body).toEqual({
      sessionType: 'EXTRAORDINARIA',
      meetingDate: '2026-12-01T15:00:00.000Z',
    });
    req.flush({
      statusCode: 201,
      message: 'OK',
      data: {
        id: '33333333-3333-4444-8555-666666666666',
        meetingNumber: 'CEISH-EXT-002-2026',
        sessionType: 'EXTRAORDINARIA',
        meetingDate: '2026-12-01T15:00:00.000Z',
        evalSubmissionDeadline: null,
        agendaPdfUrl: '/api/evaluations/meetings/33333333-3333-4444-8555-666666666666/pdf',
      },
    });
  });

  it('create() traduce 400 VERSIONES_DUPLICADAS a MeetingApiError tipado', () => {
    let error: unknown;
    adapter
      .create({
        sessionType: 'ORDINARIA',
        meetingDate: '2026-11-18T14:00:00.000Z',
        protocolVersionIds: [87, 87],
      })
      .subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/evaluations/meetings').flush(
      {
        statusCode: 400,
        message: 'VERSIONES_DUPLICADAS: la versión 87 está repetida',
        error: 'Bad Request',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error instanceof MeetingApiError).toBeTrue();
    expect((error as MeetingApiError).code).toBe('VERSIONES_DUPLICADAS');
    expect((error as MeetingApiError).status).toBe(400);
    expect((error as MeetingApiError).message).toBe(
      'VERSIONES_DUPLICADAS: la versión 87 está repetida',
    );
  });

  it('create() traduce errores de validación del DTO (message array) a VALIDACION', () => {
    let error: MeetingApiError | undefined;
    adapter
      .create({ sessionType: 'ORDINARIA', meetingDate: 'no-es-fecha' })
      .subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/evaluations/meetings').flush(
      {
        statusCode: 400,
        message: ['meetingDate must be a valid ISO 8601 date string'],
        error: 'Bad Request',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error?.code).toBe('VALIDACION');
    expect(error?.message).toBe('meetingDate must be a valid ISO 8601 date string');
  });

  it('calculateEvalDate() envía {meetingDate} y devuelve suggestedEvalSubmissionDeadline', () => {
    let suggested = '';
    adapter.calculateEvalDate('2026-11-18T14:00:00.000Z').subscribe((s) => (suggested = s));

    const req = httpMock.expectOne('/api/evaluations/meetings/calculate-eval-date');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ meetingDate: '2026-11-18T14:00:00.000Z' });
    req.flush({
      statusCode: 200,
      message: 'OK',
      data: { suggestedEvalSubmissionDeadline: '2026-11-11T23:59:00.000Z' },
    });
    expect(suggested).toBe('2026-11-11T23:59:00.000Z');
  });

  it('downloadPdf() pide GET /meetings/:id/pdf como blob', () => {
    let size = -1;
    adapter.downloadPdf(MEETING.id).subscribe((b) => (size = b.size));

    const req = httpMock.expectOne(`/api/evaluations/meetings/${MEETING.id}/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    expect(size).toBe(8);
  });

  it('propaga MeetingContractError cuando la respuesta no cumple el contrato', () => {
    let error: unknown;
    adapter.list().subscribe({ error: (e) => (error = e) });
    httpMock
      .expectOne('/api/evaluations/meetings')
      .flush({ statusCode: 200, message: 'OK', data: [MEETING] });
    expect(error instanceof MeetingContractError).toBeTrue();
    expect((error as MeetingContractError).path).toBe('response.meta');
  });
});

describe('normalizeMeetingError', () => {
  it('reconoce SEGUIMIENTO_NO_DISPONIBLE en el Error re-lanzado por el ErrorInterceptor', () => {
    const err = normalizeMeetingError(new Error('SEGUIMIENTO_NO_DISPONIBLE')) as MeetingApiError;
    expect(err.code).toBe('SEGUIMIENTO_NO_DISPONIBLE');
    expect(err.status).toBeNull();
  });

  it('marca como DESCONOCIDO un Error sin código conocido', () => {
    const err = normalizeMeetingError(new Error('Timeout')) as MeetingApiError;
    expect(err.code).toBe('DESCONOCIDO');
    expect(err.message).toBe('Timeout');
  });
});
