import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { ResolutionMapper } from '../mappers/resolution.mapper';

@Injectable({
  providedIn: 'root'
})
export class FrontendResolutionsService {
  private readonly resolutionRepo = inject(IResolutionRepositoryPort);

  /**
   * Envía una resolución de protocolo consolidada estructurada al backend,
   * mapeando y formateando las observaciones en un único campo.
   */
  createResolution(resolution: Partial<ResolutionEntity>): Observable<ResolutionEntity> {
    const payload = ResolutionMapper.toPayload(resolution);
    return this.resolutionRepo.submitResolution(payload).pipe(
      map(res => ResolutionMapper.toDomain(res))
    );
  }

  /**
   * Recupera las resoluciones de un protocolo y parsea el campo único de observaciones
   * a la estructura legible por los componentes visuales de frontend.
   */
  getResolutionByProtocolId(protocolId: string | number): Observable<ResolutionEntity[]> {
    return this.resolutionRepo.getResolutionByProtocolId(String(protocolId)).pipe(
      map(res => {
        const rawList = Array.isArray(res) ? res : [res];
        return rawList.map(item => ResolutionMapper.toDomain(item));
      })
    );
  }
}
