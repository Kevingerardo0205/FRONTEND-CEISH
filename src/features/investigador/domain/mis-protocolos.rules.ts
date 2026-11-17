import { Stage } from '@domain/value-objects/stage.vo';
import { estadoById } from '@shared/utils/estado.resolver';
import { fechaCalendario, fechaEcuador } from '@shared/utils/fecha-ecuador.util';
import { ProtocolUI } from '@shared/utils/protocol-ui.util';
import { ProtocoloResumen, RequisitoResumen } from './dtos/crear-protocolo.dto';

/**
 * Reglas de presentación de Mis protocolos (F09 D21 a D26, MP1). Funciones puras: no
 * dependen de Angular ni del reloj (el instante "ahora" llega como argumento).
 */

/** Tarjetas de `Necesita su acción`, en el orden en que se muestran (D21). */
export type TipoAccion = 'borrador' | 'tiempos' | 'observaciones' | 'correcciones';

const ORDEN_ACCION: readonly TipoAccion[] = ['borrador', 'tiempos', 'observaciones', 'correcciones'];

export interface ProtocoloConAccion {
  readonly protocolo: ProtocoloResumen;
  readonly tipo: TipoAccion;
}

export interface MisProtocolosAgrupados {
  readonly accion: readonly ProtocoloConAccion[];
  readonly comite: readonly ProtocoloResumen[];
  readonly archivados: readonly ProtocoloResumen[];
}

/** Texto de respaldo del error al aceptar los tiempos (el mismo de F10 D15). */
export const ACEPTAR_TIEMPOS_ERROR = 'No pudimos registrar su aceptación. Intente de nuevo.';

/** Estados de D16: ya no faltan / no cuentan en M. */
const REQUISITOS_PRESENTADOS = ['PRESENTADO', 'APROBADO'];
const REQUISITO_NO_APLICA = 'NO_APLICA';
const REQUISITO_OBSERVADO = 'RECHAZADO';

/**
 * Tarjeta de `Necesita su acción` según `receptionStatus` (D21), o null si el protocolo va a
 * otra sección. Un `COMPLETO` aceptado en esta visita sigue con su tarjeta hasta recargar (D23).
 */
export function tipoDeAccion(p: ProtocoloResumen, aceptadoEnEstaVisita: boolean): TipoAccion | null {
  switch (String(p.estado).toUpperCase()) {
    case 'BORRADOR':
      return 'borrador';
    case 'COMPLETO':
      return !p.isTimelineTermsAccepted || aceptadoEnEstaVisita ? 'tiempos' : null;
    case 'INCOMPLETO':
      return 'observaciones';
    case 'EVALUACION_SUBSANACIONES':
    case 'PENDIENTE_SUBSANACION':
      return 'correcciones';
    default:
      return null;
  }
}

/** Reparte la lista en las tres secciones (D21); conserva el orden del backend en cada grupo. */
export function agruparMisProtocolos(
  lista: readonly ProtocoloResumen[],
  aceptadosEnEstaVisita: ReadonlySet<number>,
): MisProtocolosAgrupados {
  const accion: ProtocoloConAccion[] = [];
  const comite: ProtocoloResumen[] = [];
  const archivados: ProtocoloResumen[] = [];
  for (const protocolo of lista) {
    const tipo = tipoDeAccion(protocolo, aceptadosEnEstaVisita.has(protocolo.id));
    if (tipo) accion.push({ protocolo, tipo });
    else if (String(protocolo.estado).toUpperCase() === 'ARCHIVADO') archivados.push(protocolo);
    else comite.push(protocolo);
  }
  // sort es estable: dentro de cada tipo queda el orden del backend.
  accion.sort((a, b) => ORDEN_ACCION.indexOf(a.tipo) - ORDEN_ACCION.indexOf(b.tipo));
  return { accion, comite, archivados };
}

/** `{N} de {M} documentos subidos · …` de la tarjeta Borrador (D22, regla de D16). */
export function textoDocumentosBorrador(checklist: readonly RequisitoResumen[] | undefined): string {
  const requisitos = (checklist ?? []).filter((r) => r.status !== REQUISITO_NO_APLICA);
  const total = requisitos.length;
  if (total === 0) return 'Sin código hasta que la Secretaría lo reciba';
  const presentados = requisitos.filter((r) => REQUISITOS_PRESENTADOS.includes(r.status)).length;
  const nombre = total === 1 ? 'documento subido' : 'documentos subidos';
  return `${presentados} de ${total} ${nombre} · sin código hasta que la Secretaría lo reciba`;
}

