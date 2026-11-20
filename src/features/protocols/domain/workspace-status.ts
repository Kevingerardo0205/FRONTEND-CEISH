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
 * Estado de la etapa ASIGNACION para las acciones del espacio (F10 D13, D15 y D20): «Asignar Pares» y el
 * aviso de aceptación de tiempos siguen el estado canónico (D19). COMPLETO (10) es el único estado
 * con etapa ASIGNACION en la migración `1890000000000-AddEtapaOrdenToEstados`.
 */
export function isAssignmentStatus(statusCode: string | null): boolean {
  return statusCode === 'COMPLETO';
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
