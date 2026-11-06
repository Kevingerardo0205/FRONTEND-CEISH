import { plazoChip } from './plazo.rules';

describe('plazoChip (F01 T01-5, spec-ui §5.2)', () => {
  it('VENCIDO → rojo, "Venció dd/MM/yyyy"', () => {
    expect(plazoChip('VENCIDO', '20/10/2026')).toEqual({ tone: 'rojo', texto: 'Venció 20/10/2026' });
  });

  it('HOY → ambar, "Vence hoy"', () => {
    expect(plazoChip('HOY', '06/11/2026')).toEqual({ tone: 'ambar', texto: 'Vence hoy' });
  });

  it('SEMANA → azul, "Vence dd/MM/yyyy"', () => {
    expect(plazoChip('SEMANA', '10/11/2026')).toEqual({ tone: 'azul', texto: 'Vence 10/11/2026' });
  });

  it('PROXIMO → gris, "Vence dd/MM/yyyy"', () => {
    expect(plazoChip('PROXIMO', '30/11/2026')).toEqual({ tone: 'gris', texto: 'Vence 30/11/2026' });
  });

  it('SIN_PLAZO → gris, "Sin plazo" (aunque llegue una fecha)', () => {
    expect(plazoChip('SIN_PLAZO', null)).toEqual({ tone: 'gris', texto: 'Sin plazo' });
    expect(plazoChip('SIN_PLAZO', '30/11/2026')).toEqual({ tone: 'gris', texto: 'Sin plazo' });
  });

  it('fechaPlazo null con un estado distinto de SIN_PLAZO → "Sin plazo" (no se inventa la fecha)', () => {
    for (const estado of ['VENCIDO', 'HOY', 'SEMANA', 'PROXIMO'] as const) {
      expect(plazoChip(estado, null)).withContext(estado).toEqual({ tone: 'gris', texto: 'Sin plazo' });
    }
  });
});
