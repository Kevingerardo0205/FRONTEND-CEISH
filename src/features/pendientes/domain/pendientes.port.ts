import { Observable } from 'rxjs';
import { FiltroPendientes, PendientesResumen } from './pendiente.model';

/**
 * Pendientes de la Secretaría (spec-003 RF-ALR.f.5). Se registra en los `providers` de la ruta
 * `/pendientes` con `PENDIENTES_PROVIDERS` (plan §3). Un error del backend o de contrato llega
 * al suscriptor: nunca se convierte en una lista vacía.
 */
export abstract class PendientesPort {
  abstract obtener(filtro: FiltroPendientes): Observable<PendientesResumen>;
}
