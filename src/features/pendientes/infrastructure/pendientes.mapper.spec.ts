import { Stage } from '@domain/value-objects/stage.vo';
import { ContractError } from '@infrastructure/mappers/contract-readers';
import { PendientesMapper } from './pendientes.mapper';

/** Contrato de RF-ALR.f.5 con datos inventados. */
function contrato(): Record<string, unknown> {
  return {
    fechaReferencia: '2026-11-04',
    totales: { todos: 3, vencidos: 1, hoy: 1, semana: 1 },
    items: [
      {
        protocolId: 41,
        ceishCode: 'IO-999-2026',
        title: 'Estudio de prueba A',
        estadoActual: 'En evaluación · dictamen vencido',
        etapa: 'EVALUACION',
        etapaOrden: 3,
        fechaPlazo: '2026-11-01T05:00:00.000Z',
        estadoPlazo: 'VENCIDO',
        accion: 'REASIGNAR',
        accionTexto: 'Reasignar',
      },
      {
        protocolId: '42',
        ceishCode: null,
        title: 'Estudio de prueba B',
        estadoActual: 'Recepción por validar',
        etapa: 'RECEPCION',
        etapaOrden: 1,
        fechaPlazo: null,
        estadoPlazo: 'SIN_PLAZO',
        accion: 'VALIDAR',
        accionTexto: 'Validar',
      },
    ],
  };
}

function item(over: Record<string, unknown>): Record<string, unknown> {
  const base = (contrato()['items'] as Record<string, unknown>[])[0];
  return { ...contrato(), items: [{ ...base, ...over }] };
}

function errorDe(data: unknown): ContractError {
  try {
    PendientesMapper.toResumen(data);
  } catch (e) {
    if (e instanceof ContractError) return e;
    throw e;
  }
  throw new Error('no lanzó');
}

describe('PendientesMapper (F01 T01-2)', () => {
  it('contrato de RF-ALR.f.5 completo', () => {
    const r = PendientesMapper.toResumen(contrato());

    expect(r.fechaReferencia).toBe('2026-11-04');
    expect(r.totales).toEqual({ todos: 3, vencidos: 1, hoy: 1, semana: 1 });
    expect(r.items).toEqual([
      {
        protocolId: 41,
        ceishCode: 'IO-999-2026',
        title: 'Estudio de prueba A',
        estadoActual: 'En evaluación · dictamen vencido',
        etapa: Stage.fromBackend('EVALUACION'),
        fechaPlazo: '2026-11-01T05:00:00.000Z',
        estadoPlazo: 'VENCIDO',
        accion: 'REASIGNAR',
        accionTexto: 'Reasignar',
      },
      {
        protocolId: '42',
        ceishCode: null,
        title: 'Estudio de prueba B',
        estadoActual: 'Recepción por validar',
        etapa: Stage.fromBackend('RECEPCION'),
        fechaPlazo: null,
        estadoPlazo: 'SIN_PLAZO',
        accion: 'VALIDAR',
        accionTexto: 'Validar',
      },
    ]);
  });

  it('sin pendientes: items vacío y totales en 0', () => {
    const r = PendientesMapper.toResumen({
      fechaReferencia: '2026-11-04',
      totales: { todos: 0, vencidos: 0, hoy: 0, semana: 0 },
      items: [],
    });
    expect(r.items).toEqual([]);
    expect(r.totales.todos).toBe(0);
  });

  it('title no string → lanza con la ruta del campo', () => {
    for (const v of [{ es: 'objeto' }, 12, null, undefined]) {
      const e = errorDe(item({ title: v }));
      expect([e.path, e.expected]).withContext(String(v)).toEqual(['data.items[0].title', 'string']);
    }
  });

  it('estadoActual no string → lanza con la ruta del campo', () => {
    const e = errorDe(item({ estadoActual: ['Recepción'] }));
    expect(e.path).toBe('data.items[0].estadoActual');
  });

  it("ceishCode null se conserva; un número lanza", () => {
    expect(PendientesMapper.toResumen(item({ ceishCode: null })).items[0].ceishCode).toBeNull();
    expect(errorDe(item({ ceishCode: 999 })).path).toBe('data.items[0].ceishCode');
  });

  it("etapa 'XYZ' → etapa: null sin lanzar (la fila se sigue mostrando)", () => {
    const [p] = PendientesMapper.toResumen(item({ etapa: 'XYZ' })).items;
    expect(p.etapa).toBeNull();
    expect(p.title).toBe('Estudio de prueba A');
  });

  it('etapa null → etapa: null; una etapa que no es texto lanza', () => {
    expect(PendientesMapper.toResumen(item({ etapa: null })).items[0].etapa).toBeNull();
    expect(errorDe(item({ etapa: { code: 'EVALUACION' } })).path).toBe('data.items[0].etapa');
  });

  it("accion 'EMITIR' → accion: null sin lanzar", () => {
    const [p] = PendientesMapper.toResumen(item({ accion: 'EMITIR' })).items;
    expect(p.accion).toBeNull();
    expect(p.accionTexto).toBe('Reasignar');
  });

  it('las 3 acciones conocidas se conservan', () => {
    for (const a of ['VALIDAR', 'ASIGNAR', 'REASIGNAR']) {
      expect(PendientesMapper.toResumen(item({ accion: a })).items[0].accion).toBe(a as never);
    }
  });

  it('los 5 estadoPlazo se aceptan; uno fuera de los 5 lanza', () => {
    for (const s of ['VENCIDO', 'HOY', 'SEMANA', 'PROXIMO', 'SIN_PLAZO']) {
      expect(PendientesMapper.toResumen(item({ estadoPlazo: s })).items[0].estadoPlazo).toBe(s as never);
    }
    for (const s of ['MANANA', 'vencido', null]) {
      expect(errorDe(item({ estadoPlazo: s })).path)
        .withContext(String(s))
        .toBe('data.items[0].estadoPlazo');
    }
  });

  it("fechaReferencia '04/11/2026' → lanza", () => {
    const e = errorDe({ ...contrato(), fechaReferencia: '04/11/2026' });
    expect([e.path, e.expected]).toEqual(['data.fechaReferencia', 'YYYY-MM-DD']);
    expect(errorDe({ ...contrato(), fechaReferencia: '2026-11-04T00:00:00Z' }).path).toBe(
      'data.fechaReferencia',
    );
    expect(errorDe({ ...contrato(), fechaReferencia: 20261104 }).path).toBe('data.fechaReferencia');
  });

  it('totales con un texto lanza; items que no es arreglo lanza', () => {
    expect(
      errorDe({ ...contrato(), totales: { todos: '3', vencidos: 1, hoy: 1, semana: 1 } }).path,
    ).toBe('data.totales.todos');
    expect(errorDe({ ...contrato(), items: {} }).path).toBe('data.items');
    expect(errorDe(null).path).toBe('data');
  });

  it('protocolId null lanza; accionTexto no string lanza', () => {
    expect(errorDe(item({ protocolId: null })).path).toBe('data.items[0].protocolId');
    expect(errorDe(item({ accionTexto: 1 })).path).toBe('data.items[0].accionTexto');
  });
});
