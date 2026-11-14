import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { AssignmentHistoryEntry } from '@domain/entities/peer-evaluation.entity';

@Injectable({
  providedIn: 'root',
})
export class LoadAssignmentHistoryUseCase {
  private readonly evalRepo = inject(IEvaluationRepositoryPort);

  execute(protocolId: number): Observable<AssignmentHistoryEntry[]> {
    if (!Number.isSafeInteger(protocolId) || protocolId <= 0) {
      return throwError(
        () =>
          new Error(
            'El ID del protocolo es requerido para consultar el historial de reasignaciones (entero positivo).',
          ),
      );
    }

    return this.evalRepo.getAssignmentHistory(protocolId);
  }
}
