import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';

@Injectable({ providedIn: 'root' })
export class LoadPendingPeerAssignmentProtocolsUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(): Observable<PendingPeerAssignmentProtocol[]> {
    return this.evalRepo.getPendingPeerAssignmentProtocols();
  }
}
