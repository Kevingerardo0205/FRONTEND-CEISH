import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IEvaluationRepositoryPort,
  ChecklistDetailItem,
} from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({ providedIn: 'root' })
export class GetEvaluationChecklistDetailsUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(evaluationId: string): Observable<ChecklistDetailItem[]> {
    return this.evalRepo.getChecklistDetails(evaluationId);
  }
}
