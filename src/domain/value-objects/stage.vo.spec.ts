import { InvalidStageError, Stage, StageCode } from './stage.vo';

describe('Stage (VO)', () => {
  const expected: { code: StageCode; order: number; label: string }[] = [
    { code: 'RECEPCION', order: 1, label: 'Recepción' },
    { code: 'ASIGNACION', order: 2, label: 'Asignación' },
    { code: 'EVALUACION', order: 3, label: 'Evaluación' },
    { code: 'RESOLUCION', order: 4, label: 'Resolución' },
    { code: 'SEGUIMIENTO', order: 5, label: 'Seguimiento' },
    { code: 'RENOVACION', order: 6, label: 'Renovación' },
  ];

  it('all() devuelve las 6 etapas en orden', () => {
    expect(Stage.all().map((s) => ({ code: s.code, order: s.order, label: s.label }))).toEqual(
      expected,
    );
  });

  expected.forEach(({ code, order, label }) => {
    it(`fromBackend('${code}') devuelve la etapa ${order} "${label}"`, () => {
      const stage = Stage.fromBackend(code);
      expect(stage.code).toBe(code);
      expect(stage.order).toBe(order);
      expect(stage.label).toBe(label);
    });
  });

  it('fromBackend devuelve siempre la misma instancia para un código', () => {
    expect(Stage.fromBackend('EVALUACION')).toBe(Stage.fromBackend('EVALUACION'));
  });

  ['RIESGO', 'recepcion', '', ' RECEPCION', null, undefined, 3].forEach((invalid) => {
    it(`fromBackend(${JSON.stringify(invalid)}) lanza InvalidStageError`, () => {
      expect(() => Stage.fromBackend(invalid)).toThrowError(
        InvalidStageError,
        `Etapa desconocida: ${String(invalid)}`,
      );
    });
  });

  it('InvalidStageError conserva el valor recibido y su nombre', () => {
    try {
      Stage.fromBackend('RIESGO');
      fail('debía lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as InvalidStageError).name).toBe('InvalidStageError');
      expect((e as InvalidStageError).received).toBe('RIESGO');
    }
  });
});
