import { EstadoCatalog, EstadoCore } from './estado.catalog';

export const EstadoAliasMap: Record<string, EstadoCore> = {
  DRAFT: EstadoCatalog.INICIADO,
  BORRADOR: EstadoCatalog.INICIADO,
  SUBMITTED: EstadoCatalog.EN_REVISION_SECRETARIA,
  PRESENTADO: EstadoCatalog.EN_REVISION_SECRETARIA,
  OBSERVADO: EstadoCatalog.REQUIERE_SUBSANACION_DOC,
  OBSERVED: EstadoCatalog.REQUIERE_SUBSANACION_DOC,
  PENDIENTE_SUBSANACION: EstadoCatalog.REQUIERE_SUBSANACION_DOC,
  PENDIENTE: EstadoCatalog.EN_REVISION_SECRETARIA,
  DISCREPANCIA_DE_RIESGO: EstadoCatalog.DISCREPANCIA_RIESGO,
  'DISCREPANCIA DE RIESGO': EstadoCatalog.DISCREPANCIA_RIESGO,
  VALIDATED: EstadoCatalog.COMPLETO,
  VALIDADO: EstadoCatalog.COMPLETO,
  ARCHIVADO: EstadoCatalog.ARCHIVADO_VENCIMIENTO
} as const;

/** Resolver de estado puro e individual */
export function resolveEstado(code: string | undefined): EstadoCore | null {
  if (!code) return null;
  const normalized = code.toUpperCase();
  return EstadoCatalog[normalized] || EstadoAliasMap[normalized] || null;
}

/** Resolver específico para agrupaciones de categorías */
export function isEstadoCategoria(code: string | undefined, categoria: 'RECEPCION' | 'PROTOCOLO'): boolean {
  const core = resolveEstado(code);
  return core ? core.categoria === categoria : false;
}
