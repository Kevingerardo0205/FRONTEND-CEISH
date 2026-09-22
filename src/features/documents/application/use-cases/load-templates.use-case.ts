import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';

@Injectable({ providedIn: 'root' })
export class LoadTemplatesUseCase {
  private docRepo = inject(IDocumentRepositoryPort);

  execute(): Observable<any[]> {
    return this.docRepo.getTemplates();
  }
}
