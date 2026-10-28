import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IEvaluationRepositoryPort,
  EvaluatorsDashboardResponse,
  EvaluationAssignment,
  EvaluationProfile,
  ChecklistDetailItem,
  ObservationEntry,
  SubmitEvaluationPayload,
  CreateEvaluationProfilePayload,
  ConsolidatedEvaluationResponse,
  ActiveEvaluator,
} from 'src/domain/ports/IEvaluationRepositoryPort';
import { ApiClientService } from '../api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';
import { EvaluationEntity } from 'src/domain/entities/evaluation.entity';
import {
  PendingPeerAssignmentProtocol,
  PeerAssignmentEntity,
  AssignEvaluatorsResponse,
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse,
  AssignmentHistoryEntry,
  ActiveAssignmentsResult,
} from 'src/domain/entities/peer-evaluation.entity';

type ApiEnvelope<T> = { data: T };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface RawProtocolInfo {
  id?: number;
  ceishCode?: string;
  title?: string;
  reviewType?: string;
  isRiskLevelDesignated?: boolean;
  principalInvestigatorRecord?: { fullName?: string };
}

interface RawAssignmentResponse {
  id?: number | string;
  version?: { protocolId?: number; protocol?: RawProtocolInfo };
  protocol?: RawProtocolInfo;
  protocolId?: number | string;
  protocolCode?: string;
  protocolTitle?: string;
  principalInvestigatorRecord?: { fullName?: string };
  investigator?: string;
  reviewType?: string;
  annexToUse?: string | null;
  isRiskLevelDesignated?: boolean;
  deadline?: string;
  daysRemaining?: number | null;
  isUrgent?: boolean | null;
}

@Injectable({
  providedIn: 'root',
})
export class EvaluationApiAdapter implements IEvaluationRepositoryPort {
  constructor(private apiClient: ApiClientService) {}

  /**
   * Presidenta: Obtiene el dashboard de carga de evaluadores.
   */
  getEvaluatorsDashboard(profileId?: string): Observable<EvaluatorsDashboardResponse> {
    const params: Record<string, string> = {};
    if (profileId) {
      params['profileId'] = profileId;
    }
    return this.apiClient
      .get<ApiEnvelope<EvaluatorsDashboardResponse>>(ENDPOINTS.EVALUATIONS.DASHBOARD, params)
      .pipe(map((res) => res.data || (res as unknown as EvaluatorsDashboardResponse)));
  }

  private normalizeAssignment(a: RawAssignmentResponse): EvaluationAssignment {
    if (!a) return a as unknown as EvaluationAssignment;
    const version = a.version || {};
    const protocol = version.protocol || a.protocol || {};
    const protocolId = version.protocolId || protocol.id || a.protocolId;
    const protocolCode = protocol.ceishCode || a.protocolCode || '';
    const protocolTitle = protocol.title || a.protocolTitle || '';

    const investigatorRecord =
      protocol.principalInvestigatorRecord || a.principalInvestigatorRecord || {};
    const investigatorName =
      investigatorRecord.fullName || a.investigator || 'Investigador Principal';

    const reviewType = protocol.reviewType || a.reviewType || '';

    const rawAnnexToUse = a.annexToUse;
    const isRiskLevelDesignated = protocol.isRiskLevelDesignated ?? a.isRiskLevelDesignated ?? true;
    const isSuspended = !rawAnnexToUse || isRiskLevelDesignated === false;

    let annexToUse = rawAnnexToUse;
    if (!annexToUse) {
      if (reviewType === 'PLENO') annexToUse = 'ANEXO_10';
      else if (reviewType === 'EXPEDITA') annexToUse = 'ANEXO_9';
      else if (reviewType === 'ENSAYO_CLINICO') annexToUse = 'ANEXO_11';
      else annexToUse = 'ANEXO_10';
    }

    const deadlineDate = a.deadline ? new Date(a.deadline) : null;
    let daysRemaining = a.daysRemaining;
    let isUrgent = a.isUrgent;

    if (!deadlineDate) {
      daysRemaining = null;
      isUrgent = false;
    } else if (daysRemaining === undefined || daysRemaining === null) {
      const diffTime = deadlineDate.getTime() - new Date().getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      isUrgent = daysRemaining <= 2;
    }

    return {
      ...a,
      id: a.id?.toString() as unknown as number,
      protocolId: protocolId?.toString() as unknown as number,
      protocolCode,
      protocolTitle,
      investigator: investigatorName,
      annexToUse: annexToUse as string,
      rawAnnexToUse,
      isSuspended,
      reviewType,
      daysRemaining: daysRemaining ?? undefined,
      isUrgent: isUrgent ?? undefined,
    } as unknown as EvaluationAssignment;
  }

