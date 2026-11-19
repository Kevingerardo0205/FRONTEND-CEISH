import {
  ActiveAssignment,
  PeerEvaluatorProfile,
  normalizeProfile,
  profileCodesFromNames,
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
  /** Solo los perfiles reconocidos entre los estrictos; los demás (p. ej. "Ético") se ignoran. */
  profiles: PeerEvaluatorProfile[];
  currentLoad: number;
}

/** La conversión de nombre a código vive en el dominio (F03 D8); se reexporta para la reasignación. */
export { normalizeProfile };

/** Mapea data.evaluators del dashboard; descarta entradas sin id numérico. */
export function mapDashboardCandidates(evaluators: unknown): EvaluatorCandidate[] {
  if (!Array.isArray(evaluators)) return [];
  return evaluators.flatMap((raw): EvaluatorCandidate[] => {
    const e = raw as Partial<DashboardEvaluatorDto> | null;
    if (!e || typeof e.id !== 'number') return [];
    return [
      {
        id: e.id,
        fullName: typeof e.fullName === 'string' ? e.fullName : `Evaluador ${e.id}`,
        email: typeof e.email === 'string' ? e.email : '',
        profiles: profileCodesFromNames(e.profiles),
        currentLoad: typeof e.currentLoad === 'number' ? e.currentLoad : 0,
      },
    ];
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
  activeEvaluatorIds: number[],
): EvaluatorCandidate[] {
  const profile = normalizeProfile(outgoing.evaluatorProfile);
  if (profile === null) return [];
  return candidates.filter(
    (c) =>
      c.id !== outgoing.evaluatorId &&
      !activeEvaluatorIds.includes(c.id) &&
      c.profiles.includes(profile),
  );
}
