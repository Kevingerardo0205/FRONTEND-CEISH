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

  execute(formData: FormData): Observable<void> {
    // Validar sustento en PDF (ReportPath)
    try {
      const evaluationDataRaw = formData.get('evaluationData') as string;
      const evaluationData = JSON.parse(evaluationDataRaw);
      const result = evaluationData.result;
      const reportFile = formData.get('report');

      // Regla: Bloqueo de Envío si no es APROBADO y no hay PDF
      if (result !== 'APROBADO' && !reportFile) {
        return throwError(() => new Error('El sustento en PDF es obligatorio si el resultado no es APROBADO.'));
      }
    } catch (e) {
      return throwError(() => new Error('Error al procesar los datos de evaluación.'));
    }

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
