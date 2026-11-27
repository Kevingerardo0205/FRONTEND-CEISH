/**
 * TSK-015-N24 (d): cuándo el investigador puede subir un documento de subsanación.
 *
 * Datos que llegan de `GET /protocols/:id` (protocol.mapper.ts `toResponse`):
 * - `statusId`: estado del protocolo (19 REQUIERE_SUBSANACION_VERSION, 21 EN_CONTROL_DOCUMENTAL).
 * - `receptionStatus`: estado de recepción DERIVADO por el backend (protocol.entity.orm.ts). El
 *   id crudo de recepción (9 INICIADO, 20 REQUIERE_SUBSANACION_DOC) no se devuelve: en la versión 1,
 *   20 cae en PENDIENTE_SUBSANACION; en versiones > 1, 9 y 20 llegan como EVALUACION_SUBSANACIONES.
 *   Por eso la regla acepta esos valores agrupados y el backend decide el resto (409).
 * - `version`: «N.0» (protocol.entity.orm.ts `version`, versión más alta).
 */

/** Versión del protocolo a partir de «N.0» o N; null si no se puede leer. */
export function numeroVersionProtocolo(version: string | number | null | undefined): number | null {
  if (version === null || version === undefined) return null;
  const n = typeof version === 'number' ? version : parseInt(String(version), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export interface DatosSubidaSubsanacion {
  statusId: number | null | undefined;
  receptionStatus: string | null | undefined;
  version: string | number | null | undefined;
}

/**
 * v1: recepción en BORRADOR (INICIADO) o subsanación documental (aquí agrupada en PENDIENTE_SUBSANACION).
 * v2+: protocolo en 19 o 21 y recepción en subsanación (EVALUACION_SUBSANACIONES).
 * Sin versión legible no se permite la subida.
 */
export function puedeSubirDocumentoSubsanacion(datos: DatosSubidaSubsanacion): boolean {
  const version = numeroVersionProtocolo(datos.version);
  if (version === null) return false;

  if (version > 1) {
    const protocoloEnSubsanacion = datos.statusId === 19 || datos.statusId === 21;
    return protocoloEnSubsanacion && datos.receptionStatus === 'EVALUACION_SUBSANACIONES';
  }
  return datos.receptionStatus === 'BORRADOR' || datos.receptionStatus === 'PENDIENTE_SUBSANACION';
}
