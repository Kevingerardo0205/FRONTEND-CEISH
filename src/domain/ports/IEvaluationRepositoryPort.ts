import { Observable } from 'rxjs';
import { EvaluationEntity } from '../entities/evaluation.entity';
import { PendingPeerAssignmentProtocol, PeerAssignmentEntity, AssignEvaluatorsResponse, RiskLevelInfo } from '../entities/peer-evaluation.entity';

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

export interface ObservationEntry {
  evaluatorName: string;
  section: string;
  observations: string;
  date?: string;
}

export abstract class IEvaluationRepositoryPort {
  abstract getEvaluatorsDashboard(profileId?: string): Observable<EvaluatorsDashboardResponse>;
  abstract getMyAssignments(): Observable<EvaluationAssignment[]>;
  abstract submitEvaluation(payload: SubmitEvaluationPayload): Observable<{ message?: string; assignmentId?: number }>;
  abstract getProfiles(): Observable<EvaluationProfile[]>;
  abstract createProfile(profile: CreateEvaluationProfilePayload): Observable<EvaluationProfile>;
  abstract updateProfile(id: number, profile: Partial<CreateEvaluationProfilePayload>): Observable<EvaluationProfile>;
  abstract deleteProfile(id: number): Observable<void>;
  abstract consolidateEvaluation(protocolId: string): Observable<ConsolidatedEvaluationResponse>;
  abstract getChecklistDetails(evaluationId: string): Observable<ChecklistDetailItem[]>;
  abstract getDocumentDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }>;
  abstract getDocxDownloadUrl(evaluationId: string): Observable<{ downloadUrl: string }>;
  abstract getByProtocolId(protocolId: string): Observable<EvaluationEntity[]>;
  abstract getByEvaluatorId(evaluatorId: string): Observable<EvaluationEntity[]>;
  abstract getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]>;
  abstract assignPeerEvaluators(protocolId: string, evaluatorIds: number[]): Observable<AssignEvaluatorsResponse>;
  abstract getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]>;
  abstract submitPeerRiskProposed(assignmentId: string, payload: { riskLevelId: number; observations: string; reportPath: string }): Observable<void>;
  abstract getActiveEvaluators(): Observable<ActiveEvaluator[]>;
  abstract getProtocolObservations(protocolId: string): Observable<ObservationEntry[]>;
}

export interface ActiveEvaluator {
  id: number;
  nombre: string;
  email: string;
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
