import { Injectable, inject } from '@angular/core';
import { defer, Observable, throwError } from 'rxjs';
import {
  RegistrarResultadoBody,
  ResultadoPleno,
  ValidacionResolucionError,
} from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';

export interface RegistrarResultadoEntrada {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  resultado: ResultadoPleno;
  motivo?: string;
  observaciones?: string;
  /** Si ya hay resultado registrado, la corrección exige motivo. */
  yaTieneResultado: boolean;
  motivoCorreccion?: string;
}

/** Ayuda de validación en el cliente. Devuelve el mensaje o null. La decisión final es del backend. */
export function validarResultado(entrada: RegistrarResultadoEntrada): string | null {
  if (entrada.resultado === 'NO_APROBADO' && !(entrada.motivo ?? '').trim()) {
    return 'Debe indicar el motivo del resultado «No aprobado».';
  }
  if (entrada.resultado === 'APROBADO_CON_CONDICION' && !(entrada.observaciones ?? '').trim()) {
    return 'Debe indicar las observaciones de la aprobación con condición.';
  }
  if (entrada.yaTieneResultado && !(entrada.motivoCorreccion ?? '').trim()) {
    return 'Debe indicar el motivo de la corrección del resultado.';
  }
  return null;
}

/** Solo envía los campos que aplican al resultado elegido. */
export function construirCuerpoResultado(entrada: RegistrarResultadoEntrada): RegistrarResultadoBody {
  const cuerpo: RegistrarResultadoBody = { resultado: entrada.resultado };
  if (entrada.resultado === 'NO_APROBADO') cuerpo.motivo = (entrada.motivo ?? '').trim();
  if (entrada.resultado === 'APROBADO_CON_CONDICION') {
    cuerpo.observaciones = (entrada.observaciones ?? '').trim();
  }
  if (entrada.yaTieneResultado) cuerpo.motivoCorreccion = (entrada.motivoCorreccion ?? '').trim();
  return cuerpo;
}

@Injectable({ providedIn: 'root' })
export class RegistrarResultadoPlenoUseCase {
  private readonly port = inject(IResolucionContextoPort);

  execute(entrada: RegistrarResultadoEntrada): Observable<void> {
    return defer(() => {
      const error = validarResultado(entrada);
      if (error) return throwError(() => new ValidacionResolucionError(error));
      return this.port.registrarResultado(
        entrada.convocatoriaId,
        entrada.convocatoriaProtocoloId,
        construirCuerpoResultado(entrada),
      );
    });
  }
}
