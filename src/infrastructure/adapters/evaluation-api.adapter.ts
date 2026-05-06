import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IEvaluationRepositoryPort } from 'src/domain/ports/IEvaluationRepositoryPort';
import { ApiClientService } from '../api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';
import { EvaluationEntity } from 'src/domain/entities/evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class EvaluationApiAdapter implements IEvaluationRepositoryPort {
  constructor(private apiClient: ApiClientService) {}

  /**
   * Presidenta: Obtiene el dashboard de carga de evaluadores.
   */
  getEvaluatorsDashboard(): Observable<any> {
    return this.apiClient.get(ENDPOINTS.EVALUATIONS.DASHBOARD);
  }

  /**
   * Presidenta: Sugiere evaluadores para un protocolo.
   */
  suggestEvaluators(payload: { protocolId: string; evaluatorIds: string[] }): Observable<void> {
    return this.apiClient.post(ENDPOINTS.EVALUATIONS.SUGGEST, payload);
  }

  /**
   * Secretaria: Confirma la asignación de un evaluador y fija fecha límite.
   */
  confirmAssignment(payload: { evaluationId: string; deadline: string }): Observable<void> {
    return this.apiClient.patch(ENDPOINTS.EVALUATIONS.CONFIRM, payload);
  }

  /**
   * Evaluador: Obtiene las tareas asignadas al evaluador actual.
   */
  getMyAssignments(): Observable<any[]> {
    return this.apiClient.get(ENDPOINTS.EVALUATIONS.MY_ASSIGNMENTS);
  }

  /**
   * Evaluador: Envía el resultado de la evaluación (JSON + PDF).
   */
  submitEvaluation(data: FormData): Observable<void> {
    return this.apiClient.post(ENDPOINTS.EVALUATIONS.SUBMIT, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Obtiene evaluaciones por ID de protocolo.
   */
  getByProtocolId(protocolId: string): Observable<EvaluationEntity[]> {
    return this.apiClient.get(`${ENDPOINTS.EVALUATIONS.SUBMIT}/protocol/${protocolId}`);
  }

  /**
   * Obtiene evaluaciones por ID de evaluador.
   */
  getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]> {
    return this.apiClient.get(`${ENDPOINTS.EVALUATIONS.SUBMIT}/evaluator/${evaluatorId}`);
  }
}
