import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import {
  MeetingContractError,
  MeetingDetail,
  PaginatedMeetings,
  PendingProtocol,
} from '@domain/entities/meeting.entity';
import { MeetingApiAdapter } from './meeting-api.adapter';

/**
 * Doble envoltorio: el ResponseInterceptor del backend envuelve la respuesta del
 * controlador ({statusCode, message, data[, meta]}) en {data, statusCode, message}.
 */

// A) Capturado en Postman contra el backend real: GET /evaluations/meetings?limit=1
const PAYLOAD_A = JSON.parse(
  String.raw`{"data":{"statusCode":200,"message":"Convocatorias obtenidas exitosamente","data":[{"id":"0d6a04aa-c451-4657-b496-4f7ee03e0172","meetingNumber":"007-2026","academicYear":2026,"sessionType":"ORDINARIA","meetingDate":"2026-04-16T10:00:00.000Z","evalSubmissionDeadline":"2026-04-09T23:59:59.999Z","status":"PROGRAMADA","place":null,"agendaPdfUrl":"/api/evaluations/meetings/0d6a04aa-c451-4657-b496-4f7ee03e0172/pdf","protocolCount":1}],"meta":{"total":10,"page":1,"limit":1}},"statusCode":200,"message":"Success"}`,
);

// B) Capturado en Postman contra el backend real: GET /evaluations/meetings/places (sin lugares activos)
const PAYLOAD_B = JSON.parse(
  String.raw`{"data":{"statusCode":200,"message":"Lugares obtenidos exitosamente","data":[]},"statusCode":200,"message":"Success"}`,
);

// C) Capturado en Postman contra el backend real: GET /evaluations/meetings/:id (detalle 009-2026)
const PAYLOAD_C = JSON.parse(
  String.raw`{"data":{"statusCode":200,"message":"Convocatoria obtenida exitosamente","data":{"id":"3e01bd19-7563-4dd1-aa65-ebee64ffa7a6","meetingNumber":"009-2026","academicYear":2026,"sessionType":"ORDINARIA","meetingDate":"2026-04-16T10:00:00.000Z","evalSubmissionDeadline":"2026-04-09T23:59:59.999Z","status":"PROGRAMADA","place":null,"agendaPdfUrl":"/api/evaluations/meetings/3e01bd19-7563-4dd1-aa65-ebee64ffa7a6/pdf","protocolCount":1,"protocols":[{"order":1,"protocolId":165,"versionId":137,"versionNumber":1,"ceishCode":"CEISH-ESPOCH-IO-004-2026","title":"Nuevo Protocolo ll Complete la información básica y cargue la documentación requerida por el CEISH.\n\n","studyType":"Observacional","investigatorName":"liliana  berzabet paguay carrillo","normativeDeadline":"2026-09-30T19:44:20.069Z"}]}},"statusCode":200,"message":"Success"}`,
);

// D) Capturado en Postman contra el backend real: GET /evaluations/meetings/pending-protocols (2 de 15)
const PAYLOAD_D = JSON.parse(
  String.raw`{"data":{"statusCode":200,"message":"Protocolos pendientes obtenidos exitosamente","data":[{"protocolId":100,"versionId":48,"versionNumber":1,"ceishCode":"CEISH-ESPOCH-EI-001-2026","title":"gggggggggggggggggggggggggggggggggggg","studyType":"Intervención","investigatorName":"wdsd asd asd asdasd","receptionDate":"2026-05-18T22:57:15.609Z","deadline":"2026-05-18T22:57:15.609Z"},{"protocolId":159,"versionId":130,"versionNumber":1,"ceishCode":"CEISH-ESPOCH-EI-014-2026","title":" F3 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios","studyType":"Intervención","investigatorName":"liliana  berzabet paguay carrillo","receptionDate":"2026-06-25T14:47:46.377Z","deadline":"2026-08-27T14:47:46.377Z"}]},"statusCode":200,"message":"Success"}`,
);

// Payload sintético, no capturado del backend real: capa interna tomada del spec de
// getPlaces() en meeting-api.adapter.spec.ts, envuelta en la capa externa.
const SYNTHETIC_PLACES = {
  data: {
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
  },
  statusCode: 200,
  message: 'Success',
};

// Payload sintético, no capturado del backend real: capa interna tomada del contract
// spec (POST /meetings), envuelta en la capa externa.
const SYNTHETIC_CREATE = {
  data: {
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
  },
  statusCode: 200,
  message: 'Success',
};

// Payload sintético, no capturado del backend real: el contract spec no cubre
// calculate-eval-date; capa interna tomada de meeting-api.adapter.spec.ts.
const SYNTHETIC_CALC = {
  data: {
    statusCode: 200,
    message: 'OK',
    data: { suggestedEvalSubmissionDeadline: '2026-11-11T23:59:00.000Z' },
  },
  statusCode: 200,
  message: 'Success',
};

interface Case {
  name: string;
  url: string;
  call: (a: MeetingApiAdapter) => Observable<unknown>;
  double: { data: object };
}