/** Texto de los documentos observados (filas `RECHAZADO`) de la tarjeta Con observaciones (D22). */
export function textoObservados(checklist: readonly RequisitoResumen[] | undefined): string {
  const observados = (checklist ?? []).filter((r) => r.status === REQUISITO_OBSERVADO).length;
  if (observados === 0) return 'La Secretaría pidió completar la documentación.';
  if (observados === 1) return 'La Secretaría observó 1 documento.';
  return `La Secretaría observó ${observados} documentos.`;
}

/** `Corrija hasta el {dd/MM/yyyy}.` con la fecha sin hora del backend, o null si no es válida (D22). */
export function textoPlazoCorreccion(submissionDeadline: string | null | undefined): string | null {
  const fecha = fechaCalendario(submissionDeadline);
  return fecha ? `Corrija hasta el ${fecha}.` : null;
}

/** El usuario es el investigador principal del protocolo (D23). */
export function esInvestigadorPrincipal(p: ProtocoloResumen, usuarioId: number | null): boolean {
  return usuarioId !== null && p.principalInvestigatorId === usuarioId;
}

/**
 * Fecha de la aceptación en hora de Ecuador (D23): `timelineTermsAcceptedAt` de la respuesta
 * (con o sin el sobre `data`) o, si no viene, el instante de la respuesta.
 */
export function fechaAceptacion(respuesta: unknown, ahora: Date): string {
  const iso = leerFechaAceptacion(respuesta) ?? leerFechaAceptacion(leerCampo(respuesta, 'data'));
  return fechaEcuador(iso) ?? fechaEcuador(ahora.toISOString()) ?? '';
}

export function textoAceptacion(fecha: string): string {
  return `Aceptó los tiempos el ${fecha}. La Presidenta asignará a los pares evaluadores.`;
}

export interface FilaComite {
  /** Etiqueta de la etapa (`Recepción`, `Asignación`, …) o null si es nula o desconocida. */
  readonly etapa: string | null;
  readonly linea: string;
}

/** Línea de estado y etapa de una fila de `En el comité` (D24). */
export function filaComite(p: ProtocoloResumen): FilaComite {
  const etapa = etapaDe(p.etapa);
  const etiquetaEstado = etiquetaExistente(p);
  switch (etapa?.code) {
    case 'RECEPCION':
      return { etapa: etapa.label, linea: 'Esperando la revisión de la Secretaría' };
    case 'ASIGNACION':
      return { etapa: etapa.label, linea: 'La Presidenta asignará a los pares evaluadores' };
    case 'EVALUACION':
      return { etapa: etapa.label, linea: 'En revisión por sus pares evaluadores' };
    default:
      return { etapa: etapa?.label ?? null, linea: etiquetaEstado };
  }
}

/**
 * Chip de la tarjeta de correcciones (D2, D21): la etiqueta de la recepción, no la del protocolo
 * (una subsanación de versión tiene el protocolo en 21, `Control Documental`).
 * `EVALUACION_SUBSANACIONES` → `Correcciones sin enviar`.
 */
export function etiquetaRecepcion(p: ProtocoloResumen): string {
  return ProtocolUI.label(p.estado);
}

/** Etiqueta de estado que ya existe (`ProtocolUI`): la del protocolo y, sin ella, la de la recepción. */
export function etiquetaExistente(p: ProtocoloResumen): string {
  return ProtocolUI.label(estadoById(p.statusId)?.code ?? p.estado);
}

/** `versionNumber` desde `currentVersion` (D26, T09-6); si no es un entero > 0, 1. */
export function numeroDeVersion(currentVersion: unknown): number {
  return typeof currentVersion === 'number' && Number.isInteger(currentVersion) && currentVersion > 0
    ? currentVersion
    : 1;
}

function etapaDe(codigo: string | null | undefined): Stage | null {
  try {
    return Stage.fromBackend(codigo);
  } catch {
    return null;
  }
}

function leerCampo(valor: unknown, campo: string): unknown {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>)[campo] : undefined;
}

function leerFechaAceptacion(valor: unknown): string | null {
  const fecha = leerCampo(valor, 'timelineTermsAcceptedAt');
  return typeof fecha === 'string' ? fecha : null;
}
