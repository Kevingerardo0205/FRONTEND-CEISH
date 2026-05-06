import { Observable } from 'rxjs';
import { EvaluationEntity } from '../entities/evaluation.entity';

export abstract class IEvaluationRepositoryPort {
  /**
   * Presidenta: Obtiene el dashboard de carga de evaluadores.
   * GET /evaluations/evaluators/dashboard
   */
  abstract getEvaluatorsDashboard(): Observable<any>;

  /**
   * Presidenta: Sugiere evaluadores para un protocolo.
   * POST /evaluations/suggest
   */
  abstract suggestEvaluators(payload: { protocolId: string; evaluatorIds: string[] }): Observable<void>;

  /**
   * Secretaria: Confirma la asignación de un evaluador y fija fecha límite.
   * PATCH /evaluations/confirm-assignment
   */
  abstract confirmAssignment(payload: { evaluationId: string; deadline: string }): Observable<void>;

  /**
   * Evaluador: Obtiene las tareas asignadas al evaluador actual.
   * GET /evaluations/my-assignments
   */
  abstract getMyAssignments(): Observable<any[]>;

  /**
   * Evaluador: Envía el resultado de la evaluación (JSON Anexo 10 + PDF).
   * POST /evaluations/submit
   * @param data FormData conteniendo 'evaluationData' (JSON con assignmentId, annex10, result) y 'report' (archivo PDF)
   */
  abstract submitEvaluation(data: FormData): Observable<void>;

  // Métodos de consulta existentes
  abstract getByProtocolId(protocolId: string): Observable<EvaluationEntity[]>;
  abstract getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]>;
}
