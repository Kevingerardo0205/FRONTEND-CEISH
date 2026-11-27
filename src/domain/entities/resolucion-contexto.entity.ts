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
  puedeRegistrarResultado: boolean;
  puedeSubirCarta: boolean;
  motivo?: string | null;
  observaciones?: string | null;
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

export interface RegistrarResultadoBody {
  resultado: ResultadoPleno;
  motivo?: string;
  observaciones?: string;
  motivoCorreccion?: string;
}

export interface RegistrarCartaBody {
  claveArchivo: string;
  anexoCodigo: AnexoCarta;
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
 * Regla de convivencia con el flujo viejo (EP7): si alguna convocatoria del protocolo ya tiene
 * resultado del pleno, la resolución se hace desde la etapa Resolución y no desde el flujo viejo.
 */
export function tieneResultadoDelPleno(lista: readonly ConvocatoriaContexto[]): boolean {
  return lista.some((c) => c.resultado !== null);
}
