import { convertToParamMap } from '@angular/router';
import { queryDesdeUrl } from './protocol-list-query.rules';

const ANIO_ACTUAL = 2026;

function q(params: Record<string, string>) {
  return queryDesdeUrl(convertToParamMap(params), ANIO_ACTUAL);
}

describe('queryDesdeUrl (F01 T01-6, spec-ui §7.5, D10)', () => {
  it('sin parámetros: página 1, limit 20 y nada más', () => {
    expect(q({})).toEqual({ page: 1, limit: 20 });
  });

  it('etapa válida se conserva; desconocida o en minúsculas se descarta', () => {
    expect(q({ etapa: 'EVALUACION' }).etapa).toBe('EVALUACION');
    expect('etapa' in q({ etapa: 'XYZ' })).toBeFalse();
    expect('etapa' in q({ etapa: 'evaluacion' })).toBeFalse();
  });

  it('year: 1999 no, 2000 sí, año en curso sí, año en curso + 1 no, "abc" no', () => {
    expect('year' in q({ year: '1999' })).toBeFalse();
    expect(q({ year: '2000' }).year).toBe(2000);
    expect(q({ year: String(ANIO_ACTUAL) }).year).toBe(ANIO_ACTUAL);
    expect('year' in q({ year: String(ANIO_ACTUAL + 1) })).toBeFalse();
    expect('year' in q({ year: 'abc' })).toBeFalse();
    expect('year' in q({ year: '2020.5' })).toBeFalse();
  });

  it('el límite del año sale del argumento, no del reloj', () => {
    expect(queryDesdeUrl(convertToParamMap({ year: '2030' }), 2030).year).toBe(2030);
    expect('year' in queryDesdeUrl(convertToParamMap({ year: '2030' }), 2029)).toBeFalse();
  });

  it('page: 0 → 1, 1 → 1, "2" → 2, "x" → 1, "-3" → 1', () => {
    expect(q({ page: '0' }).page).toBe(1);
    expect(q({ page: '1' }).page).toBe(1);
    expect(q({ page: '2' }).page).toBe(2);
    expect(q({ page: 'x' }).page).toBe(1);
    expect(q({ page: '-3' }).page).toBe(1);
  });

  it('search se recorta; vacío o solo espacios no se envía', () => {
    expect(q({ search: '  IO-001  ' }).search).toBe('IO-001');
    expect('search' in q({ search: '' })).toBeFalse();
    expect('search' in q({ search: '   ' })).toBeFalse();
  });

  it('search de 100 caracteres se envía; de 101 se descarta', () => {
    expect(q({ search: 'a'.repeat(100) }).search).toBe('a'.repeat(100));
    expect('search' in q({ search: 'a'.repeat(101) })).toBeFalse();
  });

  it('limit es siempre 20, aunque la URL traiga otro', () => {
    expect(q({ limit: '100' }).limit).toBe(20);
  });

  it('todo válido junto', () => {
    expect(q({ etapa: 'RESOLUCION', year: '2025', page: '3', search: 'estudio' })).toEqual({
      etapa: 'RESOLUCION',
      year: 2025,
      page: 3,
      search: 'estudio',
      limit: 20,
    });
  });
});
