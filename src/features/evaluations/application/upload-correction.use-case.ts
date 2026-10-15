import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { IProtocolRepositoryPort, ProtocolDocumentHistoryEntry } from '@domain/ports/IProtocolRepositoryPort';

@Injectable({ providedIn: 'root' })
export class UploadCorrectionUseCase {
  private protocoloService = inject(ProtocoloService);
  private protocolRepo = inject(IProtocolRepositoryPort);

  execute(params: {
    file: File;
    protocolId: number;
    requirementId: number;
    requirementCode?: string;
    versionNumber?: number;
  }): Observable<ProtocolDocumentHistoryEntry[]> {
    return this.protocoloService.subirDocumento(
      params.file,
      params.protocolId,
      params.requirementId,
      params.requirementCode,
      params.versionNumber || 1
    ).pipe(
      switchMap(() => this.protocolRepo.getDocumentHistory(String(params.protocolId)))
    );
  }
}
