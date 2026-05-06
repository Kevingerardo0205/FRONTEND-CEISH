import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class SuggestEvaluatorsUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(protocolId: string, evaluatorIds: string[]): Observable<void> {
    return this.repo.suggestEvaluators({ protocolId, evaluatorIds });
  }
}
