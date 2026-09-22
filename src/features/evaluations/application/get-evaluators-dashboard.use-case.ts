import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort, EvaluatorsDashboardResponse } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class GetEvaluatorsDashboardUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(profileId?: string): Observable<EvaluatorsDashboardResponse> {
    return this.repo.getEvaluatorsDashboard(profileId);
  }
}
