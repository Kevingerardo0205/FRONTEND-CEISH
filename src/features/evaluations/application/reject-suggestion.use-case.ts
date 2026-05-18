import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class RejectSuggestionUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(id: string): Observable<void> {
    return this.repo.rejectSuggestion(id);
  }
}