  /**
   * Evaluador: Obtiene las tareas asignadas al evaluador actual.
   */
  getMyAssignments(): Observable<EvaluationAssignment[]> {
    return this.apiClient
      .get<ApiEnvelope<RawAssignmentResponse[]>>(ENDPOINTS.EVALUATIONS.MY_ASSIGNMENTS)
      .pipe(
        map((res) => {
          const raw = res.data || (res as unknown as RawAssignmentResponse[]);
          return Array.isArray(raw) ? raw.map((a) => this.normalizeAssignment(a)) : [];
        }),
      );
  }

  /**
   * Evaluador: Envía el resultado de la evaluación.
   */
  submitEvaluation(
    payload: SubmitEvaluationPayload,
  ): Observable<{ message?: string; assignmentId?: number }> {
    return this.apiClient
      .post<ApiEnvelope<{ message?: string; assignmentId?: number }>>(
        ENDPOINTS.EVALUATIONS.SUBMIT,
        payload,
      )
      .pipe(
        map((res) => res.data || (res as unknown as { message?: string; assignmentId?: number })),
      );
  }

  /**
   * Obtener todos los perfiles de evaluadores.
   */
  getProfiles(): Observable<EvaluationProfile[]> {
    return this.apiClient
      .get<ApiEnvelope<EvaluationProfile[]>>(ENDPOINTS.EVALUATIONS.PROFILES)
      .pipe(map((res) => res.data || (res as unknown as EvaluationProfile[])));
  }

  /**
   * Crear un nuevo perfil de evaluador.
   */
  createProfile(profile: CreateEvaluationProfilePayload): Observable<EvaluationProfile> {
    return this.apiClient
      .post<ApiEnvelope<EvaluationProfile>>(ENDPOINTS.EVALUATIONS.PROFILES, profile)
      .pipe(map((res) => res.data || (res as unknown as EvaluationProfile)));
  }

  /**
   * Actualizar un perfil de evaluador.
   */
  updateProfile(
    id: number,
    profile: Partial<CreateEvaluationProfilePayload>,
  ): Observable<EvaluationProfile> {
    return this.apiClient
      .patch<ApiEnvelope<EvaluationProfile>>(ENDPOINTS.EVALUATIONS.PROFILE_BY_ID(id), profile)
      .pipe(map((res) => res.data || (res as unknown as EvaluationProfile)));
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
  consolidateEvaluation(protocolId: string): Observable<ConsolidatedEvaluationResponse> {
    return this.apiClient
      .get<ApiEnvelope<ConsolidatedEvaluationResponse>>(
        ENDPOINTS.EVALUATIONS.CONSOLIDATE(protocolId),
      )
      .pipe(map((res) => res.data || (res as unknown as ConsolidatedEvaluationResponse)));
  }

  getChecklistDetails(evaluationId: string): Observable<ChecklistDetailItem[]> {
    return this.apiClient
      .get<ApiEnvelope<ChecklistDetailItem[]>>(`/evaluations/${evaluationId}/checklist-details`)
      .pipe(map((res) => res.data || (res as unknown as ChecklistDetailItem[])));
  }

  getDocumentDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.apiClient
      .get<ApiEnvelope<{ downloadUrl: string }>>(`/evaluations/${evaluationId}/document`)
      .pipe(map((res) => res.data || (res as unknown as { downloadUrl: string })));
  }

  getDocxDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }> {
    return this.apiClient
      .get<ApiEnvelope<{ downloadUrl: string }>>(`/evaluations/${evaluationId}/document/docx`)
      .pipe(map((res) => res.data || (res as unknown as { downloadUrl: string })));
  }

  /**
   * Obtiene evaluaciones por ID de protocolo.
   */
  getByProtocolId(protocolId: string): Observable<EvaluationEntity[]> {
    return this.apiClient
      .get<ApiEnvelope<EvaluationEntity[]>>(
        `${ENDPOINTS.EVALUATIONS.SUBMIT}/protocol/${protocolId}`,
      )
      .pipe(map((res) => res.data || (res as unknown as EvaluationEntity[])));
  }

  /**
   * Obtiene evaluaciones por ID de evaluador.
   */
  getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]> {
    return this.apiClient
      .get<ApiEnvelope<EvaluationEntity[]>>(
        `${ENDPOINTS.EVALUATIONS.SUBMIT}/evaluator/${evaluatorId}`,
      )
      .pipe(map((res) => res.data || (res as unknown as EvaluationEntity[])));
  }

  // --- IMPLEMENTACIÓN DE ESTRATIFICACIÓN DE RIESGO POR PARES (PET 4.2.1) ---

  getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]> {
    return this.apiClient
      .get<ApiEnvelope<PendingPeerAssignmentProtocol[]>>(
        ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.PENDING_ASSIGNMENT,
      )
      .pipe(map((res) => res.data || (res as unknown as PendingPeerAssignmentProtocol[])));
  }

  assignPeerEvaluators(
    protocolId: string,
    evaluatorIds: number[],
  ): Observable<AssignEvaluatorsResponse> {
    return this.apiClient
      .post<ApiEnvelope<AssignEvaluatorsResponse>>(
        ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ASSIGN_PEERS(protocolId),
        { evaluatorIds },
      )
      .pipe(map((res) => res.data || (res as unknown as AssignEvaluatorsResponse)));
  }

  getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]> {
    return this.apiClient
      .get<ApiEnvelope<PeerAssignmentEntity[]>>(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.MY_PENDING)
      .pipe(map((res) => res.data || (res as unknown as PeerAssignmentEntity[])));
  }

  submitPeerRiskProposed(
    assignmentId: string,
    payload: { riskLevelId: number; observations: string; reportPath: string },
  ): Observable<void> {
    return this.apiClient.post<void>(
      ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.SUBMIT_RISK(assignmentId),
      payload,
    );
  }

  getActiveEvaluators(): Observable<ActiveEvaluator[]> {
    return this.apiClient
      .get<ApiEnvelope<ActiveEvaluator[]>>(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ACTIVE_EVALUATORS)
      .pipe(
        map((res) => {
          const raw = res?.data || (res as unknown as ActiveEvaluator[]);
          return Array.isArray(raw) ? raw : [];
        }),
      );
  }

  getProtocolObservations(protocolId: string): Observable<ObservationEntry[]> {
    return this.apiClient
      .get<ApiEnvelope<ObservationEntry[]>>(
        `${ENDPOINTS.EVALUATIONS.BASE}/protocol/${protocolId}/observations`,
      )
      .pipe(map((res) => res.data || (res as unknown as ObservationEntry[])));
  }

  /**
   * RF-12.3: Reasignar evaluador de pares por vencimiento o conflicto de interés.
   */
  reassignPeerEvaluator(
    payload: ReassignPeerEvaluatorPayload,
  ): Observable<ReassignPeerEvaluatorResponse> {
    const body = {
      currentAssignmentId: payload.outgoingAssignmentId,
      replacementEvaluatorId: payload.replacementEvaluatorId,
      replacementEvaluatorProfile: payload.replacementEvaluatorProfile,
      reason: payload.reason,
      reasonDescription: payload.reasonDescription,
    };
    // Un 2xx significa que la reasignación ya se ejecutó: la forma interna de la respuesta
    // no está verificada, así que no se valida para no convertir una escritura exitosa en error.
    return this.apiClient
      .post<Partial<ApiEnvelope<ReassignPeerEvaluatorResponse>>>(
        ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.REASSIGN,
        body,
      )
      .pipe(map((res) => (isRecord(res?.data) ? res.data : {}) as ReassignPeerEvaluatorResponse));
  }

  /**
   * RF-12.3: Asignaciones activas del protocolo (capa única {data, statusCode, message}).
   */
  getActiveAssignments(protocolId: number): Observable<ActiveAssignmentsResult> {
    return this.apiClient
      .get<Partial<ApiEnvelope<unknown>>>(
        ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ACTIVE_ASSIGNMENTS(protocolId),
      )
      .pipe(
        map((res) => {
          const data = res?.data;
          if (!isRecord(data) || !Array.isArray(data['assignments'])) {
            throw new Error(
              'Respuesta inesperada del servidor al consultar asignaciones activas: falta data.assignments.',
            );
          }
          return data as unknown as ActiveAssignmentsResult;
        }),
      );
  }

  /**
   * RF-12.3: Obtener historial inmutable de reasignaciones de evaluadores.
   */
  getAssignmentHistory(protocolId: number): Observable<AssignmentHistoryEntry[]> {
    return this.apiClient
      .get<ApiEnvelope<AssignmentHistoryEntry[]>>(
        ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.HISTORY(String(protocolId)),
      )
      .pipe(
        map((res) => {
          const raw = res?.data || (res as unknown as AssignmentHistoryEntry[]);
          return Array.isArray(raw) ? raw : [];
        }),
      );
  }
}
