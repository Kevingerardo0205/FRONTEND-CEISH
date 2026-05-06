import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class GetMyAssignmentsUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(): Observable<any[]> {
    return this.repo.getMyAssignments();
  }
}
