import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({ providedIn: 'root' })
export class SubmitPeerRiskAssessmentUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(
    assignmentId: string,
    payload: {
      riskLevelId: number;
      observations: string;
      reportPath: string;
    },
  ): Observable<void> {
    return this.evalRepo.submitPeerRiskProposed(assignmentId, payload);
  }
}
