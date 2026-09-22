import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ICallRepositoryPort, MinutesSignedResult } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';

@Injectable({
  providedIn: 'root',
})
export class SignCallMinutesUseCase {
  private readonly repository = inject<ICallRepositoryPort>(CALL_REPOSITORY_TOKEN);

  execute(minutesId: number): Observable<MinutesSignedResult> {
    return this.repository.signMinutes(minutesId);
  }
}
