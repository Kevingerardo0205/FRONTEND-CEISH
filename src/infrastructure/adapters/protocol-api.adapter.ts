import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({
  providedIn: 'root'
})
export class ProtocolApiAdapter extends IProtocolRepositoryPort {
  private apiClient = inject(ApiClientService);

  getAll(): Observable<ProtocolEntity[]> {
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.BASE).pipe(
      map(res => this.extractAndMapList(res)),
      catchError(err => {
        console.warn('[ProtocolApiAdapter] Error en getAll:', err);
        return of([]);
      })
    );
  }

  getReceptionProtocols(): Observable<ProtocolEntity[]> {
    /**
     * Fallback secuencial:
     * 1. /reception/protocol (v2 singular)
     * 2. /reception/protocols (v2 plural)
     * 3. /protocols (v1)
     */
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.RECEPTION.LIST).pipe(
      catchError(() => this.apiClient.get<any>('/reception/protocols')),
      catchError(() => this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.BASE)),
      map(res => this.extractAndMapList(res)),
      catchError(err => {
        console.error('[ProtocolApiAdapter] Todos los fallbacks de recepción fallaron:', err);
        return of([]);
      })
    );
  }

  save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity> {
    if (protocol.id) {
      return this.apiClient.put<any>(`${ENDPOINTS.PROTOCOLS.BASE}/${protocol.id}`, protocol).pipe(
        map(data => this.mapToEntity(data))
      );
    }
    return this.apiClient.post<any>(ENDPOINTS.PROTOCOLS.BASE, protocol).pipe(
      map(data => this.mapToEntity(data))
    );
  }

  getById(id: string): Observable<ProtocolEntity> {
    return this.apiClient.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/${id}`).pipe(
      map(data => this.mapToEntity(data))
    );
  }

  uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.apiClient.post<any>(ENDPOINTS.PROTOCOLS.RECEPTION.BULK_UPLOAD(protocolId), formData).pipe(
      map(data => this.mapToEntity(data))
    );
  }

  getRequirementsByType(type: ProtocolType): Observable<string[]> {
    return this.apiClient.get<string[]>(`${ENDPOINTS.PROTOCOLS.BASE}/requirements/${type}`);
  }

  getChecklist(id: string): Observable<any> {
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.CHECKLIST(id));
  }

  getDocumentHistory(id: string): Observable<any[]> {
    return this.apiClient.get<any[]>(ENDPOINTS.PROTOCOLS.RECEPTION.DOCUMENTS_HISTORY(id)).pipe(
      map(res => this.extractAnyArray(res)),
      catchError(err => {
        console.warn('[ProtocolApiAdapter] Error en getDocumentHistory:', err);
        return of([]);
      })
    );
  }

  finalizeReception(id: string): Observable<any> {
    return this.apiClient.post(ENDPOINTS.PROTOCOLS.RECEPTION.FINALIZE(id), {});
  }

  getCertificate(id: string): Observable<Blob> {
    // El backend del Sprint 1 usa POST para generar el certificado según la tabla
    return this.apiClient.post(ENDPOINTS.PROTOCOLS.RECEPTION.CERTIFICATE(id), {}, { responseType: 'blob' });
  }

  finalizeValidation(protocolId: string): Observable<any> {
    return this.finalizeReception(protocolId);
  }

  updateRequirementStatus(protocolId: string, reqId: string, status: string): Observable<any> {
    return this.apiClient.patch(`/reception/protocol/${protocolId}/requirement/${reqId}`, {
      status
    });
  }

  verifyProtocol(protocolId: string, isComplete: boolean, missingItemsList: string): Observable<any> {
    return this.apiClient.patch(`/reception/protocol/${protocolId}/verify`, {
      isComplete,
      missingItemsList
    });
  }

  private extractAndMapList(res: any): ProtocolEntity[] {
    const rawList = this.extractAnyArray(res);
    return rawList.map(item => this.mapToEntity(item));
  }

  private extractAnyArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;

    // Función recursiva para encontrar el primer arreglo en un objeto
    const findFirstArray = (obj: any, depth = 0): any[] | null => {
      if (depth > 3 || !obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj)) return obj;
      
      const priorityKeys = ['protocols', 'protocolos', 'data', 'items', 'results', 'list', 'rows', 'documents', 'documentos'];
      for (const key of priorityKeys) {
        if (obj[key] && Array.isArray(obj[key])) return obj[key];
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const result = findFirstArray(obj[key], depth + 1);
          if (result) return result;
        }
      }
      return null;
    };

    return findFirstArray(res) || [];
  }

  private mapToEntity(data: any): ProtocolEntity {
    if (!data) return {} as ProtocolEntity;
    
    // El status puede venir como string o como objeto { name: '...' } o { id: 1, name: '...' }
    let statusLabel = 'DESCONOCIDO';
    if (typeof data.status === 'string') {
      statusLabel = data.status;
    } else if (data.status && typeof data.status === 'object') {
      statusLabel = data.status.name || data.status.label || data.status.descripcion || 'DESCONOCIDO';
    } else if (data.estado) {
      statusLabel = typeof data.estado === 'string' ? data.estado : (data.estado.name || 'DESCONOCIDO');
    }

    return {
      id: data.id?.toString() || '',
      title: data.title || data.titulo || 'Sin título',
      investigatorId: data.investigatorId || data.investigadorId || '',
      type: data.type || data.tipo || '',
      status: statusLabel.toUpperCase() as any,
      submissionDate: data.submissionDate || data.fechaEnvio || data.createdAt ? new Date(data.submissionDate || data.fechaEnvio || data.createdAt) : new Date(),
      code: data.code || data.codigo || '',
      documents: data.documents || data.documentos || [],
      version: data.version || 1
    };
  }
}
