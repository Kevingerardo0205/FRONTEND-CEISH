import { Observable } from 'rxjs';

/**
 * Datos del encabezado del protocolo que salen de `GET /protocols/:id` (F00 §5 `ProtocolHeader`,
 * F10 D18). Un dato que no llega es `null`: nunca un texto de relleno.
 * - `version`: tal como la manda el backend (texto `"N.0"`); para mostrarla, `protocolVersionLabel`.
 * - `riskLevel`: nombre del nivel de riesgo; hoy `GET /:id` no carga la relación y no llega.
 */
export interface ProtocolHeaderData {
  readonly code: string | null;
  readonly version: string | null;
  readonly title: string | null;
  readonly riskLevel: string | null;
}

/** Encabezado del protocolo por id. El error (HTTP o de contrato) llega al suscriptor. */
export abstract class ProtocolHeaderPort {
  abstract get(id: string): Observable<ProtocolHeaderData>;
}

const VERSION_ENTERA = /^([1-9]\d*)(?:\.0+)?$/;

/**
 * Versión para el encabezado (decisión de la usuaria, 17/11/2026): `"2.0"` o `"2"` → `v2`.
 * Si no se puede leer un número entero ≥ 1 (`"2.5"`, `"0"`, vacío, `null`), no se muestra: `null`.
 */
export function protocolVersionLabel(version: string | null): string | null {
  const match = version === null ? null : VERSION_ENTERA.exec(version.trim());
  return match ? `v${Number(match[1])}` : null;
}
