import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { stripTransportEnvelope, unwrapData } from '@infrastructure/mappers/contract-readers';
import { FiltroPendientes, PendientesResumen } from '../domain/pendiente.model';
import { PendientesPort } from '../domain/pendientes.port';
import { PendientesMapper } from './pendientes.mapper';

/**
 * `GET /secretaria/pendientes?filtro=…` (spec-003 RF-ALR.f.5). Acepta la respuesta con y sin el
 * envoltorio de transporte. El error (HTTP o de contrato) se PROPAGA al suscriptor: no hay
 * `catchError` que lo convierta en una lista vacía (spec-ui §5.5).
 */
@Injectable()
export class PendientesHttpAdapter extends PendientesPort {
  private readonly apiClient = inject(ApiClientService);

  obtener(filtro: FiltroPendientes): Observable<PendientesResumen> {
    return this.apiClient
      .get<unknown>(ENDPOINTS.SECRETARIA.PENDIENTES, { filtro })
      .pipe(map((body) => PendientesMapper.toResumen(unwrapData(stripTransportEnvelope(body)))));
  }
}
