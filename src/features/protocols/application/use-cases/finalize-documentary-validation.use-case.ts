import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ValidateDocumentaryUseCase } from './validate-documentary.use-case';

@Injectable({ providedIn: 'root' })
export class FinalizeDocumentaryValidationUseCase {
  private repo = inject(IProtocolRepositoryPort);
  private validateDocumentary = inject(ValidateDocumentaryUseCase);

  execute(
    protocolId: string,
    isComplete: boolean,
    missingItemsList: string,
  ): Observable<{ message?: string; ceishCode?: string; code?: string }> {
    return this.repo
      .verifyProtocol(protocolId, isComplete, missingItemsList)
      .pipe(switchMap(() => this.validateDocumentary.execute(protocolId)));
  }
}
