import { Observable } from 'rxjs';
import { ProtocolListQuery, ProtocolListResult } from './protocol-list-item.model';

/**
 * Lista paginada de Protocolos (spec-001 RF-EST.3, TSK-001.4). Se registra en los `providers` de
 * la ruta `/protocolos` con `PROTOCOLOS_PROVIDERS` (plan §3 y §3.2), no en root. Un error del
 * backend o de contrato llega al suscriptor: nunca se convierte en una lista vacía.
 */
export abstract class ProtocolosListPort {
  abstract listar(q: ProtocolListQuery): Observable<ProtocolListResult>;
}
