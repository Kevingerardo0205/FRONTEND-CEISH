import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IAuditRepositoryPort } from '../../domain/ports/audit-repository.port';
import { AuditLog, ProtocolTrailEvent } from '../../domain/entities/audit.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class AuditRepositoryAdapter implements IAuditRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getLogs(filters: any): Observable<AuditLog[]> {
    // Mock data
    return of([
      {
        id: '1',
        timestamp: new Date(),
        userId: 'u1',
        userName: 'Admin User',
        userRole: 'ADMIN',
        action: 'APPROVE',
        entity: 'Protocol',
        recordId: 'PRT-2024-001',
        ipAddress: '192.168.1.10',
        changes: {
          before: { status: 'PENDING' },
          after: { status: 'APPROVED' }
        }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000),
        userId: 'u2',
        userName: 'Secretary User',
        userRole: 'SECRETARIA',
        action: 'VALIDATE',
        entity: 'Protocol',
        recordId: 'PRT-2024-002',
        ipAddress: '192.168.1.11'
      }
    ]);
  }

  getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]> {
    return of([
      {
        id: 'e1',
        date: new Date('2026-04-07T10:30:00'),
        responsible: 'Investigador Principal',
        action: 'Creación de Protocolo',
        status: 'COMPLETED',
        integrityHash: 'sha256-abc...'
      },
      {
        id: 'e2',
        date: new Date('2026-04-08T14:15:00'),
        responsible: 'Secretaría CEISH',
        action: 'Validación Documental',
        status: 'COMPLETED',
        integrityHash: 'sha256-def...'
      },
      {
        id: 'e3',
        date: new Date('2026-04-09T09:00:00'),
        responsible: 'Presidencia CEISH',
        action: 'Asignación de Evaluadores',
        status: 'COMPLETED',
        integrityHash: 'sha256-ghi...'
      },
      {
        id: 'e4',
        date: new Date('2026-04-17T16:45:00'),
        responsible: 'Evaluador Externo A',
        action: 'Carga de Evaluación',
        status: 'CONDITIONED',
        comments: 'Se requieren correcciones en el consentimiento informado',
        integrityHash: 'sha256-jkl...'
      }
    ]);
  }
}
