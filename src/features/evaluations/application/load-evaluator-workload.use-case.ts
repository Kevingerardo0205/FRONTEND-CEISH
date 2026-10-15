import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IEvaluationRepositoryPort, EvaluationAssignment } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({ providedIn: 'root' })
export class LoadEvaluatorWorkloadUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(): Observable<{ activeCount: number; urgentCount: number }> {
    return this.evalRepo.getMyAssignments().pipe(
      map(assignments => ({
        activeCount: assignments.length,
        urgentCount: assignments.filter((a: EvaluationAssignment) => a.isUrgent).length
      }))
    );
  }
}
