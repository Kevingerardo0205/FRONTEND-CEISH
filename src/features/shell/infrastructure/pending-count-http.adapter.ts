import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import {
  ContractError,
  asObject,
  num,
  stripTransportEnvelope,
  unwrapData,
} from '@infrastructure/mappers/contract-readers';
import { PendingCountPort } from '../domain/pending-count.port';

/**
 * Contador del menú: `totales.todos` de `GET /secretaria/pendientes?filtro=todos`
 * (spec-003 RF-ALR.f.5; spec-ui F01 criterio 17). Se registra en root (`app.config.ts`).
 * Una respuesta fuera de contrato es un error; `GetPendingCountUseCase` lo convierte en `null`.
 * Solo lee este campo: `shell` no importa `features/pendientes` (plan F01 §2.4).
 */
@Injectable()
export class PendingCountHttpAdapter extends PendingCountPort {
  private readonly apiClient = inject(ApiClientService);

  readonly count$: Observable<number> = this.apiClient
    .get<unknown>(ENDPOINTS.SECRETARIA.PENDIENTES, { filtro: 'todos' })
    .pipe(map((body) => totalTodos(body)));
}

function totalTodos(body: unknown): number {
  const data = asObject(unwrapData(stripTransportEnvelope(body)), 'data');
  const totales = asObject(data['totales'], 'data.totales');
  const todos = num(totales, 'todos', 'data.totales');
  if (todos < 0) throw new ContractError('data.totales.todos', 'number >= 0');
  return todos;
}
