import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAmendmentRepositoryPort, ApprovedProtocolOption } from '../domain/ports/amendment-repository.port';

@Injectable({ providedIn: 'root' })
export class LoadApprovedProtocolsUseCase {
  private readonly repository = inject(IAmendmentRepositoryPort);

  execute(): Observable<ApprovedProtocolOption[]> {
    return this.repository.getApprovedProtocols();
  }
}
