import { inject, Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
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
    return of(undefined);
  }

  confirmAssignment(protocolId: string, evaluatorIds: string[], deadlineDays: number): Observable<void> {
    return of(undefined);
  }

  getProtocolsForAssignment(): Observable<any[]> {
    return of([]);
  }
}
