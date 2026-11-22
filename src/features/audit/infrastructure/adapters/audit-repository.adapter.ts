import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAuditRepositoryPort } from '../../domain/ports/audit-repository.port';
import { AuditLog, ProtocolTrailEvent, AuditFilters } from '../../domain/entities/audit.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';

interface AuditLogResponse {
  id: number | string;
  createdAt: string;
  userId: number | string;
  userName?: string;
  userRole?: string;
  action: string;
  recordId: number | string;
  ipAddress?: string;
  oldData?: unknown;
  newData?: unknown;
}

/**
 * F11 V11 (EP4): devuelve lo que manda el backend. Vacío → `[]`; error → error. Nunca registros ni
 * eventos de respaldo, para ningún rol. Sin huella armada en el frontend (V13).
 */
@Injectable({
  providedIn: 'root',
})
export class AuditRepositoryAdapter implements IAuditRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getLogs(filters: AuditFilters): Observable<AuditLog[]> {
    return this.apiClient.get<any>('/audit', filters).pipe(
      map((res) => {
        const raw: AuditLogResponse[] = Array.isArray(res) ? res : res?.data || [];
        const mapped = raw.map((log) => ({
          id: String(log.id),
          timestamp: new Date(log.createdAt),
          userId: String(log.userId),
          userName: log.userName || 'Sistema',
          userRole: log.userRole || 'SISTEMA',
          action: (log.action as AuditLog['action']) || 'UPDATE',
          entity: 'Protocol' as const,
          recordId: String(log.recordId),
          ipAddress: log.ipAddress || '',
          changes:
            log.newData || log.oldData
              ? {
                  before: log.oldData,
                  after: log.newData,
                }
              : undefined,
        }));
        return this.applyLocalFilters(mapped, filters);
      }),
    );
  }

  getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]> {
    return this.apiClient.get<any>(`/audit/protocol/${protocolId}`).pipe(
      map((res) => {
        const raw: AuditLogResponse[] = Array.isArray(res) ? res : res?.data || [];
        return raw.map((log) => ({
          id: String(log.id),
          date: new Date(log.createdAt),
          responsible: `${log.userName} (${log.userRole})`,
          action: this.formatActionLabel(log.action),
          status:
            log.action.includes('REJECT') || log.action.includes('INCOMPLETE')
              ? ('REJECTED' as const)
              : ('COMPLETED' as const),
          comments: log.newData ? JSON.stringify(log.newData) : undefined,
        }));
      }),
    );
  }

  private applyLocalFilters(logs: AuditLog[], filters: AuditFilters): AuditLog[] {
    let result = [...logs];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.recordId.toLowerCase().includes(q) ||
          l.ipAddress.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q),
      );
    }
    if (filters.action && filters.action.length > 0) {
      result = result.filter((l) => filters.action?.includes(l.action));
    }
    if (filters.entity && filters.entity.length > 0) {
      result = result.filter((l) => filters.entity?.includes(l.entity));
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      result = result.filter((l) => new Date(l.timestamp).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      result = result.filter((l) => new Date(l.timestamp).getTime() <= end);
    }
    return result;
  }

  private formatActionLabel(action: string): string {
    switch (action.toUpperCase()) {
      case 'PROTOCOL_CREATED':
        return 'Creación de Protocolo';
      case 'PROTOCOL_SUBMITTED':
        return 'Envío para Revisión';
      case 'PROTOCOL_TIMELINE_ACCEPTED':
        return 'Aceptación de Plazos';
      case 'DOCUMENT_UPLOADED':
        return 'Carga de Documento';
      case 'RECEPTION_STARTED':
        return 'Inicio de Recepción';
      case 'REQUIREMENTS_VERIFIED':
        return 'Requisitos Verificados';
      case 'RECEPTION_FINALIZED':
        return 'Recepción Finalizada';
      case 'DOCUMENT_VALIDATED':
        return 'Validación de Documento';
      case 'REQUIREMENT_STATUS_UPDATED':
        return 'Estado de Requisito Actualizado';
      case 'PEER_EVALUATORS_ASSIGNED':
        return 'Asignación de Evaluadores';
      case 'PEER_RISK_SUBMITTED':
        return 'Definición de Nivel de Riesgo';
      case 'EVALUATION_SUBMITTED':
        return 'Evaluación Registrada';
      case 'RESOLUTION_CREATED':
        return 'Emisión de Dictamen';
      default:
        return action.replace(/_/g, ' ');
    }
  }
}