const CASES: Case[] = [
  {
    name: 'list()',
    url: '/api/evaluations/meetings',
    call: (a) => a.list({ limit: 1 }),
    double: PAYLOAD_A,
  },
  {
    name: 'getById()',
    url: '/api/evaluations/meetings/3e01bd19-7563-4dd1-aa65-ebee64ffa7a6',
    call: (a) => a.getById('3e01bd19-7563-4dd1-aa65-ebee64ffa7a6'),
    double: PAYLOAD_C,
  },
  {
    name: 'getPendingProtocols()',
    url: '/api/evaluations/meetings/pending-protocols',
    call: (a) => a.getPendingProtocols(),
    double: PAYLOAD_D,
  },
  {
    name: 'getPlaces()',
    url: '/api/evaluations/meetings/places',
    call: (a) => a.getPlaces(),
    double: PAYLOAD_B,
  },
  {
    name: 'create()',
    url: '/api/evaluations/meetings',
    call: (a) =>
      a.create({
        sessionType: 'ORDINARIA',
        meetingDate: '2027-01-13T14:00:00.000Z',
        protocolVersionIds: [101],
      }),
    double: SYNTHETIC_CREATE,
  },
  {
    name: 'calculateEvalDate()',
    url: '/api/evaluations/meetings/calculate-eval-date',
    call: (a) => a.calculateEvalDate('2026-11-18T14:00:00.000Z'),
    double: SYNTHETIC_CALC,
  },
];

describe('MeetingApiAdapter: doble envoltorio de transporte', () => {
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

  function run(c: Case, body: object): { result: unknown; error: unknown } {
    const out: { result: unknown; error: unknown } = { result: undefined, error: undefined };
    c.call(adapter).subscribe({ next: (r) => (out.result = r), error: (e) => (out.error = e) });
    httpMock.expectOne((r) => r.url === c.url).flush(body);
    return out;
  }

  it('list() [A real]: devuelve items y paginación total 10, page 1, limit 1 con place null', () => {
    const { result, error } = run(CASES[0], PAYLOAD_A);
    expect(error).toBeUndefined();
    const page = result as PaginatedMeetings;
    expect(page.items.length).toBe(1);
    expect(page.items[0].id).toBe('0d6a04aa-c451-4657-b496-4f7ee03e0172');
    expect(page.items[0].meetingNumber).toBe('007-2026');
    expect(page.items[0].place).toBeNull();
    expect(page.meta).toEqual({ total: 10, page: 1, limit: 1 });
  });

  it('getPlaces() [B real]: lista vacía devuelve [] sin error', () => {
    const { result, error } = run(CASES[3], PAYLOAD_B);
    expect(error).toBeUndefined();
    expect(result).toEqual([]);
  });

  it('getPlaces() [payload sintético, no capturado del backend real]: mapea lugares', () => {
    const { result, error } = run(CASES[3], SYNTHETIC_PLACES);
    expect(error).toBeUndefined();
    expect(result).toEqual([SYNTHETIC_PLACES.data.data[0]]);
  });

  it('getById() [C real]: detalle con protocols[0].order 1 e investigatorName', () => {
    const { result, error } = run(CASES[1], PAYLOAD_C);
    expect(error).toBeUndefined();
    const detail = result as MeetingDetail;
    expect(detail.meetingNumber).toBe('009-2026');
    expect(detail.protocols.length).toBe(1);
    expect(detail.protocols[0].order).toBe(1);
    expect(detail.protocols[0].investigatorName).toBe('liliana  berzabet paguay carrillo');
  });

  it('getPendingProtocols() [D real]: 2 elementos con receptionDate y deadline', () => {
    const { result, error } = run(CASES[2], PAYLOAD_D);
    expect(error).toBeUndefined();
    const list = result as PendingProtocol[];
    expect(list.length).toBe(2);
    expect(list.map((p) => [p.receptionDate, p.deadline])).toEqual([
      ['2026-05-18T22:57:15.609Z', '2026-05-18T22:57:15.609Z'],
      ['2026-06-25T14:47:46.377Z', '2026-08-27T14:47:46.377Z'],
    ]);
  });

  it('create() [payload sintético, no capturado del backend real]: devuelve la reunión creada', () => {
    const { result, error } = run(CASES[4], SYNTHETIC_CREATE);
    expect(error).toBeUndefined();
    expect(result).toEqual(SYNTHETIC_CREATE.data.data);
  });

  it('calculateEvalDate() [payload sintético, no capturado del backend real]: devuelve la fecha sugerida', () => {
    const { result, error } = run(CASES[5], SYNTHETIC_CALC);
    expect(error).toBeUndefined();
    expect(result).toBe('2026-11-11T23:59:00.000Z');
  });

  for (const c of CASES) {
    it(`${c.name}: acepta también la forma INTERNA sola (una capa)`, () => {
      const double = run(c, c.double);
      const single = run(c, c.double.data);
      expect(single.error).toBeUndefined();
      expect(double.error).toBeUndefined();
      expect(single.result).toEqual(double.result);
    });

    it(`${c.name}: respuesta sin data lanza MeetingContractError`, () => {
      const { error } = run(c, { statusCode: 200, message: 'Success' });
      expect(error instanceof MeetingContractError).toBeTrue();
    });

    it(`${c.name}: capa externa con statusCode no numérico lanza MeetingContractError`, () => {
      const { error } = run(c, { ...c.double, statusCode: '200' });
      expect(error instanceof MeetingContractError).toBeTrue();
    });
  }
});
