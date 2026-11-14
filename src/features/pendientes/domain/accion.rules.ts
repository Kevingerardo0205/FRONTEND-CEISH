import { AccionPendiente } from './pendiente.model';

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
      // D1: el espacio de ESE protocolo, donde `Asignar Pares` abre la asignación.
      return ['/dashboard/protocols/workspace', protocolId, 'info'];
    case 'REASIGNAR':
      return ['/dashboard/evaluations/reassignment', protocolId];
    default:
      return null;
  }
}
