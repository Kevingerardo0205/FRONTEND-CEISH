import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PeerAssignmentEntity } from '@domain/entities/peer-evaluation.entity';

@Injectable({ providedIn: 'root' })
export class LoadPendingPeerAssignmentsUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(): Observable<PeerAssignmentEntity[]> {
    return this.evalRepo.getMyPendingPeerAssignments();
  }
}
