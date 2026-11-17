import { Provider } from '@angular/core';
import { ProtocolHeaderPort } from './domain/protocol-header';
import { ProtocolHeaderHttpAdapter } from './infrastructure/protocol-header-http.adapter';

/**
 * Raíz de composición del encabezado del protocolo (F10 D18): se registra en los `providers` de la
 * ruta `workspace/:id` (`routes.ts`), no en root.
 */
export const PROTOCOL_HEADER_PROVIDERS: Provider[] = [
  { provide: ProtocolHeaderPort, useClass: ProtocolHeaderHttpAdapter },
];
