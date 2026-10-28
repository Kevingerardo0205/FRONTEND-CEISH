import { inject, Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import {
  IEvaluatorRepositoryPort,
  ProtocolForAssignment,
} from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';
import { ApiClientService } from '../api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';

interface EvaluatorDashboardApiResponse {
  data: { evaluators: EvaluatorEntity[] } | EvaluatorEntity[];
}

@Injectable({
  providedIn: 'root',
})
export class EvaluatorApiAdapter extends IEvaluatorRepositoryPort {
  private apiClient = inject(ApiClientService);

  getEvaluatorsWithLoad(): Observable<EvaluatorEntity[]> {
    return this.apiClient.get<EvaluatorDashboardApiResponse>(ENDPOINTS.EVALUATIONS.DASHBOARD).pipe(
      map((res) => {
        const raw = res.data || (res as unknown as EvaluatorDashboardApiResponse['data']);
        if (Array.isArray(raw)) {
          return raw;
        }
        if (
          raw &&
          typeof raw === 'object' &&
          Array.isArray((raw as { evaluators?: EvaluatorEntity[] }).evaluators)
        ) {
          return (raw as { evaluators: EvaluatorEntity[] }).evaluators;
        }
        return [];
      }),
    );
  }

  suggestEvaluators(_protocolId: string, _evaluatorIds: string[]): Observable<void> {
    return of(undefined);
  }

  confirmAssignment(
    _protocolId: string,
    _evaluatorIds: string[],
    _deadlineDays: number,
  ): Observable<void> {
    return of(undefined);
  }

  getProtocolsForAssignment(): Observable<ProtocolForAssignment[]> {
    return of([]);
  }
}
