import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse
} from '@domain/entities/peer-evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class ReassignPeerEvaluatorUseCase {
  private readonly evalRepo = inject(IEvaluationRepositoryPort);

  execute(payload: ReassignPeerEvaluatorPayload): Observable<ReassignPeerEvaluatorResponse> {
    const validReasons: Array<'VENCIMIENTO' | 'CONFLICTO_INTERES'> = ['VENCIMIENTO', 'CONFLICTO_INTERES'];
    if (!payload.reason || !validReasons.includes(payload.reason)) {
      return throwError(
        () =>
          new Error(
            'Motivo de reasignación inválido. Debe ser VENCIMIENTO o CONFLICTO_INTERES.'
          )
      );
    }

    // Validación de interfaz: el mínimo de 10 caracteres no está verificado como regla del backend.
    if (!payload.reasonDescription || payload.reasonDescription.trim().length < 10) {
      return throwError(
        () =>
          new Error(
            'La justificación o descripción del motivo de reasignación es requerida (mínimo 10 caracteres).'
          )
      );
    }

    return this.evalRepo.reassignPeerEvaluator(payload);
  }
}
