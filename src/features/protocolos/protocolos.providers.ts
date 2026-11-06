import { Provider } from '@angular/core';
import { ProtocolosListPort } from './domain/protocolos-list.port';
import { ProtocolosHttpAdapter } from './infrastructure/protocolos-http.adapter';

/**
 * Raíz de composición de Protocolos (plan §3): se registra en los `providers` de la ruta
 * `/protocolos` (T01-7), no en root.
 */
export const PROTOCOLOS_PROVIDERS: Provider[] = [
  { provide: ProtocolosListPort, useClass: ProtocolosHttpAdapter },
];
