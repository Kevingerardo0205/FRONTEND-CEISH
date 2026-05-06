import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class SubmitEvaluationUseCase {
  private repo = inject(IEvaluationRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(formData: FormData): Observable<void> {
    return this.repo.submitEvaluation(formData).pipe(
      tap(() => {
        // Disparar notificación automática a Secretaría
        this.notificationBroker.publish('EVALUATION_SUBMITTED', {
          timestamp: new Date()
        });
      })
    );
  }
}
