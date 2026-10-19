

export interface PendingPeerAssignmentProtocol {
  id: number;
  ceishCode: string;
  title: string;
  receptionStatus: string;
  isRiskLevelDesignated: boolean;
  createdAt: string;
  studyType: {
    id: number;
    codigo: string;
    nombre: string;
  };
  principalInvestigatorRecord: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface PeerAssignmentEntity {
  id: number;
  protocolId: number;
  evaluatorId: number;
  proposedRiskLevelId: number | null;
  observations: string | null;
  assignedAt: string;
  submittedAt: string | null;
  protocol: {
    id: number;
    ceishCode: string;
    title: string;
    studyType: {
      nombre: string;
    };
    principalInvestigatorRecord: {
      fullName: string;
    };
  };
}

export interface AssignEvaluatorsResponse {
  message: string;
  totalEvaluators: number;
  riskEvaluators: number[];
  allEvaluators: number[];
  versionId?: number;
  evaluationAssignmentIds?: number[];
  deadline: string;
}

export interface RiskLevelInfo {
  id: number;
  name: string;
  description: string;
}

export const PET_RISK_LEVELS: RiskLevelInfo[] = [
  { 
    id: 4, 
    name: 'Sin Riesgo', 
    description: 'No realiza ninguna intervención biológica, psicológica o social. Datos anonimizados, fuentes abiertas.' 
  },
  { 
    id: 5, 
    name: 'Riesgo Mínimo', 
    description: 'Riesgos equivalentes a la vida diaria o práctica médica de rutina (ej: revisión de historias clínicas anonimizadas).' 
  },
  { 
    id: 6, 
    name: 'Riesgo Moderado', 
    description: 'Exposición a mediciones o intervenciones controladas de bajo impacto.' 
  },
  { 
    id: 7, 
    name: 'Riesgo Mayor', 
    description: 'Probabilidades significativas de daño físico, psicológico o social prolongado. Uso de datos personales sensibles (PII).' 
  },
  { 
    id: 8, 
    name: 'Ensayo Clínico', 
    description: 'Pruebas de medicamentos, vacunas, o dispositivos con intervención clínica directa.' 
  }
];

/** Perfiles estrictos que acepta el backend en la reasignación (RF-12.3). */
export const PEER_EVALUATOR_PROFILES = ['JURIDICO', 'SOCIEDAD_CIVIL', 'METODOLOGICO', 'SALUD'] as const;
export type PeerEvaluatorProfile = (typeof PEER_EVALUATOR_PROFILES)[number];

export type ActiveAssignmentStatus = 'SUGGESTED' | 'ASSIGNED' | 'COMPLETED';

/** Asignación activa tal como la devuelve GET /evaluations/protocol/:id/active-assignments. */
export interface ActiveAssignment {
  assignmentId: number;
  evaluatorId: number;
  evaluatorFullName: string;
  evaluatorProfile: PeerEvaluatorProfile | null;
  status: ActiveAssignmentStatus;
  isAssignedForAnnex10: boolean;
  assignedAt: string | null;
  /** Fecha de calendario 'YYYY-MM-DD' sin hora; no convertir con new Date(str). */
  deadlineDate: string | null;
  submittedAt: string | null;
}

export interface ActiveAssignmentsResult {
  protocolId: number;
  ceishCode: string;
  versionId: number;
  versionNumber: number;
  assignments: ActiveAssignment[];
}

/**
 * Payload de dominio. El adaptador lo traduce al cuerpo real del backend
 * ({currentAssignmentId, replacementEvaluatorId, replacementEvaluatorProfile, reason, reasonDescription}).
 */
export interface ReassignPeerEvaluatorPayload {
  outgoingAssignmentId: number;
  replacementEvaluatorId: number;
  replacementEvaluatorProfile: PeerEvaluatorProfile;
  reason: 'VENCIMIENTO' | 'CONFLICTO_INTERES';
  reasonDescription: string;
}

/**
 * Respuesta de POST /evaluations/reassign. Solo se conocen las llaves; su contenido
 * interno no está verificado, por eso es opaco y la UI no lee campos de ella.
 */
export interface ReassignPeerEvaluatorResponse {
  outgoingAssignment?: Record<string, unknown>;
  newAssignment?: Record<string, unknown>;
  auditHistory?: Record<string, unknown>;
}

export interface AssignmentHistoryEntry {
  id: number;
  assignmentId: number;
  previousEvaluatorId: number;
  previousEvaluatorName: string;
  newEvaluatorId: number;
  newEvaluatorName: string;
  evaluatorProfile: 'JURIDICO' | 'SOCIEDAD_CIVIL' | 'METODOLOGICO' | 'SALUD';
  reassignmentReason: 'VENCIMIENTO' | 'CONFLICTO_INTERES';
  reasonDescription: string;
  executedByUserId: number;
  executedByUserName?: string;
  executedAt: string;
}

