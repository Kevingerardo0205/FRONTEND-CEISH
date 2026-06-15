export interface EstadoCore {
  readonly id: number;
  readonly code: string;
  readonly categoria: 'RECEPCION' | 'PROTOCOLO';
}

export const EstadoCatalog = {
  INICIADO: { id: 9, code: 'INICIADO', categoria: 'RECEPCION' },
  COMPLETO: { id: 10, code: 'COMPLETO', categoria: 'RECEPCION' },
  INCOMPLETO: { id: 11, code: 'INCOMPLETO', categoria: 'RECEPCION' },
  ARCHIVADO_VENCIMIENTO: { id: 12, code: 'ARCHIVADO_VENCIMIENTO', categoria: 'RECEPCION' },
  EN_EVALUACION: { id: 13, code: 'EN_EVALUACION', categoria: 'PROTOCOLO' },
  EVALUADO: { id: 14, code: 'EVALUADO', categoria: 'PROTOCOLO' },
  EN_REVISION_SECRETARIA: { id: 15, code: 'EN_REVISION_SECRETARIA', categoria: 'RECEPCION' },
  DISCREPANCIA_RIESGO: { id: 16, code: 'DISCREPANCIA_RIESGO', categoria: 'PROTOCOLO' },
  APROBADO: { id: 17, code: 'APROBADO', categoria: 'PROTOCOLO' },
  RECHAZADO: { id: 18, code: 'RECHAZADO', categoria: 'PROTOCOLO' },
  REQUIERE_SUBSANACION_VERSION: { id: 19, code: 'REQUIERE_SUBSANACION_VERSION', categoria: 'PROTOCOLO' },
  REQUIERE_SUBSANACION_DOC: { id: 20, code: 'REQUIERE_SUBSANACION_DOC', categoria: 'RECEPCION' },
  EN_CONTROL_DOCUMENTAL: { id: 21, code: 'EN_CONTROL_DOCUMENTAL', categoria: 'PROTOCOLO' }
} as const satisfies Record<string, EstadoCore>;
