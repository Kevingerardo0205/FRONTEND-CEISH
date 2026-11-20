import {
  AssignedEvaluator,
  AssignmentMember,
  AssignmentReviewType,
  PEER_EVALUATOR_PROFILE_LABELS,
  PeerEvaluatorProfile,
} from './peer-evaluation.entity';

/**
 * Composición de la asignación de la Presidenta (F03 D3 a D5). Copia las reglas del backend
 * (`quota-evaluator-validator.service.ts`, TSK-002-N52; spec-002 RF-12.1 a–c), que vuelve a
 * validar y responde 400 si algo no cumple.
 */

/** Filas de la revisión expedita, en su orden (RF-12.1 a). */
export const EXPEDITED_REVIEW_PROFILES: readonly PeerEvaluatorProfile[] = [
  'METODOLOGICO',
  'SALUD',
  'JURIDICO',
  'BIOETICO',
  'SOCIEDAD_CIVIL',
];

/** Perfil obligatorio: su fila de la expedita no se quita y no define el riesgo (RF-12.1 a, c). */
export const REQUIRED_PROFILE: PeerEvaluatorProfile = 'SOCIEDAD_CIVIL';

/**
 * Motivo (1) de F03 D5: el investigador no aceptó los tiempos (el backend responde 409). Es el
 * mismo texto que el aviso del espacio del protocolo (F10 D15 (5) y D20 (3)).
 */
export const TERMS_NOT_ACCEPTED_REASON = 'El investigador aún no acepta los tiempos del comité.';

/** Mínimo de evaluadores, sin parámetro (RF-12.1 c). */
export const MIN_ASSIGNED_EVALUATORS = 2;

/** Una fila del formulario: en la expedita el perfil es fijo; en pleno, la persona. */
export interface AssignmentSelection {
  /** Texto de la fila en los motivos: la etiqueta del perfil (expedita) o el nombre (pleno). */
  rowLabel: string;
  evaluatorId: number | null;
  evaluatorName: string | null;
  profile: PeerEvaluatorProfile | null;
}

/** Personas que tienen ese perfil activo. */
export function membersWithProfile(
  members: readonly AssignmentMember[],
  profile: PeerEvaluatorProfile,
): AssignmentMember[] {
  return members.filter((m) => m.profiles.includes(profile));
}

/** Filas de la expedita que se muestran: solo los perfiles con miembros (RF-12.1 f). */
export function expeditedRowProfiles(members: readonly AssignmentMember[]): PeerEvaluatorProfile[] {
  return EXPEDITED_REVIEW_PROFILES.filter((p) => membersWithProfile(members, p).length > 0);
}

/**
 * Cruce transitorio hasta TSK-002-N54 (F03 D8): las personas salen de `evaluators/active` y sus
 * perfiles del dashboard, por id. Quien no aparece en `active` no se ofrece; quien no tiene
 * perfiles en el dashboard queda con `profiles: []` («Sin perfil asignado»). Orden por nombre.
 */
export function crossAssignmentMembers(
  active: readonly { id: number; fullName: string }[],
  profilesByMember: readonly { id: number; profiles: readonly PeerEvaluatorProfile[] }[],
): AssignmentMember[] {
  const byId = new Map(profilesByMember.map((m) => [m.id, m.profiles]));
  const seen = new Set<number>();
  const members: AssignmentMember[] = [];
  for (const person of active) {
    if (seen.has(person.id)) continue;
    seen.add(person.id);
    members.push({
      id: person.id,
      fullName: person.fullName,
      profiles: [...new Set(byId.get(person.id) ?? [])],
    });
  }
  return members.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
}

const label = (p: PeerEvaluatorProfile) => PEER_EVALUATOR_PROFILE_LABELS[p];

/**
 * Primer motivo por el que la composición no se puede enviar, o null si es válida (F03 D5, motivos
 * (2) a (7); el (1), tiempos no aceptados, depende del protocolo y lo agrega la página).
 */
export function compositionBlockReason(
  reviewType: AssignmentReviewType | null,
  selections: readonly AssignmentSelection[],
): string | null {
  if (reviewType === null) return 'Elija el tipo de revisión.';

  for (const s of selections) {
    if (s.evaluatorId === null) return `Elija una persona para ${s.rowLabel} o quite la fila.`;
    if (s.profile === null) return `Elija el perfil de ${s.rowLabel}.`;
  }

  const seen = new Set<number>();
  for (const s of selections) {
    const id = s.evaluatorId as number;
    if (seen.has(id)) {
      return `${s.evaluatorName ?? s.rowLabel} está en más de una fila; cada persona entra una sola vez.`;
    }
    seen.add(id);
  }

  if (selections.length < MIN_ASSIGNED_EVALUATORS) {
    return `Asigne al menos ${MIN_ASSIGNED_EVALUATORS} evaluadores.`;
  }
  const required = selections.filter((s) => s.profile === REQUIRED_PROFILE).length;
  if (required === 0) {
    return `Incluya al menos un evaluador de ${label(REQUIRED_PROFILE)}.`;
  }
  if (required === selections.length) {
    return `Incluya al menos un evaluador que no sea de ${label(REQUIRED_PROFILE)}.`;
  }
  return null;
}

/** Cuerpo de `evaluators` en el orden de las filas; solo las filas completas. */
export function toAssignedEvaluators(selections: readonly AssignmentSelection[]): AssignedEvaluator[] {
  return selections.flatMap((s) =>
    s.evaluatorId !== null && s.profile !== null
      ? [{ evaluatorId: s.evaluatorId, profile: s.profile }]
      : [],
  );
}
