import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { PendingCountPort } from '../domain/pending-count.port';

/**
 * GET /secretaria/pendientes (spec-003 v1.5.1, RF-ALR.f).
 * FALTA en backend: todavía no se registra como proveedor; se usa PendingCountMockAdapter.
 * El endpoint devuelve las filas de pendientes; el contador es la cantidad de filas.
 */
@Injectable()
export class PendingCountHttpAdapter extends PendingCountPort {
  private apiClient = inject(ApiClientService);

  readonly count$: Observable<number> = this.apiClient
    .get<unknown>(ENDPOINTS.SECRETARIA.PENDIENTES)
    .pipe(map((body) => countRows(body)));
}

function countRows(body: unknown): number {
  if (Array.isArray(body)) return body.length;
  const data = (body as { data?: unknown } | null)?.data;
  if (Array.isArray(data)) return data.length;
  throw new Error('Respuesta inesperada de /secretaria/pendientes');
}
