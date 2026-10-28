import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IEvaluationRepositoryPort,
  EvaluationProfile,
} from '@domain/ports/IEvaluationRepositoryPort';

@Injectable({
  providedIn: 'root',
})
export class GetEvaluationProfilesUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(): Observable<EvaluationProfile[]> {
    return this.repo.getProfiles();
  }
}
