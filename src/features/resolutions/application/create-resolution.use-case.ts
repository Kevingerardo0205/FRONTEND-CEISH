import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { FrontendResolutionsService } from '@infrastructure/services/frontend-resolutions.service';
import { ResolutionEntity } from '@domain/entities/resolution.entity';

@Injectable({
  providedIn: 'root'
})
export class CreateResolutionUseCase {
  private readonly resolutionsService = inject(FrontendResolutionsService);

  /**
   * Ejecuta el caso de uso validando las reglas de negocio en el frontend 
   * antes de enviar la resolución al backend.
   */
  execute(resolution: Partial<ResolutionEntity>): Observable<ResolutionEntity> {
    if (!resolution.protocolId) {
      return throwError(() => new Error('El ID de protocolo es obligatorio.'));
    }

    if (!resolution.resolutionTypeId) {
      return throwError(() => new Error('El tipo de resolución es obligatorio.'));
    }

    const typeId = Number(resolution.resolutionTypeId);

    // Reglas funcionales por tipo
    if (typeId === 1) {
      if (!resolution.observations || resolution.observations.trim() === '') {
        return throwError(() => new Error('Las observaciones del comité son obligatorias para la aprobación definitiva.'));
      }
    } else if (typeId === 2) {
      if (!resolution.majorObservations || resolution.majorObservations.trim() === '') {
        return throwError(() => new Error('Las observaciones mayores son obligatorias para la aprobación condicional.'));
      }
      if (!resolution.correctionProcedure || resolution.correctionProcedure.trim() === '') {
        return throwError(() => new Error('El procedimiento de subsanación es obligatorio para la aprobación condicional.'));
      }
    } else if (typeId === 3) {
      if (!resolution.majorObservations || resolution.majorObservations.trim() === '') {
        return throwError(() => new Error('La justificación del rechazo es obligatoria.'));
      }
      if (resolution.majorObservations.trim().length < 20) {
        return throwError(() => new Error('La justificación del rechazo debe tener al menos 20 caracteres.'));
      }
    } else {
      return throwError(() => new Error('El tipo de resolución no es válido.'));
    }

    return this.resolutionsService.createResolution(resolution);
  }
}
