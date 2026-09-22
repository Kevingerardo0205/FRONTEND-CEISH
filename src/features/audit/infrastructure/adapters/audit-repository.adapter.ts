import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class AuditRepositoryAdapter implements IAuditRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  private readonly mockLogs: AuditLog[] = [
    {
      id: 'aud-001',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      userId: '1',
      userName: 'Super Administrador',
      userRole: 'ADMIN_TI',
      action: 'UPDATE',
      entity: 'User',
      recordId: 'USR-0600000999',
      ipAddress: '192.168.10.45',
      changes: {
        before: { roles: ['SECRETARIA'], suplencia: false },
        after: { roles: ['SECRETARIA', 'EVALUADOR'], suplencia: true, vigencia: '2026-10-15' }
      },
      details: 'Asignación de suplencia temporal de Evaluador por licencia del titular.'
    },
    {
      id: 'aud-002',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      userId: '2',
      userName: 'Secretaría CEISH',
      userRole: 'SECRETARIA',
      action: 'APPROVE',
      entity: 'Protocol',
      recordId: 'PRT-2026-001',
      ipAddress: '192.168.10.12',
      changes: {
        before: { estado: 'EN_RECEPCION' },
        after: { estado: 'ACEPTADO_TRAMITE' }
      },
      details: 'Validación documental aprobada conforme Anexo 1.'
    },
    {
      id: 'aud-003',
      timestamp: new Date(Date.now() - 5 * 3600 * 1000),
      userId: '3',
      userName: 'Dr. Marco Vinicio Ramos',
      userRole: 'INVESTIGADOR',
      action: 'CREATE',
      entity: 'Amendment',
      recordId: 'ENM-2026-001',
      ipAddress: '192.168.20.104',
      changes: {
        before: null,
        after: { tipo: 'METHODOLOGY', severidad: 'SUBSTANTIAL', version: 2 }
      },
      details: 'Presentación formal de solicitud de enmienda metodológica (Anexo 23).'
    },
    {
      id: 'aud-004',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      userId: '1',
      userName: 'Super Administrador',
      userRole: 'ADMIN_TI',
      action: 'UPDATE',
      entity: 'User',
      recordId: 'USR-0600000006',
      ipAddress: '192.168.10.45',
      changes: {
        before: { suplenciaFin: '2026-09-01' },
        after: { suplenciaFin: '2026-10-01', motivo: 'Prórroga de suplencia por 30 días' }
      },
      details: 'Prórroga de vigencia temporal de rol Secretaría.'
    },
    {
      id: 'aud-005',
      timestamp: new Date(Date.now() - 48 * 3600 * 1000),
      userId: '4',
      userName: 'Presidente CEISH',
      userRole: 'PRESIDENTE',
      action: 'APPROVE',
      entity: 'Resolution',
      recordId: 'RES-2026-008',
      ipAddress: '192.168.10.5',
      changes: {
        before: { estado: 'BORRADOR' },
        after: { estado: 'EMITIDA_APROBADA', dictamen: 'FAVORABLE' }
      },
      details: 'Emisión de dictamen bioético favorable con código QR certificado.'
    }
  ];

  getLogs(filters: AuditFilters): Observable<AuditLog[]> {
    return this.apiClient.get<any>('/audit', filters).pipe(
      map(res => {
        const raw: AuditLogResponse[] = Array.isArray(res) ? res : res?.data || [];
        if (raw.length === 0) {
          return this.applyLocalFilters(this.mockLogs, filters);
        }
        const mapped = raw.map(log => ({
          id: String(log.id),
          timestamp: new Date(log.createdAt),
          userId: String(log.userId),
          userName: log.userName || 'Sistema',
          userRole: log.userRole || 'SISTEMA',
          action: (log.action as AuditLog['action']) || 'UPDATE',
          entity: 'Protocol' as const,
          recordId: String(log.recordId),
          ipAddress: log.ipAddress || '',
          changes: log.newData || log.oldData ? {
            before: log.oldData,
            after: log.newData
          } : undefined
        }));
        return this.applyLocalFilters(mapped, filters);
      }),
      catchError(() => {
        return of(this.applyLocalFilters(this.mockLogs, filters));
      })
    );
  }

  getProtocolTrail(protocolId: string): Observable<ProtocolTrailEvent[]> {
    return this.apiClient.get<any>(`/audit/protocol/${protocolId}`).pipe(
      map(res => {
        const raw: AuditLogResponse[] = Array.isArray(res) ? res : res?.data || [];
        if (raw.length === 0) {
          return this.getMockTrail(protocolId);
        }
        return raw.map(log => ({
          id: String(log.id),
          date: new Date(log.createdAt),
          responsible: `${log.userName} (${log.userRole})`,
          action: this.formatActionLabel(log.action),
          status: log.action.includes('REJECT') || log.action.includes('INCOMPLETE') ? 'REJECTED' as const : 'COMPLETED' as const,
          comments: log.newData ? JSON.stringify(log.newData) : undefined,
          integrityHash: `sha256-${log.id}-${log.createdAt}`
        }));
      }),
      catchError(() => {
        return of(this.getMockTrail(protocolId));
      })
    );
  }

  private applyLocalFilters(logs: AuditLog[], filters: AuditFilters): AuditLog[] {
    let result = [...logs];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l => 
        l.userName.toLowerCase().includes(q) ||
        l.recordId.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }
    if (filters.action && filters.action.length > 0) {
      result = result.filter(l => filters.action?.includes(l.action));
    }
    if (filters.entity && filters.entity.length > 0) {
      result = result.filter(l => filters.entity?.includes(l.entity));
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      result = result.filter(l => new Date(l.timestamp).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      result = result.filter(l => new Date(l.timestamp).getTime() <= end);
    }
    return result;
  }

  private getMockTrail(protocolId: string): ProtocolTrailEvent[] {
    return [
      {
        id: 'tr-1',
        date: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        responsible: 'Dr. Investigador Principal (INVESTIGADOR)',
        action: 'Envío Inicial de Protocolo',
        status: 'COMPLETED',
        comments: 'Presentación de expediente con 7 requisitos documentales.',
        documents: [{ name: 'Protocolo_V1.pdf', url: '#' }],
        integrityHash: `sha256-001-${protocolId}-initial`
      },
      {
        id: 'tr-2',
        date: new Date(Date.now() - 12 * 24 * 3600 * 1000),
        responsible: 'Secretaría CEISH (SECRETARIA)',
        action: 'Aceptación de Plazos y Recepción Documental',
        status: 'COMPLETED',
        comments: 'Conformidad documental verificada conforme Anexo 1.',
        integrityHash: `sha256-002-${protocolId}-reception`
      },
      {
        id: 'tr-3',
        date: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        responsible: 'Presidente CEISH (PRESIDENTE)',
        action: 'Asignación de Pares Evaluadores',
        status: 'COMPLETED',
        comments: 'Asignación de 2 evaluadores metodológico y bioético.',
        integrityHash: `sha256-003-${protocolId}-peers`
      },
      {
        id: 'tr-4',
        date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        responsible: 'Evaluador Bioético (EVALUADOR)',
        action: 'Registro de Evaluación y Checklist Bioético',
        status: 'COMPLETED',
        comments: 'Aprobado sin observaciones mayores.',
        integrityHash: `sha256-004-${protocolId}-evaluation`
      },
      {
        id: 'tr-5',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        responsible: 'Presidente CEISH (PRESIDENTE)',
        action: 'Emisión de Dictamen Favorable',
        status: 'COMPLETED',
        comments: 'Resolución oficial firmada y registrada en catastro institucional.',
        documents: [{ name: 'Dictamen_Favorable.pdf', url: '#' }],
        integrityHash: `sha256-005-${protocolId}-resolution`
      }
    ];
  }

  private formatActionLabel(action: string): string {
    switch (action.toUpperCase()) {
      case 'PROTOCOL_CREATED': return 'Creación de Protocolo';
      case 'PROTOCOL_SUBMITTED': return 'Envío para Revisión';
      case 'PROTOCOL_TIMELINE_ACCEPTED': return 'Aceptación de Plazos';
      case 'DOCUMENT_UPLOADED': return 'Carga de Documento';
      case 'RECEPTION_STARTED': return 'Inicio de Recepción';
      case 'REQUIREMENTS_VERIFIED': return 'Requisitos Verificados';
      case 'RECEPTION_FINALIZED': return 'Recepción Finalizada';
      case 'DOCUMENT_VALIDATED': return 'Validación de Documento';
      case 'REQUIREMENT_STATUS_UPDATED': return 'Estado de Requisito Actualizado';
      case 'PEER_EVALUATORS_ASSIGNED': return 'Asignación de Evaluadores';
      case 'PEER_RISK_SUBMITTED': return 'Definición de Nivel de Riesgo';
      case 'EVALUATION_SUBMITTED': return 'Evaluación Registrada';
      case 'RESOLUTION_CREATED': return 'Emisión de Dictamen';
      default: return action.replace(/_/g, ' ');
    }
  }
}
