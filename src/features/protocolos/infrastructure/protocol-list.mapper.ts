import { Stage } from '@domain/value-objects/stage.vo';
import {
  Raw,
  asArray,
  asObject,
  idValue,
  nullableStr,
  num,
  str,
  stripTransportEnvelope,
  unwrapData,
} from '@infrastructure/mappers/contract-readers';
import {
  InvestigadorPrincipal,
  ProtocolListItem,
  ProtocolListResult,
} from '../domain/protocol-list-item.model';

/**
 * Mapper estricto de `GET /protocols` (spec-001 RF-EST.3, TSK-001.4; spec-ui §4 C).
 * - La página es `{ data: [...], total, page, limit, totalPages }`. En producción llega dentro del
 *   envoltorio del `ResponseInterceptor` (`{ statusCode, message, data: página }`); sin él (por
 *   ejemplo, en las E2E del backend) llega la página sola. Se aceptan las dos formas.
 * - Un campo con otro tipo lanza `ContractError` con la ruta del campo.
 * - Una `etapa` desconocida queda en `null` sin lanzar (spec-ui §5.3).
 * - Solo se leen los campos que muestra la tabla; los demás se ignoran.
 */
export class ProtocolListMapper {
  static toResultado(body: unknown): ProtocolListResult {
    const cuerpo = stripTransportEnvelope(body);
    const conEnvoltorio = esEnvoltorio(cuerpo);
    const path = conEnvoltorio ? 'data' : 'response';
    const raw = asObject(conEnvoltorio ? unwrapData(cuerpo) : cuerpo, path);
    return {
      items: asArray(raw['data'], `${path}.data`).map((item, i) =>
        ProtocolListMapper.toItem(item, `${path}.data[${i}]`),
      ),
      total: num(raw, 'total', path),
      page: num(raw, 'page', path),
      limit: num(raw, 'limit', path),
      totalPages: num(raw, 'totalPages', path),
    };
  }

  static toItem(value: unknown, path: string): ProtocolListItem {
    const raw = asObject(value, path);
    return {
      id: idValue(raw, 'id', path),
      ceishCode: nullableStr(raw, 'ceishCode', path),
      title: str(raw, 'title', path),
      etapa: etapa(raw, path),
      principalInvestigator: investigador(raw, `${path}.principalInvestigator`),
    };
  }
}

/** Envoltorio del interceptor: `statusCode` y `message`, con la página (un objeto) en `data`. */
function esEnvoltorio(cuerpo: unknown): boolean {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) return false;
  const c = cuerpo as Raw;
  const data = c['data'];
  return (
    typeof c['statusCode'] === 'number' &&
    typeof c['message'] === 'string' &&
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data)
  );
}

/** Etapa desconocida o null → `null`; la fila se sigue mostrando. */
function etapa(raw: Raw, path: string): Stage | null {
  const v = nullableStr(raw, 'etapa', path);
  return Stage.all().find((s) => s.code === v) ?? null;
}

function investigador(raw: Raw, path: string): InvestigadorPrincipal | null {
  const v = raw['principalInvestigator'];
  if (v === null) return null;
  const pi = asObject(v, path);
  return { id: idValue(pi, 'id', path), fullName: str(pi, 'fullName', path) };
}
