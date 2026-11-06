import { Provider } from '@angular/core';
import { PendientesPort } from './domain/pendientes.port';
import { PendientesHttpAdapter } from './infrastructure/pendientes-http.adapter';

/**
 * Raíz de composición de Mis pendientes (plan §3): se registra en los `providers` de la ruta
 * `/pendientes` (T01-5), no en root.
 */
export const PENDIENTES_PROVIDERS: Provider[] = [
  { provide: PendientesPort, useClass: PendientesHttpAdapter },
];
