import { Injectable, inject } from '@angular/core';
import { AuditRepositoryAdapter } from '../../infrastructure/adapters/audit-repository.adapter';

@Injectable({
  providedIn: 'root'
})
export class AuditUseCase {
  private readonly auditRepo = inject(AuditRepositoryAdapter);

  getLogs(filters: any) {
    return this.auditRepo.getLogs(filters);
  }

  getProtocolTrail(protocolId: string) {
    return this.auditRepo.getProtocolTrail(protocolId);
  }
}
