import { AccionPendiente } from './pendiente.model';
import { destinoAccion } from './accion.rules';

describe('destinoAccion (F01 T01-5, spec-ui §3.1.1)', () => {
  it('VALIDAR → /dashboard/protocols/workspace/{id}/validation', () => {
    expect(destinoAccion('VALIDAR', 41)).toEqual(['/dashboard/protocols/workspace', 41, 'validation']);
  });

  it('ASIGNAR → /dashboard/protocols/workspace/{id}/info (D1)', () => {
    expect(destinoAccion('ASIGNAR', 42)).toEqual(['/dashboard/protocols/workspace', 42, 'info']);
  });

  it('REASIGNAR → /dashboard/evaluations/reassignment/{id}', () => {
    expect(destinoAccion('REASIGNAR', '43')).toEqual(['/dashboard/evaluations/reassignment', '43']);
  });

  it('acción null o desconocida → null', () => {
    expect(destinoAccion(null, 44)).toBeNull();
    expect(destinoAccion('EMITIR' as AccionPendiente, 44)).toBeNull();
  });
});
