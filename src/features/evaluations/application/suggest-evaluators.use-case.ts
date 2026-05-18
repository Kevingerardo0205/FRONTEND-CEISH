import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ProtocolType } from '@domain/enums/protocol-type.enum';

@Injectable({
  providedIn: 'root'
})
export class SuggestEvaluatorsUseCase {
  private repo = inject(IEvaluationRepositoryPort);

  execute(protocolId: string, evaluators: { id: string, profile: string }[], protocolType: ProtocolType): Observable<void> {
    const isExpedita = protocolType === ProtocolType.IO;
    const count = evaluators.length;

    // Regla: EXPEDITA -> exactamente 2 evaluadores
    if (isExpedita && count !== 2) {
      return throwError(() => new Error('Las revisiones expeditas requieren exactamente 2 evaluadores.'));
    }

    // Regla: PLENO -> exactamente 5 evaluadores de perfiles distintos (PET 5.1)
    if (!isExpedita) {
      if (count !== 5) {
        return throwError(() => new Error('Las revisiones de pleno requieren exactamente 5 evaluadores.'));
      }
      
      const uniqueProfiles = new Set(evaluators.map(e => e.profile));
      if (uniqueProfiles.size !== 5) {
        return throwError(() => new Error('Las revisiones de pleno requieren evaluadores con 5 perfiles distintos (Normativa PET 5.1).'));
      }
    }

    return this.repo.suggestEvaluators({ 
      protocolId, 
      evaluatorIds: evaluators.map(e => e.id) 
    });
  }
}
