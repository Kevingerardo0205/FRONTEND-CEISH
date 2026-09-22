import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ICallRepositoryPort, ProtocolPendingForCall } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';

@Injectable({
  providedIn: 'root',
})
export class LoadPendingProtocolsForCallUseCase {
  private readonly repository = inject<ICallRepositoryPort>(CALL_REPOSITORY_TOKEN);

  execute(): Observable<ProtocolPendingForCall[]> {
    return this.repository.getPendingProtocols();
  }
}
