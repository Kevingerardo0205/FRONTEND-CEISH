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

  execute(payload: any): Observable<any> {
    // Regla: El informe PDF firmado es obligatorio para completar (finalizar) la evaluación (cuando isDraft es false o no enviado)
    if (!payload.isDraft) {
      if (!payload.reportPath || typeof payload.reportPath !== 'string' || payload.reportPath.trim() === '') {
        return throwError(() => new Error('El informe PDF firmado es obligatorio para completar la evaluación.'));
      }
    }
    // TAREA 4: Validar que assignmentId sea un número válido antes de enviarlo al backend
    if (!payload.assignmentId || isNaN(Number(payload.assignmentId))) {
      return throwError(() => new Error('El ID de asignación no es válido. Por favor, recargue la página e intente nuevamente.'));
    }

    return this.repo.submitEvaluation(payload).pipe(
      tap(() => {
        // Disparar notificación automática a Secretaría solo al finalizar
        if (!payload.isDraft) {
          this.notificationBroker.publish('EVALUATION_SUBMITTED', {
            timestamp: new Date()
          });
        }
      })
    );
  }
}
