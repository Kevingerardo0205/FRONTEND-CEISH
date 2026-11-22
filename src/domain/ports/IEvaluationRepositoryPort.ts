import { Observable } from 'rxjs';
import { EvaluationEntity } from '../entities/evaluation.entity';
import {
  PendingPeerAssignmentProtocol,
  PeerAssignmentEntity,
  AssignEvaluatorsResponse,
  RiskLevelInfo,
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse,
  AssignmentHistoryEntry,
  ActiveAssignmentsResult,
  AssignPeerEvaluatorsPayload,
} from '../entities/peer-evaluation.entity';

export interface EvaluatorsDashboardResponse {
  evaluators: EvaluatorsDashboardEntry[];
  totalEvaluators?: number;
}

export interface EvaluatorsDashboardEntry {
  evaluatorId: number;
  nombre: string;
  email: string;
  fullName?: string;
  perfil?: string;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
}

export interface EvaluationAssignment {
  id?: number | string;
  assignmentId: number;
  protocolId: number;
  protocolCode?: string;
  protocolTitle?: string;
  investigator?: string;
  deadline?: string;
  daysRemaining?: number;
  isUrgent?: boolean;
  reviewType?: string;
  annexToUse?: string;
  isAnnex9Unlocked?: boolean;
  isSuspended?: boolean;
}

export interface EvaluationProfile {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface ChecklistDetailItem {
  itemCodigo: string;
  estado: string;
  observaciones: string | null;
}

/**
 * F11 V14 (EP4): lo que ve el investigador de cada par en Subsanaciones. Solo perfil, dictamen
 * (`EvaluatorDictamen` o `null`), observaciones generales y detalle del checklist: sin nombres, ids,
 * correos ni rutas de los informes individuales.
 */
export interface ObservationEntry {
  evaluatorProfile: string;
  result: number | null;
  generalObservations: string | null;
  checklistDetails: readonly Readonly<Record<string, unknown>>[];
}

export abstract class IEvaluationRepositoryPort {
  abstract getEvaluatorsDashboard(profileId?: string): Observable<EvaluatorsDashboardResponse>;
  abstract getMyAssignments(): Observable<EvaluationAssignment[]>;
  abstract submitEvaluation(
    payload: SubmitEvaluationPayload,
  ): Observable<{ message?: string; assignmentId?: number }>;
  abstract getProfiles(): Observable<EvaluationProfile[]>;
  abstract createProfile(profile: CreateEvaluationProfilePayload): Observable<EvaluationProfile>;
  abstract updateProfile(
    id: number,
    profile: Partial<CreateEvaluationProfilePayload>,
  ): Observable<EvaluationProfile>;
  abstract deleteProfile(id: number): Observable<void>;
  abstract consolidateEvaluation(protocolId: string): Observable<ConsolidatedEvaluationResponse>;
  abstract getChecklistDetails(evaluationId: string): Observable<ChecklistDetailItem[]>;
  abstract getDocumentDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }>;
  abstract getDocxDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }>;
  abstract getByProtocolId(protocolId: string): Observable<EvaluationEntity[]>;
  abstract getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]>;
  abstract getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]>;
  /** N52 (F03 D6): `{ reviewType, evaluators: [{ evaluatorId, profile }] }`. */
  abstract assignPeerEvaluators(
    protocolId: string,
    payload: AssignPeerEvaluatorsPayload,
  ): Observable<AssignEvaluatorsResponse>;
  abstract getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]>;
  abstract submitPeerRiskProposed(
    assignmentId: string,
    payload: { riskLevelId: number; observations: string; reportPath: string },
  ): Observable<void>;
  abstract getActiveEvaluators(): Observable<ActiveEvaluator[]>;
  abstract getProtocolObservations(protocolId: string): Observable<ObservationEntry[]>;
  abstract reassignPeerEvaluator(
    payload: ReassignPeerEvaluatorPayload,
  ): Observable<ReassignPeerEvaluatorResponse>;
  abstract getAssignmentHistory(protocolId: number): Observable<AssignmentHistoryEntry[]>;
  abstract getActiveAssignments(protocolId: number): Observable<ActiveAssignmentsResult>;
}

/** Una persona de GET /evaluations/evaluators/active (activa, con rol EVALUADOR; sin perfiles, N54). */
export interface ActiveEvaluator {
  id: number;
  fullName: string;
}

export interface ConsolidatedEvaluationResponse {
  data?: ConsolidatedEvaluation;
  evaluations?: unknown[];
  isUnanimous?: boolean;
}

export interface ConsolidatedEvaluation {
  protocolId: string;
  evaluations: EvaluationEntity[];
  isUnanimous?: boolean;
  summary?: string;
}

export interface SubmitEvaluationPayload {
  assignmentId: number;
  result: number;
  observations?: string;
  reportPath?: string;
  isDraft?: boolean;
  annex9?: Record<string, unknown>;
  annex10?: Record<string, unknown>;
  annex11?: Record<string, unknown>;
}

export interface CreateEvaluationProfilePayload {
  name: string;
  description?: string;
}
