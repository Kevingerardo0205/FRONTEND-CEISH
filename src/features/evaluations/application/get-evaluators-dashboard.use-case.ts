import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class GetEvaluatorsDashboardUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(profileId?: string): Observable<any> {
    return this.repo.getEvaluatorsDashboard(profileId);
  }
}
