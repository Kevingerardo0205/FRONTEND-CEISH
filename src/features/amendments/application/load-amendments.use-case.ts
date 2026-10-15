import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAmendmentRepositoryPort } from '../domain/ports/amendment-repository.port';
import { AmendmentItem } from '../domain/entities/amendment.entity';

@Injectable({ providedIn: 'root' })
export class LoadAmendmentsUseCase {
  private readonly repository = inject(IAmendmentRepositoryPort);

  execute(protocolId?: string): Observable<AmendmentItem[]> {
    if (protocolId) {
      return this.repository.getAmendmentsByProtocolId(protocolId);
    }
    return this.repository.getAmendments();
  }
}
