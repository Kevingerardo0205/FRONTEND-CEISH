import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { ProtocolHeaderData, ProtocolHeaderPort } from '../domain/protocol-header';
import { ProtocolHeaderMapper } from './protocol-header.mapper';

/**
 * `GET /protocols/:id` para el encabezado del protocolo (F10 D18). El error (HTTP o de contrato)
 * se propaga al suscriptor, sin `catchError`. `ProtocolApiAdapter.getById()` no cambia.
 */
@Injectable()
export class ProtocolHeaderHttpAdapter extends ProtocolHeaderPort {
  private readonly apiClient = inject(ApiClientService);

  get(id: string): Observable<ProtocolHeaderData> {
    return this.apiClient
      .get<unknown>(ENDPOINTS.PROTOCOLS.BY_ID(id))
      .pipe(map((body) => ProtocolHeaderMapper.toHeader(body)));
  }
}
