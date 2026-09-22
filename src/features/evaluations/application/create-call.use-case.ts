import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ICallRepositoryPort, CreateCallCommand } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';
import { CallEntity } from 'src/domain/evaluations/call.entity';

@Injectable({
  providedIn: 'root',
})
export class CreateCallUseCase {
  private readonly repository = inject<ICallRepositoryPort>(CALL_REPOSITORY_TOKEN);

  execute(command: CreateCallCommand): Observable<CallEntity> {
    return this.repository.createCall(command);
  }
}
