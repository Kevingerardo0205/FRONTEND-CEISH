import { Injectable, inject } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class SubmitEvaluationUseCase {
  private repo = inject(IEvaluationRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(payload: any): Observable<void> {
    // Regla: El informe PDF firmado es obligatorio en todos los casos para completar la evaluación
    if (!payload.reportPath || typeof payload.reportPath !== 'string' || payload.reportPath.trim() === '') {
      return throwError(() => new Error('El informe PDF firmado es obligatorio para completar la evaluación.'));
    }

    return this.repo.submitEvaluation(payload).pipe(
      tap(() => {
        // Disparar notificación automática a Secretaría
        this.notificationBroker.publish('EVALUATION_SUBMITTED', {
          timestamp: new Date()
        });
      })
    );
  }
}
