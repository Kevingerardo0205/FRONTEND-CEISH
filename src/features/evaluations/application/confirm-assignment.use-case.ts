import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class ConfirmAssignmentUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(evaluationId: string, deadline: string): Observable<void> {
    return this.repo.confirmAssignment({ evaluationId, deadline });
  }
}
