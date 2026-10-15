import { Observable } from 'rxjs';
import { AuditLog, ProtocolTrailEvent, AuditFilters } from '../entities/audit.entity';

export abstract class IAuditRepositoryPort {
  abstract getLogs(filters: AuditFilters): Observable<AuditLog[]>;
  abstract getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]>;
}
