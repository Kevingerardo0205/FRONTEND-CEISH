/**
 * Entidades del contrato estable `/api/evaluations/meetings`.
 * Los campos replican 1:1 el contrato del backend (camelCase, fechas ISO 8601).
 */

export type MeetingSessionType = 'ORDINARIA' | 'EXTRAORDINARIA';

export const MEETING_SESSION_TYPES: readonly MeetingSessionType[] = ['ORDINARIA', 'EXTRAORDINARIA'];

/** Lugar embebido en una reunión. */
export interface MeetingPlace {
  id: string;
  name: string;
  address: string | null;
  isVirtual: boolean;
  meetingLink: string | null;
}

/** Lugar devuelto por GET /meetings/places. */
export interface MeetingPlaceOption extends MeetingPlace {
  isActive: boolean;
}

/**
 * Lugar de GET /meetings/next (F01 T01-4, spec-003 RF-ALR.f.7). Tipo propio con las claves del
 * contrato: no es `MeetingPlace` (`name`, `isVirtual`, `meetingLink`).
 * `enlaceReunion` ya viene validado por el mapper: solo `http:`/`https:`; si no, `null`.
 */
export interface NextMeetingPlace {
  nombre: string;
  esVirtual: boolean;
  enlaceReunion: string | null;
}

/**
 * `data` de GET /meetings/next cuando hay reunión. `informesATratar` (siempre null) no forma
 * parte del modelo: no se muestra (spec-ui §4 B).
 */
export interface NextMeeting {
  id: string;
  numeroConvocatoria: string;
  tipoSesion: MeetingSessionType;
  fechaReunion: string;
  lugar: NextMeetingPlace | null;
  protocolosATratar: number;
}

/** Elemento de GET /meetings. */
export interface Meeting {
  id: string;
  meetingNumber: string;
  academicYear: number | null;
  sessionType: MeetingSessionType;
  meetingDate: string | null;
  evalSubmissionDeadline: string | null;
  status: string;
  place: MeetingPlace | null;
  agendaPdfUrl: string;
  protocolCount: number;
}

/** Protocolo agendado en el detalle de una reunión (ordenado por `order` ASC). */
export interface MeetingProtocol {
  order: number;
  protocolId: string | number | null;
  versionId: number | null;
  versionNumber: number | null;
  ceishCode: string | null;
  title: string | null;
  studyType: string | null;
  investigatorName: string | null;
  normativeDeadline: string | null;
}

/** GET /meetings/:id */
export interface MeetingDetail extends Meeting {
  protocols: MeetingProtocol[];
}

/** GET /meetings/pending-protocols. `versionId` ≠ `protocolId`. */
export interface PendingProtocol {
  protocolId: string | number;
  versionId: number;
  versionNumber: number | null;
  ceishCode: string | null;
  title: string | null;
  studyType: string | null;
  investigatorName: string | null;
  receptionDate: string | null;
  deadline: string | null;
}

/**
 * Cuerpo de POST /meetings. El backend asigna el número de convocatoria y genera
 * el PDF de agenda: no se envían número, agenda ni followUpReportIds.
 */
export interface CreateMeetingDto {
  sessionType: MeetingSessionType;
  meetingDate: string;
  evalSubmissionDeadline?: string;
  locationId?: string;
  protocolVersionIds?: number[];
}

/** `data` de la respuesta de POST /meetings. */
export interface CreatedMeeting {
  id: string;
  meetingNumber: string;
  sessionType: MeetingSessionType;
  meetingDate: string | null;
  evalSubmissionDeadline: string | null;
  agendaPdfUrl: string;
}

export interface MeetingListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedMeetings {
  items: Meeting[];
  meta: PaginationMeta;
}

/** Códigos de error de negocio conocidos del contrato. */
export type MeetingErrorCode =
  'VERSIONES_DUPLICADAS' | 'SEGUIMIENTO_NO_DISPONIBLE' | 'VALIDACION' | 'DESCONOCIDO';

/** Error de backend normalizado para la capa de presentación. */
export class MeetingApiError extends Error {
  constructor(
    readonly code: MeetingErrorCode,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'MeetingApiError';
  }
}

/** La respuesta del backend no cumple el contrato (campo requerido ausente o de otro tipo). */
export class MeetingContractError extends Error {
  constructor(
    readonly path: string,
    readonly expected: string,
  ) {
    super(`Respuesta de reuniones fuera de contrato: "${path}" debe ser ${expected}`);
    this.name = 'MeetingContractError';
  }
}
