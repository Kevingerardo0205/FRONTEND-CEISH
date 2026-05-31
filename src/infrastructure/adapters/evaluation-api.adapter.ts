import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IEvaluationRepositoryPort } from 'src/domain/ports/IEvaluationRepositoryPort';
import { ApiClientService } from '../api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';
import { EvaluationEntity } from 'src/domain/entities/evaluation.entity';
import { PendingPeerAssignmentProtocol, PeerAssignmentEntity } from 'src/domain/entities/peer-evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class EvaluationApiAdapter implements IEvaluationRepositoryPort {
  constructor(private apiClient: ApiClientService) {}

  /**
   * Presidenta: Obtiene el dashboard de carga de evaluadores.
   */
  getEvaluatorsDashboard(profileId?: string): Observable<any> {
    const params: any = {};
    if (profileId) {
      params.profileId = profileId;
    }
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.DASHBOARD, params).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Presidenta: Sugiere evaluadores para un protocolo.
   */
  suggestEvaluators(payload: { protocolId: string; evaluatorIds: string[] }): Observable<void> {
    return this.apiClient.post(ENDPOINTS.EVALUATIONS.SUGGEST, payload);
  }

  /**
   * Secretaria: Obtiene las sugerencias de evaluadores pendientes de confirmación.
   */
  getPendingSuggestions(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PENDING_SUGGESTIONS).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Secretaria: Confirma la asignación de un evaluador y fija fecha límite.
   */
  confirmAssignment(payload: { evaluationId: string; deadline: string }): Observable<void> {
    return this.apiClient.patch(ENDPOINTS.EVALUATIONS.CONFIRM, payload);
  }

  /**
   * Secretaria: Rechaza una sugerencia previa de la presidencia.
   */
  rejectSuggestion(id: string): Observable<void> {
    return this.apiClient.delete(ENDPOINTS.EVALUATIONS.REJECT_SUGGESTION(id));
  }

  /**
   * Evaluador: Obtiene las tareas asignadas al evaluador actual.
   */
  getMyAssignments(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.MY_ASSIGNMENTS).pipe(
      map(res => res.data || res)
    );
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
   * Obtener todos los perfiles de evaluadores.
   */
  getProfiles(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PROFILES).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Crear un nuevo perfil de evaluador.
   */
  createProfile(profile: any): Observable<any> {
    return this.apiClient.post<any>(ENDPOINTS.EVALUATIONS.PROFILES, profile).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Actualizar un perfil de evaluador.
   */
  updateProfile(id: number, profile: any): Observable<any> {
    return this.apiClient.patch<any>(ENDPOINTS.EVALUATIONS.PROFILE_BY_ID(id), profile).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Eliminar un perfil de evaluador.
   */
  deleteProfile(id: number): Observable<void> {
    return this.apiClient.delete(ENDPOINTS.EVALUATIONS.PROFILE_BY_ID(id));
  }

  /**
   * Obtiene la consolidación de evaluaciones para un protocolo (Anexo 12).
   */
  consolidateEvaluation(protocolId: string): Observable<any> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.CONSOLIDATE(protocolId)).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Obtiene evaluaciones por ID de protocolo.
   */
  getByProtocolId(protocolId: string): Observable<EvaluationEntity[]> {
    return this.apiClient.get<any>(`${ENDPOINTS.EVALUATIONS.SUBMIT}/protocol/${protocolId}`).pipe(
      map(res => res.data || res)
    );
  }

  /**
   * Obtiene evaluaciones por ID de evaluador.
   */
  getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]> {
    return this.apiClient.get<any>(`${ENDPOINTS.EVALUATIONS.SUBMIT}/evaluator/${evaluatorId}`).pipe(
      map(res => res.data || res)
    );
  }

  // --- IMPLEMENTACIÓN DE ESTRATIFICACIÓN DE RIESGO POR PARES (PET 4.2.1) ---

  getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.PENDING_ASSIGNMENT).pipe(
      map(res => res.data || res)
    );
  }

  assignPeerEvaluators(protocolId: string, evaluatorIds: number[]): Observable<void> {
    return this.apiClient.post<void>(
      ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ASSIGN_PEERS(protocolId),
      { evaluatorIds }
    );
  }

  getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.MY_PENDING).pipe(
      map(res => res.data || res)
    );
  }

  submitPeerRiskProposed(assignmentId: string, payload: { riskLevelId: number; observations: string }): Observable<void> {
    return this.apiClient.post<void>(
      ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.SUBMIT_RISK(assignmentId),
      payload
    );
  }

  getActiveEvaluators(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ACTIVE_EVALUATORS).pipe(
      map(res => {
        const raw = res?.data || res;
        return Array.isArray(raw) ? raw : [];
      })
    );
  }
}
