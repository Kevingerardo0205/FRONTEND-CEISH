import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ActiveAssignmentsResult } from '@domain/entities/peer-evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class LoadActiveAssignmentsUseCase {
  private readonly evalRepo = inject(IEvaluationRepositoryPort);

  execute(protocolId: number): Observable<ActiveAssignmentsResult> {
    if (!Number.isSafeInteger(protocolId) || protocolId <= 0) {
      return throwError(
        () =>
          new Error(
            'El ID del protocolo debe ser un número entero positivo para consultar las asignaciones activas.'
          )
      );
    }

    return this.evalRepo.getActiveAssignments(protocolId);
  }
}
