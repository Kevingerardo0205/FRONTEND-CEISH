import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmAssignmentUseCase {
  private repo = inject(IEvaluationRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(payload: { evaluationId: string; deadline: string }): Observable<void> {
    return this.repo.confirmAssignment(payload).pipe(
      tap(() => {
        this.notificationBroker.publish('ASSIGNMENT_CONFIRMED', {
          evaluationId: payload.evaluationId,
          timestamp: new Date()
        });
      })
    );
  }
}
