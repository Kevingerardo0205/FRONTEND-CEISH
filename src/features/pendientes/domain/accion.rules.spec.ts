import { AccionPendiente } from './pendiente.model';
import { ASIGNAR_SIN_ACCION_TEXTO, destinoAccion, textoSinAccion } from './accion.rules';

describe('destinoAccion (F01 T01-5, spec-ui §3.1.1)', () => {
  it('VALIDAR → /dashboard/protocols/workspace/{id}/validation', () => {
    expect(destinoAccion('VALIDAR', 41)).toEqual(['/dashboard/protocols/workspace', 41, 'validation']);
  });

  it('ASIGNAR → sin destino: asigna la Presidenta (F03 D10 (5))', () => {
    expect(destinoAccion('ASIGNAR', 42)).toBeNull();
  });

  it('REASIGNAR → /dashboard/evaluations/reassignment/{id}', () => {
    expect(destinoAccion('REASIGNAR', '43')).toEqual(['/dashboard/evaluations/reassignment', '43']);
  });

  it('acción null o desconocida → null', () => {
    expect(destinoAccion(null, 44)).toBeNull();
    expect(destinoAccion('EMITIR' as AccionPendiente, 44)).toBeNull();
  });
});

describe('textoSinAccion (F03 D10 (5))', () => {
  it('ASIGNAR → «Pendiente de asignación por la Presidencia»', () => {
    expect(textoSinAccion('ASIGNAR')).toBe('Pendiente de asignación por la Presidencia');
    expect(ASIGNAR_SIN_ACCION_TEXTO).toBe('Pendiente de asignación por la Presidencia');
  });

  it('las demás acciones y null → null (tienen botón o no se reconocen)', () => {
    expect(textoSinAccion('VALIDAR')).toBeNull();
    expect(textoSinAccion('REASIGNAR')).toBeNull();
    expect(textoSinAccion(null)).toBeNull();
  });
});
