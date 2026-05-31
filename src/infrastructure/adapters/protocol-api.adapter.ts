import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity, ValidationDetailResponse } from '@domain/entities/protocol.entity';
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
    // El backend ahora devuelve un array directo con todos los protocolos de recepción
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.RECEPTION.LIST).pipe(
      map(res => this.extractAndMapList(res)),
      catchError(err => {
        console.error('[ProtocolApiAdapter] Error cargando lista de recepción:', err);
        return of([]);
      })
    );
  }

  getProtocolsByStatus(status: string): Observable<ProtocolEntity[]> {
    return this.getReceptionProtocols().pipe(
      map(list => list.filter(p => p.status === status))
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
      map(data => this.mapToEntity(data)),
      catchError(err => {
        console.warn(`[ProtocolApiAdapter] Protocolo ${id} no encontrado en API. Retornando mock de UAT...`);
        return of({
          id: id,
          title: 'Estudio clínico experimental de evaluación de fármaco X (Proyecto Fallback)',
          investigatorId: 'inv-123',
          principalInvestigator: 'Dr. Juan Pérez',
          type: ProtocolType.EC,
          studyTypeCode: 'EC',
          status: 'COMPLETO' as any,
          submissionDate: new Date(),
          code: 'CEISH-ESPOCH-2026-0012',
          documents: [],
          version: 1,
          isTimelineTermsAccepted: false,
          timelineTermsAcceptedAt: null,
          timelineTermsAcceptedIp: null
        });
      })
    );
  }

  uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity> {
    const formData = new FormData();
    // El backend (Multer) espera el campo 'file' en singular
    files.forEach(file => formData.append('file', file));
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
    return this.apiClient.post(ENDPOINTS.PROTOCOLS.RECEPTION.CERTIFICATE(id), {}, { responseType: 'blob' });
  }

  finalizeValidation(protocolId: string): Observable<any> {
    return this.finalizeReception(protocolId);
  }

  acceptTimeline(id: string): Observable<any> {
    return this.apiClient.post<any>(ENDPOINTS.PROTOCOLS.ACCEPT_TIMELINE(id), {});
  }

  updateRequirementStatus(protocolId: string, reqId: string, status: string): Observable<any> {
    return this.apiClient.patch(ENDPOINTS.PROTOCOLS.RECEPTION.REQUIREMENT_STATUS(protocolId, reqId), {
      status
    });
  }

  verifyProtocol(protocolId: string, isComplete: boolean, missingItemsList: string): Observable<any> {
    return this.apiClient.patch(ENDPOINTS.PROTOCOLS.RECEPTION.VERIFY(protocolId), {
      isComplete,
      missingItemsList
    });
  }

  getValidationDetail(id: string): Observable<ValidationDetailResponse> {
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.RECEPTION.VALIDATION_DETAIL(id)).pipe(
      map(res => res.data || res)
    );
  }

  private extractAndMapList(res: any): ProtocolEntity[] {
    const rawList = this.extractAnyArray(res);
    return rawList.map(item => this.mapToEntity(item));
  }

  private extractAnyArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
  }

  private mapToEntity(data: any): ProtocolEntity {
    if (!data) return {} as ProtocolEntity;
    const raw = data.data || data;
    
    // Mapeo de estado según el nuevo campo receptionStatus
    let statusLabel = raw.receptionStatus || raw.status || raw.estado || 'DESCONOCIDO';
    if (typeof statusLabel === 'object') {
      statusLabel = statusLabel.name || statusLabel.label || 'DESCONOCIDO';
    }

    // Mapeo de Investigador Principal
    let pi = raw.principalInvestigator || '';
    if (!pi && raw.investigators && Array.isArray(raw.investigators)) {
      const principal = raw.investigators.find((i: any) => i.role === 'PRINCIPAL');
      if (principal) pi = principal.fullName || principal.nombre || '';
    }

    return {
      id: raw.id?.toString() || '',
      title: raw.title || raw.titulo || 'Sin título',
      investigatorId: raw.investigatorId || '',
      principalInvestigator: pi,
      type: (raw.studyType?.code || raw.type || '') as ProtocolType,
      studyTypeCode: raw.studyType?.code || raw.studyTypeCode || '',
      studyType: raw.studyType || null,
      status: statusLabel.toUpperCase() as any,
      submissionDate: raw.receptionDate ? new Date(raw.receptionDate) : (raw.submissionDate ? new Date(raw.submissionDate) : new Date()),
      code: raw.ceishCode || raw.code || '',
      documents: raw.documents || [],
      version: raw.version || 1,
      riskLevel: raw.riskLevel || null,
      riskLevelId: raw.riskLevelId || null,
      geographicCoverage: raw.geographicCoverage || null,
      studyDurationMonths: raw.studyDurationMonths || null,
      lugarEjecucion: raw.lugarEjecucion || null,
      fechaInicioEstimada: raw.fechaInicioEstimada || null,
      fechaFinEstimada: raw.fechaFinEstimada || null,
      sponsorRuc: raw.sponsorRuc || null,
      sponsorPhone: raw.sponsorPhone || null,
      sponsorAddress: raw.sponsorAddress || null,
      sponsorWeb: raw.sponsorWeb || null,
      sponsorExecutingAgency: raw.sponsorExecutingAgency || raw.sponsorExecutingOrgan || raw.executingOrgan || null,
      financingAmount: raw.financingAmount || raw.amount || null,
      isTimelineTermsAccepted: raw.isTimelineTermsAccepted ?? false,
      timelineTermsAcceptedAt: raw.timelineTermsAcceptedAt ?? null,
      timelineTermsAcceptedIp: raw.timelineTermsAcceptedIp ?? null
    };
  }
}
