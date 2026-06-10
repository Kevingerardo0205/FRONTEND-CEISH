import { Observable } from 'rxjs';
import { EvaluationEntity } from '../entities/evaluation.entity';
import { PendingPeerAssignmentProtocol, PeerAssignmentEntity, AssignEvaluatorsResponse } from '../entities/peer-evaluation.entity';

export abstract class IEvaluationRepositoryPort {
  /**
   * Presidenta: Obtiene el dashboard de carga de evaluadores.
   * GET /evaluations/evaluators/dashboard
   */
  abstract getEvaluatorsDashboard(profileId?: string): Observable<any>;



  /**
   * Evaluador: Obtiene las tareas asignadas al evaluador actual.
   * GET /evaluations/my-assignments
   */
  abstract getMyAssignments(): Observable<any[]>;

  /**
   * Evaluador: Envía el resultado de la evaluación.
   * POST /evaluations/submit
   * @param payload JSON con assignmentId, annex10, result, reportPath, etc.
   */
  abstract submitEvaluation(payload: any): Observable<void>;

  /**
   * Obtener todos los perfiles de evaluadores.
   * GET /evaluations/profiles
   */
  abstract getProfiles(): Observable<any[]>;

  /**
   * Crear un nuevo perfil de evaluador.
   * POST /evaluations/profiles
   */
  abstract createProfile(profile: any): Observable<any>;

  /**
   * Actualizar un perfil de evaluador.
   * PATCH /evaluations/profiles/{id}
   */
  abstract updateProfile(id: number, profile: any): Observable<any>;

  /**
   * Eliminar un perfil de evaluador.
   * DELETE /evaluations/profiles/{id}
   */
  abstract deleteProfile(id: number): Observable<void>;

  /**
   * Obtiene la consolidación de evaluaciones para un protocolo (Anexo 12).
   * GET /evaluations/consolidate/{id}
   */
  abstract consolidateEvaluation(protocolId: string): Observable<any>;

  // Métodos de consulta existentes
  abstract getByProtocolId(protocolId: string): Observable<EvaluationEntity[]>;
  abstract getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]>;

  // --- NUEVOS MÉTODOS PARA ESTRATIFICACIÓN DE RIESGO POR PARES (PET 4.2.1) ---
  
  /**
   * Secretaria: Listar protocolos pendientes de pares evaluadores.
   * GET /api/evaluations/protocols/pending-peer-assignment
   */
  abstract getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]>;

  /**
   * Secretaria: Asignar exactamente 2 pares evaluadores distintos a un protocolo.
   * POST /api/evaluations/protocols/:id/assign-peer-evaluators
   */
  abstract assignPeerEvaluators(protocolId: string, evaluatorIds: number[]): Observable<AssignEvaluatorsResponse>;

  /**
   * Evaluador: Listar mis evaluaciones de riesgo pendientes.
   * GET /api/evaluations/peer-assignments/my-pending
   */
  abstract getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]>;

  abstract submitPeerRiskProposed(assignmentId: string, payload: { riskLevelId: number; observations: string; reportPath: string }): Observable<void>;

  /**
   * General: Obtener lista ligera de evaluadores activos del sistema (Evita Error 403)
   * GET /api/evaluations/evaluators/active
   */
  abstract getActiveEvaluators(): Observable<any[]>;
}


