import { inject, Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { IEvaluatorRepositoryPort } from '@domain/ports/IEvaluatorRepositoryPort';
import { EvaluatorEntity } from '@domain/entities/evaluator.entity';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorMockAdapter extends IEvaluatorRepositoryPort {
  private notificationBroker = inject(NotificationBrokerService);
  
  getEvaluatorsWithLoad(): Observable<EvaluatorEntity[]> {
    const mockEvaluators: EvaluatorEntity[] = [
      { id: '1', nombre: 'Dr. Marco Vinicio', email: 'marco@espoch.edu.ec', perfil: 'SALUD', cargaActiva: 2 },
      { id: '2', nombre: 'Dra. Elena Naranjo', email: 'elena@espoch.edu.ec', perfil: 'METODOLOGIA', cargaActiva: 5 },
      { id: '3', nombre: 'Abg. Carlos Mendez', email: 'carlos@espoch.edu.ec', perfil: 'JURIDICO', cargaActiva: 1 },
      { id: '4', nombre: 'Lcda. Ana Soto', email: 'ana@espoch.edu.ec', perfil: 'SOCIEDAD_CIVIL', cargaActiva: 3 },
      { id: '5', nombre: 'Dr. Juan Perez', email: 'juan@espoch.edu.ec', perfil: 'SALUD', cargaActiva: 0 }
    ];
    return of(mockEvaluators).pipe(delay(500));
  }

  suggestEvaluators(protocolId: string, evaluatorIds: string[]): Observable<void> {
    console.log(`Presidenta sugirió evaluadores ${evaluatorIds} para protocolo ${protocolId}`);
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        this.notificationBroker.publish('ASSIGNMENT_SUGGESTED', {
          protocolId,
          evaluatorIds,
          message: 'La Presidenta ha enviado una sugerencia de evaluadores.'
        });
      })
    );
  }

  confirmAssignment(protocolId: string, evaluatorIds: string[], deadlineDays: number): Observable<void> {
    console.log(`Secretaria confirmó asignación para protocolo ${protocolId} con plazo de ${deadlineDays} días`);
    return of(undefined).pipe(
      delay(1000),
      tap(() => {
        evaluatorIds.forEach(id => {
          this.notificationBroker.publish('EVALUATOR_ASSIGNED', {
            evaluatorId: id,
            protocolId,
            deadline: deadlineDays,
            message: `Se le ha asignado un nuevo protocolo para evaluación. Plazo: ${deadlineDays} días.`
          });
        });
      })
    );
  }

  getProtocolsForAssignment(): Observable<any[]> {
    const mockProtocols = [
      { 
        id: 'p1', 
        code: '2026-IO-001', 
        title: 'Estudio de prevalencia de diabetes', 
        type: 'IO', 
        status: 'VALIDATED',
        suggestedEvaluators: [] 
      },
      { 
        id: 'p2', 
        code: '2026-EC-002', 
        title: 'Ensayo clínico Vacuna X', 
        type: 'EC', 
        status: 'VALIDATED',
        suggestedEvaluators: ['1', '2'] // Ya sugeridos por Presidenta
      }
    ];
    return of(mockProtocols).pipe(delay(500));
  }
}
