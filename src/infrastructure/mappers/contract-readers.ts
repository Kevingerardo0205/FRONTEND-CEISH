/**
 * Lectores estrictos de contratos del backend (F01 T01-2, plan §2.1; spec-ui §7.2).
 *
 * Cada lector valida el tipo de un campo y, si no coincide, lanza `ContractError` con la ruta
 * del campo. No hay alias ni valores por defecto: un texto que no es string nunca llega a la
 * plantilla (ni como `[object Object]`).
 *
 * Duplicado temporal: `meeting.mapper.ts:152-215` tiene los mismos lectores con
 * `MeetingContractError`; se unifican en T01-R1.
 */

export type Raw = Record<string, unknown>;

export class ContractError extends Error {
  constructor(
    readonly path: string,
    readonly expected: string,
  ) {
    super(`Respuesta fuera de contrato: "${path}" debe ser ${expected}`);
    this.name = 'ContractError';
  }
}

export function asObject(value: unknown, path: string): Raw {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ContractError(path, 'object');
  }
  return value as Raw;
}

export function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ContractError(path, 'array');
  return value;
}

export function str(raw: Raw, key: string, path: string): string {
  const v = raw[key];
  if (typeof v !== 'string') throw new ContractError(`${path}.${key}`, 'string');
  return v;
}

export function nullableStr(raw: Raw, key: string, path: string): string | null {
  const v = raw[key];
  if (v === null) return null;
  if (typeof v !== 'string') throw new ContractError(`${path}.${key}`, 'string | null');
  return v;
}

export function num(raw: Raw, key: string, path: string): number {
  const v = raw[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new ContractError(`${path}.${key}`, 'number');
  }
  return v;
}

export function nullableNum(raw: Raw, key: string, path: string): number | null {
  const v = raw[key];
  if (v === null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new ContractError(`${path}.${key}`, 'number | null');
  }
  return v;
}

export function bool(raw: Raw, key: string, path: string): boolean {
  const v = raw[key];
  if (typeof v !== 'boolean') throw new ContractError(`${path}.${key}`, 'boolean');
  return v;
}

/** Identificador: string o number finito, tal cual llega. */
export function idValue(raw: Raw, key: string, path: string): string | number {
  const v = raw[key];
  if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) return v;
  throw new ContractError(`${path}.${key}`, 'string | number');
}

/** Uno de los valores permitidos; cualquier otro lanza. */
export function oneOf<T extends string>(
  raw: Raw,
  key: string,
  path: string,
  valores: readonly T[],
): T {
  const v = raw[key];
  if (typeof v !== 'string' || !(valores as readonly string[]).includes(v)) {
    throw new ContractError(`${path}.${key}`, valores.map((x) => `'${x}'`).join(' | '));
  }
  return v as T;
}

/**
 * Quita SOLO la capa externa que añade el ResponseInterceptor del backend cuando el cuerpo llega
 * envuelto dos veces (`{ statusCode, message, data: { statusCode, message, data } }`). Si no tiene
 * esa forma, se devuelve intacto. Misma regla que `meeting-api.adapter.ts:99-107`.
 */
export function stripTransportEnvelope(body: unknown): unknown {
  if (!isPlainObject(body)) return body;
  if (typeof body['statusCode'] !== 'number' || typeof body['message'] !== 'string') return body;
  const inner = body['data'];
  if (!isPlainObject(inner) || typeof inner['statusCode'] !== 'number' || !('data' in inner)) {
    return body;
  }
  return inner;
}

/** `data` del envoltorio `{ statusCode, message, data }`; si falta, lanza. */
export function unwrapData(envelope: unknown, path = 'response'): unknown {
  const obj = asObject(envelope, path);
  if (!('data' in obj)) throw new ContractError(`${path}.data`, 'presente');
  return obj['data'];
}

function isPlainObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
