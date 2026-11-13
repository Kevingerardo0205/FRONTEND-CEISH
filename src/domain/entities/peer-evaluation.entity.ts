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

/**
 * Una asignación creada por POST /evaluations/protocols/:id/assign-peer-evaluators (F10 D15). El
 * backend devuelve un arreglo de `EvaluationAssignmentEntity` (`assign-evaluators.use-case.ts`).
 */
export interface PeerAssignmentResult {
  assignmentId: number | string | null;
  evaluatorId: number;
  /** Código del perfil (JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO, SALUD). */
  profile: string;
  /** Par de riesgo: elegido al azar para el Anexo 10 (`isAssignedForAnnex10`). */
  isRiskPeer: boolean;
  /** 'YYYY-MM-DD', o null hasta que el protocolo entre en una convocatoria (RF-12.7(a)). */
  deadlineDate: string | null;
}

export interface AssignEvaluatorsResponse {
  assignments: PeerAssignmentResult[];
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
    description:
      'No realiza ninguna intervención biológica, psicológica o social. Datos anonimizados, fuentes abiertas.',
  },
  {
    id: 5,
    name: 'Riesgo Mínimo',
    description:
      'Riesgos equivalentes a la vida diaria o práctica médica de rutina (ej: revisión de historias clínicas anonimizadas).',
  },
  {
    id: 6,
    name: 'Riesgo Moderado',
    description: 'Exposición a mediciones o intervenciones controladas de bajo impacto.',
  },
  {
    id: 7,
    name: 'Riesgo Mayor',
    description:
      'Probabilidades significativas de daño físico, psicológico o social prolongado. Uso de datos personales sensibles (PII).',
  },
  {
    id: 8,
    name: 'Ensayo Clínico',
    description:
      'Pruebas de medicamentos, vacunas, o dispositivos con intervención clínica directa.',
  },
];

/** Perfiles estrictos que acepta el backend en la reasignación (RF-12.3). */
export const PEER_EVALUATOR_PROFILES = [
  'JURIDICO',
  'SOCIEDAD_CIVIL',
  'METODOLOGICO',
  'SALUD',
] as const;
export type PeerEvaluatorProfile = (typeof PEER_EVALUATOR_PROFILES)[number];

/**
 * Cuota de la asignación de pares (F10 D15). Única fuente de la instrucción, la etiqueta y la
 * validación del modal de pares. Copia lo que exige hoy el backend `dev`:
 * `evaluator-assignment-adapter.service.ts:56-64` (exactamente 4 evaluadores) y `:109-114` (uno por
 * cada perfil: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO, SALUD), y `random-risk-selector.service.ts`
 * (2 pares de riesgo al azar, nunca SOCIEDAD_CIVIL).
 * Pendiente de alinear: la reunión del 06/11/2026 decidió 5 perfiles (con Bioético), mínimo 2 pares
 * y que asigna la Presidenta.
 */
const PEERS_PER_PROFILE = 1;
export const PEER_ASSIGNMENT_QUOTA = {
  profiles: PEER_EVALUATOR_PROFILES,
  perProfile: PEERS_PER_PROFILE,
  total: PEER_EVALUATOR_PROFILES.length * PEERS_PER_PROFILE,
  riskPeers: 2,
  riskExcludedProfile: 'SOCIEDAD_CIVIL' as PeerEvaluatorProfile,
} as const;

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
