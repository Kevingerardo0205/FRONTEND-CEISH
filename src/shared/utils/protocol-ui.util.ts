import { resolveEstado } from '@domain/catalogs/estado.alias';

export interface EstadoUIMetadata {
  readonly label: string;
  readonly cssClass: 'pending' | 'review' | 'approved' | 'rejected';
}

export const EstadoUIMap: Record<string, EstadoUIMetadata> = {
  INICIADO: { label: 'Iniciado', cssClass: 'pending' },
  COMPLETO: { label: 'Validado / Pendiente Firma', cssClass: 'pending' },
  INCOMPLETO: { label: 'Incompleto (Requiere Subsanación)', cssClass: 'rejected' },
  ARCHIVADO_VENCIMIENTO: { label: 'Archivado por Vencimiento', cssClass: 'pending' },
  EN_EVALUACION: { label: 'En Evaluación', cssClass: 'review' },
  EVALUADO: { label: 'Evaluado', cssClass: 'review' },
  EN_REVISION_SECRETARIA: { label: 'Revisión Secretaría', cssClass: 'review' },
  DISCREPANCIA_RIESGO: { label: 'Discrepancia de Riesgo', cssClass: 'rejected' },
  APROBADO: { label: 'Aprobado', cssClass: 'approved' },
  RECHAZADO: { label: 'Rechazado', cssClass: 'rejected' },
  REQUIERE_SUBSANACION_VERSION: { label: 'Requiere Subsanación de Versión', cssClass: 'rejected' },
  REQUIERE_SUBSANACION_DOC: { label: 'Subsanación Documental', cssClass: 'rejected' },
  EN_CONTROL_DOCUMENTAL: { label: 'En Control Documental', cssClass: 'review' }
} as const;

export const ProtocolUI = {
  label: (status: string | undefined): string => {
    const core = resolveEstado(status);
    if (!core) return status || 'Desconocido';
    return EstadoUIMap[core.code]?.label || core.code.replace(/_/g, ' ');
  },
  class: (status: string | undefined): string => {
    const core = resolveEstado(status);
    if (!core) return 'pending';
    return EstadoUIMap[core.code]?.cssClass || 'pending';
  }
};
