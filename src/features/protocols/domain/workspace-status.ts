import { StageCode } from '@domain/value-objects/stage.vo';
import { estadoById, resolveEstado } from '@shared/utils/estado.resolver';

/**
 * Estado canónico del espacio del protocolo (F10 D13, S-1f): el del protocolo (`statusId`) y, solo si
 * es NULL, el de la recepción (`receptionStatus`, que el frontend guarda en `status`), como
 * `resolveProtocolStage` del backend. Un `statusId` fuera del catálogo no cae a la recepción: null.
 */
export function workspaceStatusCode(
  statusId: number | null | undefined,
  receptionStatus: string | null | undefined,
): string | null {
  if (statusId !== null && statusId !== undefined) return estadoById(statusId)?.code ?? null;
  return resolveEstado(receptionStatus ?? undefined)?.code ?? null;
}

/**
 * TEMPORAL (F10 D13, excepción a F00 §5): etapa de cada estado, copiada de la migración del backend
 * `1890000000000-AddEtapaOrdenToEstados` (por id, en el comentario), hasta que `GET /protocols/:id`
 * traiga `etapa` (TSK-F02-3). SEGUIMIENTO y RENOVACION no salen: el backend las decide con datos que
 * `GET /:id` no entrega.
 */
const STAGE_BY_STATUS_CODE: Readonly<Record<string, StageCode>> = {
  INICIADO: 'RECEPCION', // 9
  INCOMPLETO: 'RECEPCION', // 11
  ARCHIVADO_VENCIMIENTO: 'RECEPCION', // 12
  EN_REVISION_SECRETARIA: 'RECEPCION', // 15
  REQUIERE_SUBSANACION_DOC: 'RECEPCION', // 20
  EN_CONTROL_DOCUMENTAL: 'RECEPCION', // 21
  COMPLETO: 'ASIGNACION', // 10
  EN_EVALUACION: 'EVALUACION', // 13
  DISCREPANCIA_RIESGO: 'EVALUACION', // 16
  EVALUADO: 'RESOLUCION', // 14
  APROBADO: 'RESOLUCION', // 17
  RECHAZADO: 'RESOLUCION', // 18
  REQUIERE_SUBSANACION_VERSION: 'RESOLUCION', // 19
  APROBADO_CON_CONDICION: 'RESOLUCION', // 25
};

/** Etapa del estado canónico (temporal, ver arriba). Sin estado reconocido: null (no hay barra, F02 §5.3). */
export function workspaceStageCode(statusCode: string | null): StageCode | null {
  return statusCode ? (STAGE_BY_STATUS_CODE[statusCode] ?? null) : null;
}

export const UNKNOWN_STATUS_LABEL = 'Estado no reconocido';

/** Etiquetas del estado canónico (F10 D13). */
const LABEL_BY_STATUS_CODE: Readonly<Record<string, string>> = {
  INICIADO: 'Iniciado',
  EN_REVISION_SECRETARIA: 'Por validar',
  INCOMPLETO: 'Con observaciones',
  REQUIERE_SUBSANACION_DOC: 'Pendiente de subsanación',
  ARCHIVADO_VENCIMIENTO: 'Archivado',
  COMPLETO: 'Recepción aprobada',
  EN_EVALUACION: 'En evaluación',
  DISCREPANCIA_RIESGO: 'Discrepancia de riesgo',
  EVALUADO: 'Evaluado',
  APROBADO: 'Aprobado',
  APROBADO_CON_CONDICION: 'Aprobado con condiciones',
  RECHAZADO: 'Rechazado',
  REQUIERE_SUBSANACION_VERSION: 'Requiere nueva versión',
  EN_CONTROL_DOCUMENTAL: 'Nueva versión en revisión documental',
};

/** Etiqueta del estado canónico; el borrador se reconoce aparte (`status` BORRADOR, D13). */
export function workspaceStatusLabel(statusCode: string | null, isDraft: boolean): string {
  if (isDraft) return 'Borrador';
  return (statusCode && LABEL_BY_STATUS_CODE[statusCode]) || UNKNOWN_STATUS_LABEL;
}
