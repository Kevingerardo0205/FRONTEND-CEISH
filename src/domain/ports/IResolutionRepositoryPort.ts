import { Observable } from 'rxjs';
import { ResolutionEntity } from '../entities/resolution.entity';

export abstract class IResolutionRepositoryPort {
  /**
   * Envía una resolución para un protocolo.
   * POST /resolutions
   */
  abstract submitResolution(data: any): Observable<ResolutionEntity>;

  /**
   * Obtiene la resolución asociada a un protocolo.
   * GET /resolutions/protocol/:protocolId
   */
  abstract getResolutionByProtocolId(protocolId: string): Observable<any>;
}
