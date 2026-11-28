/** Resultados del pleno (spec-003 RF-17.1). SUSPENDIDO no es resultado del pleno. */
export const RESULTADOS_PLENO = [
  'APROBADO_DEFINITIVO',
  'APROBADO_CON_CONDICION',
  'NO_APROBADO',
] as const;
export type ResultadoPleno = (typeof RESULTADOS_PLENO)[number];

/** Anexos de la carta firmada (spec-003 RF-17.4). */
export const ANEXOS_CARTA = ['ANEXO_13', 'ANEXO_14', 'ANEXO_15', 'ANEXO_16'] as const;
export type AnexoCarta = (typeof ANEXOS_CARTA)[number];

/** Estado del resultado del pleno de una convocatoria (backend RF-17.1 v1.6.8 y RF-17.2 v1.6.9). */
export type EstadoResultado = 'PENDIENTE' | 'CALCULADO' | 'CONGELADO' | 'RESUELTO_LEGACY';

/** Conteos por dictamen de una convocatoria. Solo conteos: nunca nombres de evaluadores (B8). */
export interface ResumenDictamenes {
  aprobado: number;
  conCondicion: number;
  noAprobado: number;
  pendientes: number;
}

/** Carta vigente de una convocatoria, tal como la entrega el contexto de resolución. */
export interface CartaVigente {
  numeroVersion: number;
  anexoCodigo: AnexoCarta;
  subidoEn: string;
  /** Clave para /storage/download-url. Solo viene dentro de `cartaVigente`. */
  claveArchivo: string;
}

/**
 * Una convocatoria del protocolo en la etapa Resolución (TSK-015-N25).
 * `motivo` y `observaciones` solo llegan a quien tiene RESOLUCION_HISTORIAL (undefined si no).
 */
export interface ConvocatoriaContexto {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  numeroConvocatoria: string;
  fechaReunion: string | null;
  versionEvaluada: number;
  resultado: ResultadoPleno | null;
  anexoEsperado: AnexoCarta | null;
  cartaVigente: CartaVigente | null;
  puedeSubirCarta: boolean;
  /** Calculado en el backend. Nunca se muestra en la etapa salvo a quien tiene RESOLUCION_HISTORIAL. */
  estadoResultado: EstadoResultado;
  /** Resultado calculado en este momento (null si está pendiente o el protocolo es legacy). */
  resultadoCalculado: ResultadoPleno | null;
  /** Bloqueo del flujo anterior: la resolución legacy existe y no hay carta para esta convocatoria. */
  resolucionAnterior: { tipoResolucionId: number | null } | null;
  /** Número de la convocatoria donde se resolvió la versión (con carta); null si no hay carta. */
  resueltoEnConvocatoria: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  /** Solo para quien tiene RESOLUCION_HISTORIAL. */
  resumenDictamenes?: ResumenDictamenes;
}

/** Una versión del historial de cartas (GET …/cartas, solo RESOLUCION_HISTORIAL). */
export interface CartaVersion {
  id: string;
  numeroVersion: number;
  resultado: ResultadoPleno;
  anexoCodigo: AnexoCarta;
  claveArchivo?: string;
  vigente: boolean;
  motivoReemplazo?: string | null;
  subidoPor?: number;
  subidoEn: string;
}

/** Respuesta de POST …/cartas/upload-url. */
export interface SubidaCarta {
  uploadUrl: string;
  claveArchivo: string;
  anexoCodigo: AnexoCarta;
  numeroVersion: number;
}

/** Cuerpo de POST …/cartas. El anexo lo deriva el backend: el cliente no lo envía. */
export interface RegistrarCartaBody {
  claveArchivo: string;
  motivoReemplazo?: string;
}

/**
 * Error de validación de ayuda en el cliente (antes de llamar al backend).
 * El mensaje es el que se muestra al usuario; la decisión final es del backend.
 */
export class ValidacionResolucionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidacionResolucionError';
  }
}

/**
 * Regla de convivencia con el flujo viejo (EP7, decisión del 27/11/2026): el flujo viejo se oculta
 * si alguna convocatoria del protocolo está gestionada por la etapa Resolución, es decir, si su
 * estado no es RESUELTO_LEGACY (PENDIENTE también oculta el flujo viejo). Lista vacía: flujo viejo visible.
 */
export function gestionadoPorFlujoNuevo(lista: readonly ConvocatoriaContexto[]): boolean {
  return lista.some((c) => c.estadoResultado !== 'RESUELTO_LEGACY');
}
