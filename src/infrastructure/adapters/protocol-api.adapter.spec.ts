import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolApiAdapter } from './protocol-api.adapter';

/**
 * `ProtocolApiAdapter.mapToEntity` con el contrato de TSK-001.27 (F10 D19, EP1b): `toListResponse`
 * del backend, igual en `GET /protocols/:id` y en cada fila de `GET /protocols`. Datos ficticios.
 */
const PROTOCOLO = {
  id: 5,
  ceishCode: 'CEISH-PRUEBA-005',
  title: 'Estudio ficticio de adherencia al tratamiento',
  version: '1.0',
  studyType: 'Observacional de prueba',
  studyTypeCode: 'OBS',
  riskLevel: 'Riesgo mínimo',
  riskLevelCode: 'MINIMO',
  receptionStatus: 'COMPLETO',
  statusId: 13,
  etapa: 'EVALUACION',
  etapaOrden: 3,
  principalInvestigator: { id: 7, fullName: 'Investigador de prueba' },
  investigators: [],
};

describe('ProtocolApiAdapter.mapToEntity (F10 D19, TSK-001.27)', () => {
  let adapter: ProtocolApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(ProtocolApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function getById(body: object): ProtocolEntity {
    let entity: ProtocolEntity | undefined;
    adapter.getById('5').subscribe((p) => (entity = p));
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/protocols/5')).flush(body);
    return entity as ProtocolEntity;
  }

  function getAll(body: object): ProtocolEntity[] {
    let list: ProtocolEntity[] = [];
    adapter.getAll().subscribe((p) => (list = p));
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/protocols')).flush(body);
    return list;
  }

  it('GET /protocols/:id: investigador por fullName, tipo de estudio y riesgo como texto', () => {
    const p = getById({ statusCode: 200, message: 'Success', data: PROTOCOLO });

    expect(p.principalInvestigator).toBe('Investigador de prueba');
    expect(p.principalInvestigator).not.toContain('[object Object]');
    expect(p.studyType).toBe('Observacional de prueba');
    expect(p.studyTypeCode).toBe('OBS');
    expect(p.riskLevel).toBe('Riesgo mínimo');
  });

  it('GET /protocols (lista con el objeto principalInvestigator): ninguna fila dice «[object Object]»', () => {
    const otro = {
      ...PROTOCOLO,
      id: 6,
      principalInvestigator: { id: 8, fullName: 'Investigadora de prueba' },
    };
    const list = getAll({
      statusCode: 200,
      message: 'Success',
      data: { data: [PROTOCOLO, otro], meta: { total: 2, page: 1, limit: 10 } },
    });

    expect(list.map((p) => p.principalInvestigator)).toEqual([
      'Investigador de prueba',
      'Investigadora de prueba',
    ]);
  });

  it('GET /reception/protocols manda el investigador como texto: se conserva el nombre', () => {
    let list: ProtocolEntity[] = [];
    adapter.getReceptionProtocols().subscribe((p) => (list = p));
    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/reception/protocols'))
      .flush({
        statusCode: 200,
        message: 'Success',
        data: [
          {
            id: 5,
            ceishCode: 'CEISH-PRUEBA-005',
            title: 'Estudio ficticio de recepción',
            receptionStatus: 'EN_REVISION_SECRETARIA',
            studyType: 'Observacional de prueba',
            principalInvestigator: 'Investigador de prueba',
            etapa: 'RECEPCION',
            etapaOrden: 1,
          },
        ],
      });

    expect(list.map((p) => p.principalInvestigator)).toEqual(['Investigador de prueba']);
    expect(list[0].studyType).toBe('Observacional de prueba');
  });

  it('principalInvestigator null y riesgo sin fijar: textos vacíos, sin «[object Object]»', () => {
    const p = getById({
      statusCode: 200,
      message: 'Success',
      data: { ...PROTOCOLO, principalInvestigator: null, riskLevel: null, studyType: null },
    });

    expect(p.principalInvestigator).toBe('');
    expect(p.riskLevel).toBeNull();
    expect(p.studyType).toBeNull();
  });

  it('sin principalInvestigator sigue usando el investigador PRINCIPAL de investigators', () => {
    const p = getById({
      ...PROTOCOLO,
      principalInvestigator: undefined,
      investigators: [{ role: 'PRINCIPAL', fullName: 'Investigador de la lista' }],
    });

    expect(p.principalInvestigator).toBe('Investigador de la lista');
  });
});
