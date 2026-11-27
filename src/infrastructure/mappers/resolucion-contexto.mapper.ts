import {
  AnexoCarta,
  CartaVersion,
  ConvocatoriaContexto,
  EstadoResultado,
  ResultadoPleno,
  ResumenDictamenes,
  SubidaCarta,
  ValidacionResolucionError,
} from '@domain/entities/resolucion-contexto.entity';

export const MENSAJE_SIN_PERMISO = 'No cuenta con permiso para realizar esta acción.';
export const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.';
export const MENSAJE_INESPERADO = 'Ocurrió un error inesperado. Intente nuevamente.';

interface CartaVigenteApi {
  numeroVersion: number;
  anexoCodigo: AnexoCarta;
  subidoEn: string;
  claveArchivo: string;
}

/** Forma cruda de una convocatoria en la respuesta del backend (TSK-015-N25). */
export interface ConvocatoriaApi {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  numeroConvocatoria: string;
  fechaReunion: string | null;
  versionEvaluada: number;
  resultado: ResultadoPleno | null;
  anexoEsperado: AnexoCarta | null;
  cartaVigente: CartaVigenteApi | null;
  puedeRegistrarResultado: boolean;
  puedeSubirCarta: boolean;
  estadoResultado: EstadoResultado;
  resultadoCalculado: ResultadoPleno | null;
  resolucionAnterior: { tipoResolucionId: number | null } | null;
  resueltoEnConvocatoria: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  resumenDictamenes?: ResumenDictamenes;
}

/** La respuesta llega envuelta en `data` por el ResponseInterceptor, o sin envoltura. */
export function desenvolver<T>(respuesta: { data?: T } | T): T {
  if (respuesta && typeof respuesta === 'object' && 'data' in respuesta && respuesta.data !== undefined) {
    return (respuesta as { data: T }).data;
  }
  return respuesta as T;
}

/** Copia la lista tal como la entrega el backend, sin inventar valores. Conserva el orden. */
export function mapConvocatoriasContexto(raw: readonly ConvocatoriaApi[]): ConvocatoriaContexto[] {

  return raw.map((c) => {
    const base: ConvocatoriaContexto = {
      convocatoriaId: c.convocatoriaId,
      convocatoriaProtocoloId: c.convocatoriaProtocoloId,
      numeroConvocatoria: c.numeroConvocatoria,
      fechaReunion: c.fechaReunion,
      versionEvaluada: c.versionEvaluada,
      resultado: c.resultado,
      anexoEsperado: c.anexoEsperado,
      cartaVigente: c.cartaVigente
        ? {
            numeroVersion: c.cartaVigente.numeroVersion,
            anexoCodigo: c.cartaVigente.anexoCodigo,
            subidoEn: c.cartaVigente.subidoEn,
            claveArchivo: c.cartaVigente.claveArchivo,
          }
        : null,
      puedeRegistrarResultado: c.puedeRegistrarResultado === true,
      puedeSubirCarta: c.puedeSubirCarta === true,
      estadoResultado: c.estadoResultado,
      resultadoCalculado: c.resultadoCalculado,
      resolucionAnterior: c.resolucionAnterior
        ? { tipoResolucionId: c.resolucionAnterior.tipoResolucionId }
        : null,
      resueltoEnConvocatoria: c.resueltoEnConvocatoria,
    };
    // motivo, observaciones y resumen solo existen para quien tiene RESOLUCION_HISTORIAL.
    if ('motivo' in c) base.motivo = c.motivo ?? null;
    if ('observaciones' in c) base.observaciones = c.observaciones ?? null;
    if (c.resumenDictamenes) {
      base.resumenDictamenes = {
        aprobado: c.resumenDictamenes.aprobado,
        conCondicion: c.resumenDictamenes.conCondicion,
        noAprobado: c.resumenDictamenes.noAprobado,
        pendientes: c.resumenDictamenes.pendientes,
      };
    }
    return base;
  });
}

export function mapSubidaCarta(raw: SubidaCarta): SubidaCarta {
  return {
    uploadUrl: raw.uploadUrl,
    claveArchivo: raw.claveArchivo,
    anexoCodigo: raw.anexoCodigo,
    numeroVersion: raw.numeroVersion,
  };
}

export function mapHistorialCartas(raw: readonly CartaVersion[]): CartaVersion[] {
  return raw.map((v) => ({ ...v }));
}

/**
 * Mensaje para el usuario según el error HTTP. 400/404/409 se muestran tal cual (texto del backend);
 * 403 y red tienen mensaje propio. Nunca se inserta HTML: el texto va por interpolación.
 */
export function mensajeDeErrorResolucion(error: unknown): string {
  if (error instanceof ValidacionResolucionError) return error.message;
  const e = error as { status?: number; error?: { message?: unknown } } | null;
  const status = e?.status;
  if (status === 0) return MENSAJE_SIN_CONEXION;
  if (status === 403) return MENSAJE_SIN_PERMISO;
  if (status === 400 || status === 404 || status === 409) {
    const mensaje = e?.error?.message;
    if (Array.isArray(mensaje) && mensaje.length > 0) return mensaje.join(' ');
    if (typeof mensaje === 'string' && mensaje.trim() !== '') return mensaje;
  }
  return MENSAJE_INESPERADO;
}
