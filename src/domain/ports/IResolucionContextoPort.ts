import { Observable } from 'rxjs';
import {
  CartaVersion,
  ConvocatoriaContexto,
  RegistrarCartaBody,
  SubidaCarta,
} from '../entities/resolucion-contexto.entity';

/** Etapa Resolución: contexto y cartas firmadas (EP7). El resultado del pleno lo calcula el backend. */
export abstract class IResolucionContextoPort {
  /** GET /resolutions/protocol/:id/contexto. Lista ordenada: la primera es la convocatoria más reciente. */
  abstract obtenerContexto(protocolId: string): Observable<ConvocatoriaContexto[]>;
  /** POST …/cartas/upload-url: emite la URL firmada y la clave. No registra nada. Sin cuerpo: el anexo lo deriva el backend. */
  abstract solicitarSubida(convocatoriaId: string, convocatoriaProtocoloId: string): Observable<SubidaCarta>;
  /** PUT a la URL firmada, sin token de la sesión y con Content-Type application/pdf. */
  abstract subirArchivo(uploadUrl: string, archivo: File): Observable<void>;
  /** POST …/cartas: registra la versión subida. */
  abstract registrarCarta(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    cuerpo: RegistrarCartaBody,
  ): Observable<void>;
  /** GET …/cartas: historial de versiones (solo RESOLUCION_HISTORIAL). */
  abstract listarCartas(convocatoriaId: string, convocatoriaProtocoloId: string): Observable<CartaVersion[]>;
  /** POST /storage/download-url: URL firmada de descarga para una clave de carta. */
  abstract urlDescargaCarta(claveArchivo: string): Observable<string>;
}
