import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({ providedIn: 'root' })
export class DownloadEvaluationDocumentUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);

  downloadPdf(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.evalRepo.getDocumentDownloadUrl(evaluationId);
  }

  downloadDocx(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.evalRepo.getDocxDownloadUrl(evaluationId);
  }
}
