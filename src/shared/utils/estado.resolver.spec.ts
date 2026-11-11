import { EstadoCatalog } from '@domain/catalogs/estado.catalog';
import { estadoById } from './estado.resolver';

/**
 * Ids del backend (dev: `src/modules/protocols/domain/enums/protocol-status.enum.ts` y, para el 25,
 * la migración `1796000000000-AddCallsAndSessions`). Es la referencia: no se deriva del catálogo.
 */
const EXPECTED_CODE_BY_ID: Record<number, string> = {
  9: 'INICIADO',
  10: 'COMPLETO',
  11: 'INCOMPLETO',
  12: 'ARCHIVADO_VENCIMIENTO',
  13: 'EN_EVALUACION',
  14: 'EVALUADO',
  15: 'EN_REVISION_SECRETARIA',
  16: 'DISCREPANCIA_RIESGO',
  17: 'APROBADO',
  18: 'RECHAZADO',
  19: 'REQUIERE_SUBSANACION_VERSION',
  20: 'REQUIERE_SUBSANACION_DOC',
  21: 'EN_CONTROL_DOCUMENTAL',
  25: 'APROBADO_CON_CONDICION',
};

describe('estadoById (F10 D13)', () => {
  for (const [id, code] of Object.entries(EXPECTED_CODE_BY_ID)) {
    it('el id ' + id + ' es ' + code, () => {
      expect(estadoById(Number(id))?.code).toBe(code);
    });
  }

  it('el catálogo no tiene ids fuera de la tabla del backend', () => {
    const ids: number[] = Object.values(EstadoCatalog).map((estado) => estado.id);
    expect(ids.sort((a, b) => a - b)).toEqual(
      Object.keys(EXPECTED_CODE_BY_ID)
        .map(Number)
        .sort((a, b) => a - b),
    );
  });

  it('un id desconocido, NULL o undefined da null', () => {
    expect(estadoById(99)).toBeNull();
    expect(estadoById(0)).toBeNull();
    expect(estadoById(null)).toBeNull();
    expect(estadoById(undefined)).toBeNull();
  });
});
