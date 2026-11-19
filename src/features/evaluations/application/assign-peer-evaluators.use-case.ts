import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  AssignEvaluatorsResponse,
  AssignPeerEvaluatorsPayload,
} from '@domain/entities/peer-evaluation.entity';

/** Envío de la asignación de la Presidenta (F03 D6, N52). */
@Injectable({ providedIn: 'root' })
export class AssignPeerEvaluatorsUseCase {
  private readonly repo = inject(IEvaluationRepositoryPort);

  execute(
    protocolId: number,
    payload: AssignPeerEvaluatorsPayload,
  ): Observable<AssignEvaluatorsResponse> {
    return this.repo.assignPeerEvaluators(String(protocolId), payload);
  }
}
