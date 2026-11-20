/**
 * Un protocolo de GET /evaluations/protocols/pending-peer-assignment (F03 D2). `null`: el backend no
 * lo envió; la pantalla muestra un texto de ausencia, nunca un dato inventado.
 */
export interface PendingPeerAssignmentProtocol {
  id: number;
  ceishCode: string | null;
  title: string | null;
  /** Nombre del tipo de estudio (`studyType.name`). */
  studyType: string | null;
  /** Nombre del investigador principal (`principalInvestigator.fullName`). */
  principalInvestigator: string | null;
  /** Instante ISO de la recepción de la versión activa (`activeVersion.reception.receptionDate`). */
  receptionDate: string | null;
  isTimelineTermsAccepted: boolean | null;
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
 * Una asignación creada por POST /evaluations/protocols/:id/assign-peer-evaluators (F03 D7). El
 * backend devuelve un arreglo de `EvaluationAssignmentEntity` (`assign-evaluators.use-case.ts`, N52).
 */
export interface PeerAssignmentResult {
  assignmentId: number | string | null;
  evaluatorId: number;
  /** Código del perfil con que entró la persona (`PeerEvaluatorProfile`). */
  profile: string;
  /** Define el riesgo (Anexo 10, `isAssignedForAnnex10`): todos menos Sociedad Civil (RF-12.2a). */
  isRiskPeer: boolean;
  /** Fecha de entrega de la convocatoria ('YYYY-MM-DD') o null; no es la fecha límite de la revisión. */
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

/**
 * Perfiles estrictos del backend (`EvaluatorProfile` de `evaluator-enums.ts`): los acepta la
 * asignación (N52) y la reasignación (RF-12.3). Bioético desde TSK-002-N50 (F03 D9).
 */
export const PEER_EVALUATOR_PROFILES = [
  'JURIDICO',
  'SOCIEDAD_CIVIL',
  'METODOLOGICO',
  'SALUD',
  'BIOETICO',
] as const;
export type PeerEvaluatorProfile = (typeof PEER_EVALUATOR_PROFILES)[number];

/** Única lista de etiquetas de los perfiles (F03 D9). La lógica sigue usando los códigos. */
export const PEER_EVALUATOR_PROFILE_LABELS: Readonly<Record<PeerEvaluatorProfile, string>> = {
  JURIDICO: 'Jurídico',
  SOCIEDAD_CIVIL: 'Sociedad Civil',
  METODOLOGICO: 'Metodológico',
  SALUD: 'Salud',
  BIOETICO: 'Bioético',
};

/**
 * Nombre de un perfil del catálogo → código: "Metodológico" → METODOLOGICO, "Sociedad Civil" →
 * SOCIEDAD_CIVIL, "Bioético" → BIOETICO. Cualquier otro nombre → null (nunca un perfil por defecto).
 */
export function normalizeProfile(name: unknown): PeerEvaluatorProfile | null {
  if (typeof name !== 'string') return null;
  const norm = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (PEER_EVALUATOR_PROFILES as readonly string[]).includes(norm)
    ? (norm as PeerEvaluatorProfile)
    : null;
}

/**
 * `profiles[]` de un evaluador de GET /evaluations/evaluators/dashboard (`[{ id, name }]`) → códigos,
 * sin repetidos; los nombres que no son de un perfil se ignoran. Lo usan la reasignación y F03 D8.
 */
export function profileCodesFromNames(profiles: unknown): PeerEvaluatorProfile[] {
  if (!Array.isArray(profiles)) return [];
  const codes = profiles
    .map((p: { name?: unknown } | null) => normalizeProfile(p?.name))
    .filter((p): p is PeerEvaluatorProfile => p !== null);
  return [...new Set(codes)];
}

/** `data.evaluators[]` del dashboard → `{ id, profiles }`; descarta entradas sin id numérico (F03 D8). */
export function dashboardMemberProfiles(
  evaluators: unknown,
): { id: number; profiles: PeerEvaluatorProfile[] }[] {
  if (!Array.isArray(evaluators)) return [];
  return evaluators.flatMap((item) => {
    const e = item as { id?: unknown; profiles?: unknown } | null;
    return e && typeof e.id === 'number' ? [{ id: e.id, profiles: profileCodesFromNames(e.profiles) }] : [];
  });
}

/** Tipos de revisión con los que la Presidenta asigna (RF-12.REV; sin ENSAYO_CLINICO). */
export type AssignmentReviewType = 'EXPEDITA' | 'PLENO';

/** Una persona con el perfil con que entra (cuerpo de N52). */
export interface AssignedEvaluator {
  evaluatorId: number;
  profile: PeerEvaluatorProfile;
}

/** Cuerpo de POST /evaluations/protocols/:id/assign-peer-evaluators (N52, F03 D6). */
export interface AssignPeerEvaluatorsPayload {
  reviewType: AssignmentReviewType;
  evaluators: AssignedEvaluator[];
}

/** Persona que se puede asignar: activa, con rol EVALUADOR y sus perfiles activos (F03 D8). */
export interface AssignmentMember {
  id: number;
  fullName: string;
  profiles: PeerEvaluatorProfile[];
}

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
  evaluatorProfile: PeerEvaluatorProfile;
  reassignmentReason: 'VENCIMIENTO' | 'CONFLICTO_INTERES';
  reasonDescription: string;
  executedByUserId: number;
  executedByUserName?: string;
  executedAt: string;
}
