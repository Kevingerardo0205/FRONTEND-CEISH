import {
  ActiveAssignment,
  ActiveAssignmentStatus,
  PeerEvaluatorProfile,
} from '@domain/entities/peer-evaluation.entity';

export const PENDING_DEADLINE_LABEL = 'Pendiente de convocatoria';
export const NO_PROFILE_LABEL = 'Sin perfil';

const STATUS_LABELS: Record<ActiveAssignmentStatus, string> = {
  SUGGESTED: 'Sugerido',
  ASSIGNED: 'Asignado',
  COMPLETED: 'Completado',
};

const PROFILE_LABELS: Record<PeerEvaluatorProfile, string> = {
  JURIDICO: 'Jurídico',
  SOCIEDAD_CIVIL: 'Sociedad Civil',
  METODOLOGICO: 'Metodológico',
  SALUD: 'Salud',
};

export function activeAssignmentStatusLabel(status: ActiveAssignmentStatus | string): string {
  return STATUS_LABELS[status as ActiveAssignmentStatus] ?? status;
}

/** Etiqueta legible del perfil; la lógica sigue usando los códigos del backend. */
export function peerEvaluatorProfileLabel(profile: PeerEvaluatorProfile | string | null): string {
  if (profile === null) return NO_PROFILE_LABEL;
  return PROFILE_LABELS[profile as PeerEvaluatorProfile] ?? profile;
}

/**
 * Interpreta 'YYYY-MM-DD' como fecha de calendario LOCAL. new Date('2026-06-23') la toma
 * como medianoche UTC y en UTC-5 (America/Bogota) se mostraría el día 22.
 */
export function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isSameDay =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isSameDay ? date : null;
}

/** 'YYYY-MM-DD' → 'dd/MM/yyyy'; null → "Pendiente de convocatoria"; otro formato se muestra tal cual. */
export function formatDeadlineDate(value: string | null): string {
  if (value === null) return PENDING_DEADLINE_LABEL;
  const date = parseCalendarDate(value);
  if (!date) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/**
 * Habilita la acción de reasignar solo en SUGGESTED y ASSIGNED.
 * TSK-002-N15: DECISIÓN DE NEGOCIO PENDIENTE sobre qué estados admiten reasignación.
 * Criterio conservador mientras tanto; no es una regla confirmada por el backend.
 */
export function canReassign(assignment: Pick<ActiveAssignment, 'status'>): boolean {
  return assignment.status === 'SUGGESTED' || assignment.status === 'ASSIGNED';
}
