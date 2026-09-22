import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ValidationDetailResponse } from '@domain/entities/protocol.entity';

@Injectable({ providedIn: 'root' })
export class LoadValidationDetailUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(protocolId: string): Observable<ValidationDetailResponse> {
    return this.repo.getValidationDetail(protocolId).pipe(
      map(data => ({
        ...data,
        checklist: (data.checklist || []).map(item => {
          if (item.attachedDocument) {
            if (item.attachedDocument.pageCount === null || item.attachedDocument.pageCount === undefined) {
              item.attachedDocument.pageCount = item.attachedDocument.originalPageCount || 1;
            }
          }
          return item;
        })
      }))
    );
  }
}
