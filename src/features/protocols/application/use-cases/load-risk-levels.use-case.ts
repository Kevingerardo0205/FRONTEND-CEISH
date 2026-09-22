import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

@Injectable({ providedIn: 'root' })
export class LoadRiskLevelsUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(): Observable<any[]> {
    return this.repo.getRiskLevels();
  }
}
