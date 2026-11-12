import { EstadoCatalog, EstadoCore } from '@domain/catalogs/estado.catalog';
import { EstadoAliasMap } from '@domain/catalogs/estado.alias';

/** Resolver de estado puro e de alias */
export function resolveEstado(code: string | undefined): EstadoCore | null {
  if (!code) return null;
  const normalized = code.toUpperCase();
  const catalog = EstadoCatalog as Record<string, EstadoCore>;
  const aliases = EstadoAliasMap as Record<string, EstadoCore>;
  return catalog[normalized] || aliases[normalized] || null;
}

/** Estado del catálogo por id (F10 D13). Un id desconocido, NULL o undefined: null. */
export function estadoById(id: number | null | undefined): EstadoCore | null {
  if (id === null || id === undefined) return null;
  const catalog = Object.values(EstadoCatalog) as readonly EstadoCore[];
  return catalog.find((estado) => estado.id === id) ?? null;
}

/** Resolver específico para agrupaciones de categorías de estados */
export function isEstadoCategoria(
  code: string | undefined,
  categoria: 'RECEPCION' | 'PROTOCOLO',
): boolean {
  const core = resolveEstado(code);
  return core ? core.categoria === categoria : false;
}
