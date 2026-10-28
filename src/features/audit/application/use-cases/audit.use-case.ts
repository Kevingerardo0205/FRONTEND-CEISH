import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAuditRepositoryPort } from '../../domain/ports/audit-repository.port';
import { AuditLog, ProtocolTrailEvent, AuditFilters } from '../../domain/entities/audit.entity';

@Injectable({
  providedIn: 'root',
})
export class AuditUseCase {
  private readonly auditRepo = inject(IAuditRepositoryPort);

  getLogs(filters: AuditFilters): Observable<AuditLog[]> {
    return this.auditRepo.getLogs(filters);
  }

  getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]> {
    return this.auditRepo.getProtocolTrail(protocolId);
  }
}
