import { Observable } from 'rxjs';
import { ResolutionEntity } from '../entities/resolution.entity';

export abstract class IResolutionRepositoryPort {
  /**
   * Envía una resolución para un protocolo.
   * POST /resolutions
   */
  abstract submitResolution(data: FormData): Observable<ResolutionEntity>;
}
