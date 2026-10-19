import {
  ActiveAssignment,
  PEER_EVALUATOR_PROFILES,
  PeerEvaluatorProfile,
} from '@domain/entities/peer-evaluation.entity';

/**
 * Forma real de cada evaluador en GET /evaluations/evaluators/dashboard (data.evaluators[]).
 * Tipo estrecho propio: EvaluatorsDashboardEntry del puerto no coincide y lo usan otros consumidores.
 */
export interface DashboardEvaluatorDto {
  id: number;
  fullName: string;
  email: string;
  profiles: { id: number; name: string }[];
  currentLoad: number;
}

export interface EvaluatorCandidate {
  id: number;
  fullName: string;
  email: string;
  /** Solo los perfiles reconocidos entre los 4 estrictos; los demás (p. ej. "Ético") se ignoran. */
  profiles: PeerEvaluatorProfile[];
  currentLoad: number;
}

/** "Metodológico" → METODOLOGICO, "Sociedad Civil" → SOCIEDAD_CIVIL; cualquier otro nombre → null (nunca SALUD por defecto). */
export function normalizeProfile(name: unknown): PeerEvaluatorProfile | null {
  if (typeof name !== 'string') return null;
  const norm = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (PEER_EVALUATOR_PROFILES as readonly string[]).includes(norm) ? (norm as PeerEvaluatorProfile) : null;
}

/** Mapea data.evaluators del dashboard; descarta entradas sin id numérico. */
export function mapDashboardCandidates(evaluators: unknown): EvaluatorCandidate[] {
  if (!Array.isArray(evaluators)) return [];
  return evaluators.flatMap((raw): EvaluatorCandidate[] => {
    const e = raw as Partial<DashboardEvaluatorDto> | null;
    if (!e || typeof e.id !== 'number') return [];
    const profiles = (Array.isArray(e.profiles) ? e.profiles : [])
      .map(p => normalizeProfile(p?.name))
      .filter((p): p is PeerEvaluatorProfile => p !== null);
    return [{
      id: e.id,
      fullName: typeof e.fullName === 'string' ? e.fullName : `Evaluador ${e.id}`,
      email: typeof e.email === 'string' ? e.email : '',
      profiles: [...new Set(profiles)],
      currentLoad: typeof e.currentLoad === 'number' ? e.currentLoad : 0,
    }];
  });
}

/**
 * Candidatos elegibles: comparten el perfil del saliente (RF-12.3, mismo perfil estricto; basta
 * con que coincida uno de sus perfiles). Se excluye al saliente y, por comodidad de interfaz para
 * no duplicar, a quien ya figura en las asignaciones activas (no verificado como regla del backend).
 */
export function filterEligibleCandidates(
  candidates: EvaluatorCandidate[],
  outgoing: Pick<ActiveAssignment, 'evaluatorId' | 'evaluatorProfile'>,
  activeEvaluatorIds: number[]
): EvaluatorCandidate[] {
  const profile = normalizeProfile(outgoing.evaluatorProfile);
  if (profile === null) return [];
  return candidates.filter(c =>
    c.id !== outgoing.evaluatorId &&
    !activeEvaluatorIds.includes(c.id) &&
    c.profiles.includes(profile)
  );
}
