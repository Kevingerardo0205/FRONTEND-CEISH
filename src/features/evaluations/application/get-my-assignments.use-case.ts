import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort, EvaluationAssignment } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class GetMyAssignmentsUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(): Observable<EvaluationAssignment[]> {
    return this.repo.getMyAssignments();
  }
}
