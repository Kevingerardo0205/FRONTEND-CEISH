import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IEvaluationRepositoryPort, ConsolidatedEvaluationResponse } from '@domain/ports/IEvaluationRepositoryPort';

export interface NormalizedEvaluation {
  verdict: string;
  ethicsResult: string;
  methodologyResult: string;
  legalResult: string;
  evaluatorProfile: string;
  evaluatorName: string;
  [key: string]: unknown;
}

export interface ConsolidationResult {
  evaluations: NormalizedEvaluation[];
  isUnanimous: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoadEvaluationConsolidationUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(protocolId: string): Observable<ConsolidationResult> {
    return this.evalRepo.consolidateEvaluation(protocolId).pipe(
      map((res: ConsolidatedEvaluationResponse) => {
        const data = res.data || res;
        const rawList = (Array.isArray(data.evaluations) ? data.evaluations : []) as Record<string, unknown>[];
        const normalized = rawList.map((ev: Record<string, unknown>) => ({
          ...ev,
          verdict: (ev['verdict'] || ev['result'] || 'APROBADO') as string,
          ethicsResult: (ev['ethicsResult'] || ev['ethicalAspects'] || ev['result'] || 'APROBADO') as string,
          methodologyResult: (ev['methodologyResult'] || ev['methodologicalAspects'] || ev['result'] || 'APROBADO') as string,
          legalResult: (ev['legalResult'] || ev['legalAspects'] || ev['result'] || 'APROBADO') as string,
          evaluatorProfile: (ev['evaluatorProfile'] || 'Evaluador') as string,
          evaluatorName: (ev['evaluatorName'] || ('Evaluador #' + (ev['evaluatorId'] || ev['id'] || ''))) as string
        }));
        return {
          evaluations: normalized,
          isUnanimous: data.isUnanimous ?? true
        };
      })
    );
  }
}
