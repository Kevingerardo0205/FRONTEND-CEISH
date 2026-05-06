import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class SubmitEvaluationUseCase {
  private repo = inject(IEvaluationRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(evaluation: Partial<EvaluationEntity>): Observable<EvaluationEntity> {
    return this.repo.submit(evaluation).pipe(
      tap(() => {
        // Disparar notificación automática a Secretaría
        this.notificationBroker.publish('EVALUATION_SUBMITTED', {
          protocolId: evaluation.protocolId,
          verdict: evaluation.verdict,
          timestamp: new Date()
        });
      })
    );
  }
}
