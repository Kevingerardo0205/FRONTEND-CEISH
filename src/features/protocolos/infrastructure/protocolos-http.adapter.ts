import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { ProtocolListQuery, ProtocolListResult } from '../domain/protocol-list-item.model';
import { ProtocolosListPort } from '../domain/protocolos-list.port';
import { ProtocolListMapper } from './protocol-list.mapper';

/**
 * `GET /protocols?search&year&etapa&page&limit` (spec-001 RF-EST.3, TSK-001.4). No envía
 * parámetros vacíos. El error (HTTP o de contrato) se PROPAGA al suscriptor: no hay `catchError`
 * que lo convierta en una lista vacía (spec-ui §5.5). `ProtocolApiAdapter.getAll()` no cambia.
 */
@Injectable()
export class ProtocolosHttpAdapter extends ProtocolosListPort {
  private readonly apiClient = inject(ApiClientService);

  listar(q: ProtocolListQuery): Observable<ProtocolListResult> {
    return this.apiClient
      .get<unknown>(ENDPOINTS.PROTOCOLS.BASE, parametros(q))
      .pipe(map((body) => ProtocolListMapper.toResultado(body)));
  }
}

function parametros(q: ProtocolListQuery): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (q.search) p['search'] = q.search;
  if (q.year !== undefined) p['year'] = q.year;
  if (q.etapa) p['etapa'] = q.etapa;
  p['page'] = q.page;
  p['limit'] = q.limit;
  return p;
}
