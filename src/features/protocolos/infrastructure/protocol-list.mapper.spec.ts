import { Stage } from '@domain/value-objects/stage.vo';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { ProtocolListMapper } from './protocol-list.mapper';

// Contrato de GET /api/protocols (spec-001 RF-EST.3, TSK-001.4). Datos ficticios.
const FILA = {
  id: 41,
  ceishCode: 'IO-999-2026',
  title: 'Estudio de prueba A',
  version: 1,
  studyType: 'Observacional',
  statusId: 7,
  receptionDate: '2026-10-01T05:00:00.000Z',
  etapa: 'EVALUACION',
  etapaOrden: 3,
  principalInvestigator: { id: 'u-1', fullName: 'Investigadora de prueba' },
};
const PAGINA = { data: [FILA], total: 21, page: 2, limit: 20, totalPages: 2 };

function errorDe(fn: () => unknown): ContractError {
  try {
    fn();
  } catch (e) {
    if (e instanceof ContractError) return e;
    throw e;
  }
  throw new Error('no lanzó');
}

describe('ProtocolListMapper (F01 T01-6)', () => {
  it('respuesta paginada completa; los demás campos existentes se ignoran', () => {
    const r = ProtocolListMapper.toResultado(PAGINA);
    expect(r).toEqual({
      items: [
        {
          id: 41,
          ceishCode: 'IO-999-2026',
          title: 'Estudio de prueba A',
          etapa: Stage.fromBackend('EVALUACION'),
          principalInvestigator: { id: 'u-1', fullName: 'Investigadora de prueba' },
        },
      ],
      total: 21,
      page: 2,
      limit: 20,
      totalPages: 2,
    });
    expect(Object.keys(r.items[0]).sort()).toEqual(
      ['ceishCode', 'etapa', 'id', 'principalInvestigator', 'title'].sort(),
    );
  });

  it('acepta la página dentro del envoltorio { statusCode, message, data }', () => {
    const r = ProtocolListMapper.toResultado({ statusCode: 200, message: 'Success', data: PAGINA });
    expect(r.total).toBe(21);
    expect(r.items.length).toBe(1);
  });

  it('con envoltorio, la ruta del error empieza en data', () => {
    const malo = { ...PAGINA, data: [{ ...FILA, title: 5 }] };
    expect(
      errorDe(() =>
        ProtocolListMapper.toResultado({ statusCode: 200, message: 'Success', data: malo }),
      ).path,
    ).toBe('data.data[0].title');
  });

  it('página vacía', () => {
    expect(
      ProtocolListMapper.toResultado({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
        .items,
    ).toEqual([]);
  });

  it('ceishCode null → null', () => {
    const r = ProtocolListMapper.toResultado({ ...PAGINA, data: [{ ...FILA, ceishCode: null }] });
    expect(r.items[0].ceishCode).toBeNull();
  });

  it('principalInvestigator null → null', () => {
    const r = ProtocolListMapper.toResultado({
      ...PAGINA,
      data: [{ ...FILA, principalInvestigator: null }],
    });
    expect(r.items[0].principalInvestigator).toBeNull();
  });

  it('fullName no string → lanza con la ruta del campo', () => {
    const fila = { ...FILA, principalInvestigator: { id: 'u-1', fullName: { nombre: 'x' } } };
    expect(errorDe(() => ProtocolListMapper.toResultado({ ...PAGINA, data: [fila] })).path).toBe(
      'response.data[0].principalInvestigator.fullName',
    );
  });

  it('etapa desconocida o null → etapa null sin lanzar', () => {
    const r = ProtocolListMapper.toResultado({
      ...PAGINA,
      data: [
        { ...FILA, etapa: 'XYZ' },
        { ...FILA, etapa: null },
      ],
    });
    expect(r.items.map((i) => i.etapa)).toEqual([null, null]);
  });

  it('id string o number; otro tipo lanza', () => {
    const r = ProtocolListMapper.toResultado({
      ...PAGINA,
      data: [FILA, { ...FILA, id: '9f1c-uuid' }],
    });
    expect(r.items.map((i) => i.id)).toEqual([41, '9f1c-uuid']);
    expect(
      errorDe(() => ProtocolListMapper.toResultado({ ...PAGINA, data: [{ ...FILA, id: null }] }))
        .path,
    ).toBe('response.data[0].id');
  });

  it('title no string → lanza', () => {
    expect(
      errorDe(() => ProtocolListMapper.toResultado({ ...PAGINA, data: [{ ...FILA, title: null }] }))
        .path,
    ).toBe('response.data[0].title');
  });

  it('totalPages ausente → lanza', () => {
    const { totalPages: _omitido, ...sinTotalPages } = PAGINA;
    expect(errorDe(() => ProtocolListMapper.toResultado(sinTotalPages)).path).toBe(
      'response.totalPages',
    );
  });

  it('data que no es array → lanza', () => {
    expect(errorDe(() => ProtocolListMapper.toResultado({ ...PAGINA, data: 'x' })).path).toBe(
      'response.data',
    );
  });
});
