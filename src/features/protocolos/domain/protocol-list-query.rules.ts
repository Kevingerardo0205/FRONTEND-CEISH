import { Stage } from '@domain/value-objects/stage.vo';
import { LIMITE_PROTOCOLOS, ProtocolListQuery } from './protocol-list-item.model';

/** Lo único que se necesita de `ParamMap` (`ActivatedRoute.queryParamMap`). */
export interface ParametrosUrl {
  get(nombre: string): string | null;
}

export const ANIO_MINIMO = 2000;
export const SEARCH_MAXIMO = 100;

const ENTERO = /^\d+$/;

/**
 * Convierte los parámetros de la URL de `/protocolos` en una consulta válida (spec-ui §7.5, D10).
 * Lo inválido se descarta, no se corrige:
 * - `etapa`: uno de `Stage.all()`; si no, ninguna (Todos).
 * - `year`: entero de 2000 a `anioActual`; si no, ninguno (Todos). `anioActual` entra como
 *   argumento para que las reglas no dependan del reloj.
 * - `page`: entero ≥ 1; si no, 1.
 * - `search`: recortado; vacío o de más de 100 caracteres, no se envía.
 * - `limit`: siempre 20.
 */
export function queryDesdeUrl(params: ParametrosUrl, anioActual: number): ProtocolListQuery {
  const query: ProtocolListQuery = { page: pagina(params.get('page')), limit: LIMITE_PROTOCOLOS };

  const etapa = Stage.all().find((s) => s.code === params.get('etapa'));
  if (etapa) query.etapa = etapa.code;

  const year = anio(params.get('year'), anioActual);
  if (year !== null) query.year = year;

  const search = (params.get('search') ?? '').trim();
  if (search !== '' && search.length <= SEARCH_MAXIMO) query.search = search;

  return query;
}

function pagina(valor: string | null): number {
  if (valor === null || !ENTERO.test(valor)) return 1;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

function anio(valor: string | null, anioActual: number): number | null {
  if (valor === null || !ENTERO.test(valor)) return null;
  const n = Number(valor);
  return n >= ANIO_MINIMO && n <= anioActual ? n : null;
}
