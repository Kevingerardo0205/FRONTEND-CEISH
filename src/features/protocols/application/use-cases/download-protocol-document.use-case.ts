import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Injectable({ providedIn: 'root' })
export class DownloadProtocolDocumentUseCase {
  private repo = inject(IProtocolRepositoryPort);

  executeCertificate(protocolId: string): Observable<Blob> {
    return this.repo.getCertificate(protocolId);
  }
}
