import { Observable } from 'rxjs';
import { ResolutionEntity } from '../entities/resolution.entity';

export abstract class IResolutionRepositoryPort {
  abstract submitResolution(data: Partial<ResolutionEntity>): Observable<ResolutionEntity>;
  abstract getResolutionByProtocolId(protocolId: string): Observable<ResolutionEntity | null>;
}
