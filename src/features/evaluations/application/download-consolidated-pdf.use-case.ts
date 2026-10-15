import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';

@Injectable({ providedIn: 'root' })
export class DownloadConsolidatedPdfUseCase {
  private resolutionRepo = inject(IResolutionRepositoryPort);

  execute(protocolId: string): Observable<ResolutionEntity | null> {
    return this.resolutionRepo.getResolutionByProtocolId(protocolId);
  }
}
