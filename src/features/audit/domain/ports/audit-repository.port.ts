import { Observable } from 'rxjs';
import { AuditLog, ProtocolTrailEvent } from '../entities/audit.entity';

export abstract class IAuditRepositoryPort {
  abstract getLogs(filters: any): Observable<AuditLog[]>;
  abstract getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]>;
}
