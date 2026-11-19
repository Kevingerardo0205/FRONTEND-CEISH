import { AccionPendiente } from './pendiente.model';

/**
 * Texto que reemplaza al botón cuando la Secretaría no tiene acción en esa fila (F03 D10 (5)):
 * desde TSK-002-N52 solo la Presidenta asigna evaluadores.
 */
export const ASIGNAR_SIN_ACCION_TEXTO = 'Pendiente de asignación por la Presidencia';

/** Texto en lugar del botón, o null si la fila tiene acción o no se reconoce. */
export function textoSinAccion(accion: AccionPendiente | null): string | null {
  return accion === 'ASIGNAR' ? ASIGNAR_SIN_ACCION_TEXTO : null;
}

/**
 * Destino de la acción de una fila (spec-ui §3.1.1, plan §4.3), como comandos de `Router`.
 * Una acción desconocida devuelve `null`: la fila se muestra sin botón (no se inventa un destino).
 */
export function destinoAccion(
  accion: AccionPendiente | null,
  protocolId: string | number,
): (string | number)[] | null {
  switch (accion) {
    case 'VALIDAR':
      return ['/dashboard/protocols/workspace', protocolId, 'validation'];
    case 'ASIGNAR':
      // F03 D10 (5): sin acción para la Secretaría (antes, D1: el espacio del protocolo).
      return null;
    case 'REASIGNAR':
      return ['/dashboard/evaluations/reassignment', protocolId];
    default:
      return null;
  }
}
