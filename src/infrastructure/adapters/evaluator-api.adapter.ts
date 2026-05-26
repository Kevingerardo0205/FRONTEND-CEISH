import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';
import { ApiClientService } from '../api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorApiAdapter extends IEvaluatorRepositoryPort {
  private apiClient = inject(ApiClientService);

  getEvaluatorsWithLoad(): Observable<EvaluatorEntity[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.DASHBOARD).pipe(
      map(res => {
        const raw = res.data || res;
        if (Array.isArray(raw)) {
          return raw;
        }
        if (raw && typeof raw === 'object' && Array.isArray(raw.evaluators)) {
          return raw.evaluators;
        }
        return [];
      })
    );
  }

  suggestEvaluators(protocolId: string, evaluatorIds: string[]): Observable<void> {
    return this.apiClient.post(ENDPOINTS.EVALUATIONS.SUGGEST, { protocolId, evaluatorIds });
  }

  confirmAssignment(protocolId: string, evaluatorIds: string[], deadlineDays: number): Observable<void> {
    // Nota: El endpoint real podría variar un poco en su estructura de confirmación
    return this.apiClient.patch(ENDPOINTS.EVALUATIONS.CONFIRM, { protocolId, evaluatorIds, deadlineDays });
  }

  getProtocolsForAssignment(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PENDING_SUGGESTIONS).pipe(
      map(res => res.data || res)
    );
  }
}
