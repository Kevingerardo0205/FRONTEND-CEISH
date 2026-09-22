import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Injectable({ providedIn: 'root' })
export class GetProtocolDocumentHistoryUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(protocolId: string): Observable<any[]> {
    return this.repo.getDocumentHistory(protocolId);
  }
}
