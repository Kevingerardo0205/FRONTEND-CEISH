import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';

@Injectable({ providedIn: 'root' })
export class LoadResolutionInsumosUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  execute(protocolId: string): Observable<EvaluationEntity[]> {
    return this.evalRepo.getByProtocolId(protocolId);
  }

  downloadPdf(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.evalRepo.getDocumentDownloadUrl(evaluationId);
  }

  downloadDocx(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.evalRepo.getDocxDownloadUrl(evaluationId);
  }
}
