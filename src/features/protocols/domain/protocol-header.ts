import { Observable } from 'rxjs';
import { Stage } from '@domain/value-objects/stage.vo';

/**
 * Datos del encabezado del protocolo que salen de `GET /protocols/:id` (F00 §5 `ProtocolHeader`,
 * F10 D18 y D19). Un dato que no llega es `null`: nunca un texto de relleno.
 * - `version`: tal como la manda el backend (texto `"N.0"`); para mostrarla, `protocolVersionLabel`.
 * - `riskLevel`: nombre del nivel de riesgo (D19). `null` = el backend dice que no está fijado;
 *   `undefined` = la clave no llegó. Para mostrarlo, `riskLevelFactValue`.
 * - `stage`: la `etapa` del backend; `null` si no llega o no se reconoce (no hay barra).
 */
export interface ProtocolHeaderData {
  readonly code: string | null;
  readonly version: string | null;
  readonly title: string | null;
  readonly riskLevel: string | null | undefined;
  readonly stage: Stage | null;
}

/** Texto del nivel de riesgo no fijado (F10 D19, decisión de la usuaria del 18/11/2026). */
export const RISK_LEVEL_UNSET_LABEL = 'Sin fijar';

/**
 * Valor del dato «Nivel de riesgo» del encabezado (F00 §5, excepción explícita de EP1b):
 * `null` es un estado real y se muestra `Sin fijar`; sin la clave (`undefined`) el dato no sale.
 */
export function riskLevelFactValue(riskLevel: string | null | undefined): string | null {
  if (riskLevel === undefined) return null;
  return riskLevel ?? RISK_LEVEL_UNSET_LABEL;
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
