import { Injectable, inject } from '@angular/core';
import { defer, Observable, switchMap, throwError } from 'rxjs';
import { ValidacionResolucionError } from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';

/** Tamaño máximo de la carta: 10 MB (ayuda del cliente; el backend decide). */
export const TAMANO_MAXIMO_CARTA_BYTES = 10 * 1024 * 1024;

export interface SubirCartaEntrada {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  archivo: File;
  /** true si la convocatoria ya tiene carta vigente: el reemplazo exige motivo. */
  hayCartaVigente: boolean;
  motivoReemplazo?: string;
}

/** Ayuda de validación del archivo: solo PDF y como máximo 10 MB. Devuelve el mensaje o null. */
export function validarArchivoCarta(archivo: Pick<File, 'name' | 'type' | 'size'>): string | null {
  const esPdf =
    archivo.type === 'application/pdf' || (archivo.type === '' && /\.pdf$/i.test(archivo.name));
  if (!esPdf) return 'Solo se admiten archivos PDF.';
  if (archivo.size > TAMANO_MAXIMO_CARTA_BYTES) return 'El archivo no puede superar 10 MB.';
  return null;
}

/**
 * Subida de la carta en tres pasos: upload-url → PUT a S3 → POST cartas.
 * Si un paso falla, los siguientes no se ejecutan (nada se registra sin el archivo subido).
 */
@Injectable({ providedIn: 'root' })
export class SubirCartaFirmadaUseCase {
  private readonly port = inject(IResolucionContextoPort);

  execute(entrada: SubirCartaEntrada): Observable<void> {
    return defer(() => {
      const errorArchivo = validarArchivoCarta(entrada.archivo);
      if (errorArchivo) return throwError(() => new ValidacionResolucionError(errorArchivo));

      const motivo = (entrada.motivoReemplazo ?? '').trim();
      if (entrada.hayCartaVigente && motivo === '') {
        return throwError(
          () => new ValidacionResolucionError('Debe indicar el motivo del reemplazo de la carta vigente.'),
        );
      }

      const { convocatoriaId, convocatoriaProtocoloId, archivo } = entrada;
      return this.port.solicitarSubida(convocatoriaId, convocatoriaProtocoloId).pipe(
        switchMap((subida) =>
          this.port.subirArchivo(subida.uploadUrl, archivo).pipe(
            switchMap(() =>
              this.port.registrarCarta(convocatoriaId, convocatoriaProtocoloId, {
                claveArchivo: subida.claveArchivo,
                ...(entrada.hayCartaVigente ? { motivoReemplazo: motivo } : {}),
              }),
            ),
          ),
        ),
      );
    });
  }
}
