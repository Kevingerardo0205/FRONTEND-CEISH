import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';

@Injectable({ providedIn: 'root' })
export class DownloadTemplateUseCase {
  private docRepo = inject(IDocumentRepositoryPort);

  execute(code: string): Observable<{ downloadUrl: string } | any> {
    return this.docRepo.downloadTemplate(code);
  }
}
