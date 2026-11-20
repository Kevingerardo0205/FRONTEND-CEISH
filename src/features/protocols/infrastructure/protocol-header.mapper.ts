import {
  ContractError,
  Raw,
  asObject,
  stripTransportEnvelope,
  unwrapData,
} from '@infrastructure/mappers/contract-readers';
import { Stage } from '@domain/value-objects/stage.vo';
import { ProtocolHeaderData } from '../domain/protocol-header';

/**
 * Mapper estricto de `GET /protocols/:id` para el encabezado (F00 §5, F10 D18; backend
 * `protocol.mapper.ts:45-100`). A diferencia de `ProtocolApiAdapter.mapToEntity`, no rellena:
 * - un campo ausente, `null` o vacío → `null` (sin `'Sin título'`, `'DESCONOCIDO'`,
 *   `version || 1` ni `new Date()`);
 * - un campo con otro tipo → `ContractError` con la ruta del campo.
 * Acepta el envoltorio del `ResponseInterceptor` (`{ statusCode, message, data }`) o el objeto solo.
 * Solo lee los campos del encabezado; los demás se ignoran.
 */
export class ProtocolHeaderMapper {
  static toHeader(body: unknown): ProtocolHeaderData {
    const cuerpo = stripTransportEnvelope(body);
    const conEnvoltorio = esEnvoltorio(cuerpo);
    const path = conEnvoltorio ? 'data' : 'response';
    const raw = asObject(conEnvoltorio ? unwrapData(cuerpo) : cuerpo, path);
    return {
      code: texto(raw, 'ceishCode', path),
      version: version(raw, path),
      title: texto(raw, 'title', path),
      riskLevel: 'riskLevel' in raw ? texto(raw, 'riskLevel', path) : undefined,
      stage: etapa(raw, path),
    };
  }
}

/** `etapa` (F10 D19): el orden sale de `Stage` y `etapaOrden` no se lee; null o desconocida → null. */
function etapa(raw: Raw, path: string): Stage | null {
  const v = texto(raw, 'etapa', path);
  return Stage.all().find((s) => s.code === v) ?? null;
}

function esEnvoltorio(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Raw)['statusCode'] === 'number' &&
    'data' in (value as Raw)
  );
}

/** Texto opcional: ausente, `null` o solo espacios → `null`; otro tipo lanza. */
function texto(raw: Raw, key: string, path: string): string | null {
  const v = raw[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw new ContractError(`${path}.${key}`, 'string | null');
  const limpio = v.trim();
  return limpio === '' ? null : limpio;
}

/** `version` llega como texto `"N.0"` (getter de la entidad); se acepta también un número. */
function version(raw: Raw, path: string): string | null {
  const v = raw['version'];
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return texto(raw, 'version', path);
}
