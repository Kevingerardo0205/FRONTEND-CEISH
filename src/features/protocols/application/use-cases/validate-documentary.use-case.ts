import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class ValidateDocumentaryUseCase {
  private repository = inject(IProtocolRepositoryPort);

  execute(protocolId: string): Observable<any> {
    return this.repository.finalizeValidation(protocolId);
  }
}
