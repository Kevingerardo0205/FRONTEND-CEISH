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

  getReceptionProtocols(status?: string): Observable<ProtocolEntity[]> {
    const url = status ? `${ENDPOINTS.PROTOCOLS.RECEPTION.LIST}?status=${status}` : ENDPOINTS.PROTOCOLS.RECEPTION.LIST;
    return this.apiClient.get<any>(url).pipe(
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
      map(data => this.mapToEntity(data))
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
    const mapDocs = (arr: any[]) => {
      return arr.map(doc => {
        const viewUrl = doc.path && doc.path.startsWith('http')
          ? doc.path
          : `/api/reception/document/${doc.id}/view`;
        const reqName = doc.requirement?.requirementName 
          || doc.requirementName 
          || doc.tipoDocumento?.nombre 
          || doc.typeName 
          || doc.type 
          || 'Documento de recepción';
        return {
          id: doc.id,
          name: doc.fileName || doc.name || 'Documento sin nombre',
          title: doc.fileName || doc.title || 'Documento sin nombre',
          type: reqName,
          url: doc.url || viewUrl,
          sizeBytes: doc.sizeBytes,
          path: doc.path,
          version: doc.versionNumber || doc.version || doc.reception?.version?.versionNumber || 1
        };
      });
    };

    return this.apiClient.get<any[]>(`/documents/protocol/${id}`).pipe(
      map(res => mapDocs(this.extractAnyArray(res))),
      catchError(err => {
        console.warn('[ProtocolApiAdapter] Error en getDocumentHistory (endpoint general). Intentando endpoint de recepción...', err);
        return this.apiClient.get<any[]>(ENDPOINTS.PROTOCOLS.RECEPTION.DOCUMENTS_HISTORY(id)).pipe(
          map(res => mapDocs(this.extractAnyArray(res))),
          catchError(err2 => {
            console.warn('[ProtocolApiAdapter] Error en getDocumentHistory (ambos endpoints):', err2);
            return of([]);
          })
        );
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
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  private mapToEntity(data: any): ProtocolEntity {
    if (!data) return {} as ProtocolEntity;
    const raw = data.data || data;
    
    // Si la respuesta es de recepción y viene con el protocolo anidado o la versión anidada
    const nestedProtocol = raw.protocol || raw.version?.protocol || null;

    // Resolver ID de Protocolo real (priorizando protocolId o la estructura anidada)
    const protocolId = raw.protocolId || nestedProtocol?.id || raw.id;

    // Mapeo de estado según el nuevo campo receptionStatus o status
    let statusLabel = raw.receptionStatus || raw.status || raw.estado || nestedProtocol?.status || 'DESCONOCIDO';
    if (typeof statusLabel === 'object') {
      statusLabel = statusLabel.name || statusLabel.label || 'DESCONOCIDO';
    }

    // Mapeo de Investigador Principal
    let pi = raw.principalInvestigator || nestedProtocol?.principalInvestigator || '';
    const investigatorsList = raw.investigators || nestedProtocol?.investigators || null;
    if (!pi && investigatorsList && Array.isArray(investigatorsList)) {
      const principal = investigatorsList.find((i: any) => i.role === 'PRINCIPAL');
      if (principal) pi = principal.fullName || principal.nombre || '';
    }

    const statusIdVal = raw.statusId || nestedProtocol?.statusId || null;

    return {
      id: protocolId?.toString() || '',
      title: raw.title || raw.titulo || nestedProtocol?.title || nestedProtocol?.titulo || 'Sin título',
      investigatorId: raw.investigatorId || nestedProtocol?.investigatorId || '',
      principalInvestigator: pi,
      type: (raw.studyType?.code || raw.type || nestedProtocol?.studyType?.code || nestedProtocol?.type || '') as ProtocolType,
      studyTypeCode: raw.studyType?.code || raw.studyTypeCode || nestedProtocol?.studyType?.code || nestedProtocol?.studyTypeCode || '',
      studyType: raw.studyType || nestedProtocol?.studyType || null,
      status: statusLabel.toUpperCase() as any,
      statusId: statusIdVal ? Number(statusIdVal) : undefined,
      submissionDate: raw.receptionDate 
        ? new Date(raw.receptionDate) 
        : (raw.submissionDate 
          ? new Date(raw.submissionDate) 
          : (nestedProtocol?.receptionDate 
            ? new Date(nestedProtocol.receptionDate) 
            : (nestedProtocol?.submissionDate 
              ? new Date(nestedProtocol.submissionDate) 
              : new Date()))),
      code: raw.ceishCode || raw.code || nestedProtocol?.ceishCode || nestedProtocol?.code || '',
      documents: raw.documents || nestedProtocol?.documents || [],
      version: raw.version || nestedProtocol?.version || 1,
      riskLevel: raw.riskLevel || nestedProtocol?.riskLevel || null,
      riskLevelId: raw.riskLevelId || nestedProtocol?.riskLevelId || null,
      geographicCoverage: raw.geographicCoverage || nestedProtocol?.geographicCoverage || null,
      studyDurationMonths: raw.studyDurationMonths || nestedProtocol?.studyDurationMonths || null,
      lugarEjecucion: raw.lugarEjecucion || nestedProtocol?.lugarEjecucion || null,
      fechaInicioEstimada: raw.fechaInicioEstimada || nestedProtocol?.fechaInicioEstimada || null,
      fechaFinEstimada: raw.fechaFinEstimada || nestedProtocol?.fechaFinEstimada || null,
      sponsorRuc: raw.sponsorRuc || nestedProtocol?.sponsorRuc || null,
      sponsorPhone: raw.sponsorPhone || nestedProtocol?.sponsorPhone || null,
      sponsorAddress: raw.sponsorAddress || nestedProtocol?.sponsorAddress || null,
      sponsorWeb: raw.sponsorWeb || nestedProtocol?.sponsorWeb || null,
      sponsorExecutingAgency: raw.sponsorExecutingAgency || raw.sponsorExecutingOrgan || raw.executingOrgan || nestedProtocol?.sponsorExecutingAgency || null,
      financingAmount: raw.financingAmount || raw.amount || nestedProtocol?.financingAmount || null,
      isTimelineTermsAccepted: raw.isTimelineTermsAccepted ?? nestedProtocol?.isTimelineTermsAccepted ?? false,
      timelineTermsAcceptedAt: raw.timelineTermsAcceptedAt ?? nestedProtocol?.timelineTermsAcceptedAt ?? null,
      timelineTermsAcceptedIp: raw.timelineTermsAcceptedIp ?? nestedProtocol?.timelineTermsAcceptedIp ?? null,
      versions: (raw.versions || nestedProtocol?.versions || []).map((v: any) => ({
        id: v.id,
        versionNumber: v.versionNumber || v.numeroVersion || v.version || 1,
        status: v.status || v.estado || '',
        statusId: v.statusId || v.estadoId || null,
        resolutionType: v.resolutionType || v.tipoResolucion || null,
        majorObservations: v.majorObservations || v.observacionesMayores || v.observaciones || '',
        minorObservations: v.minorObservations || v.observacionesMenores || '',
        correctionProcedure: v.correctionProcedure || v.procedimientoSubsanacion || '',
        createdAt: v.createdAt ? new Date(v.createdAt) : null
      }))
    };
  }

  getRiskLevels(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.RISK_LEVELS).pipe(
      map(res => {
        const raw = res.data || res;
        return Array.isArray(raw) ? raw : [];
      }),
      catchError(err => {
        console.error('[ProtocolApiAdapter] Error cargando catálogo de riesgos:', err);
        return of([]);
      })
    );
  }

  getProtocolsByStatusId(statusId: number): Observable<ProtocolEntity[]> {
    return this.apiClient.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}?statusId=${statusId}`).pipe(
      map(res => this.extractAndMapList(res)),
      catchError(err => {
        console.error('[ProtocolApiAdapter] Error loading protocols by statusId:', err);
        return of([]);
      })
    );
  }
}
