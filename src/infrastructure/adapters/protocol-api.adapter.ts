import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IProtocolRepositoryPort,
  ChecklistItem,
  ProtocolDocumentHistoryEntry,
  RiskLevel,
} from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity, ValidationDetailResponse } from '@domain/entities/protocol.entity';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { ResolutionMapper } from '@infrastructure/mappers/resolution.mapper';

interface RawDocumentFromApi {
  id: number | string;
  fileName?: string;
  name?: string;
  title?: string;
  path?: string;
  url?: string;
  type?: string;
  typeName?: string;
  sizeBytes?: number;
  versionNumber?: number;
  version?: number;
  uploadedAt?: string;
  uploaded_at?: string;
  requirement?: { requirementName?: string };
  requirementName?: string;
  tipoDocumento?: { nombre?: string };
  reception?: { version?: { versionNumber?: number } };
}

interface RawVersionFromApi {
  id: string | number;
  versionNumber?: number;
  numeroVersion?: number;
  version?: number;
  status?: string;
  estado?: string;
  statusId?: number;
  estadoId?: number;
  resolutionType?: string;
  tipoResolucion?: string;
  observaciones?: string;
  observations?: string;
  majorObservations?: string;
  createdAt?: string | Date;
}

interface InvestigatorFromApi {
  role?: string;
  fullName?: string;
  nombre?: string;
}

interface RawStudyType {
  code?: string;
}

interface RawStatusObj {
  name?: string;
  label?: string;
}

interface RawProtocolData {
  protocolId?: string | number;
  id?: string | number;
  title?: string;
  titulo?: string;
  investigatorId?: string;
  principalInvestigator?: string;
  investigators?: InvestigatorFromApi[];
  studyType?: RawStudyType;
  studyTypeCode?: string;
  type?: string;
  receptionStatus?: string | RawStatusObj;
  status?: string | RawStatusObj;
  estado?: string;
  statusId?: number | string;
  receptionDate?: string;
  submissionDate?: string;
  code?: string;
  ceishCode?: string;
  documents?: ProtocolEntity['documents'];
  version?: number | string;
  riskLevel?: ProtocolEntity['riskLevel'];
  riskLevelId?: number;
  geographicCoverage?: string;
  studyDurationMonths?: number;
  lugarEjecucion?: string;
  fechaInicioEstimada?: string;
  fechaFinEstimada?: string;
  sponsorRuc?: string;
  sponsorPhone?: string;
  sponsorAddress?: string;
  sponsorWeb?: string;
  sponsorExecutingAgency?: string;
  sponsorExecutingOrgan?: string;
  executingOrgan?: string;
  financingAmount?: number;
  amount?: number;
  isTimelineTermsAccepted?: boolean;
  timelineTermsAcceptedAt?: string | null;
  timelineTermsAcceptedIp?: string | null;
  versions?: RawVersionFromApi[];
  protocol?: RawProtocolData;
  version_obj?: { protocol?: RawProtocolData };
}

interface EnvelopeWithArray {
  data?: unknown[] | EnvelopeWithArray | EnvelopeWithNested;
}

interface EnvelopeWithNested {
  data?: { data?: unknown[] };
}

interface EnvelopeWithData<T = unknown> {
  data?: T;
}

interface DocumentHistoryItem extends ProtocolDocumentHistoryEntry {
  name: string;
  title: string;
  type: string;
  url: string;
  sizeBytes?: number;
  path?: string;
  version: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProtocolApiAdapter extends IProtocolRepositoryPort {
  private apiClient = inject(ApiClientService);

  getAll(): Observable<ProtocolEntity[]> {
    return this.apiClient.get<EnvelopeWithArray>(ENDPOINTS.PROTOCOLS.BASE).pipe(
      map((res) => this.extractAndMapList(res)),
      catchError((err) => {
        console.warn('[ProtocolApiAdapter] Error en getAll:', err);
        return of([]);
      }),
    );
  }

  getReceptionProtocols(status?: string): Observable<ProtocolEntity[]> {
    const url = status
      ? `${ENDPOINTS.PROTOCOLS.RECEPTION.LIST}?status=${status}`
      : ENDPOINTS.PROTOCOLS.RECEPTION.LIST;
    return this.apiClient.get<EnvelopeWithArray>(url).pipe(
      map((res) => this.extractAndMapList(res)),
      catchError((err) => {
        console.error('[ProtocolApiAdapter] Error cargando lista de recepción:', err);
        return of([]);
      }),
    );
  }

  getProtocolsByStatus(status: string): Observable<ProtocolEntity[]> {
    return this.getReceptionProtocols().pipe(
      map((list) => list.filter((p) => p.status === status)),
    );
  }

  save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity> {
    if (protocol.id) {
      return this.apiClient
        .put<EnvelopeWithData<RawProtocolData>>(
          `${ENDPOINTS.PROTOCOLS.BASE}/${protocol.id}`,
          protocol,
        )
        .pipe(map((data) => this.mapToEntity(data)));
    }
    return this.apiClient
      .post<EnvelopeWithData<RawProtocolData>>(ENDPOINTS.PROTOCOLS.BASE, protocol)
      .pipe(map((data) => this.mapToEntity(data)));
  }

  getById(id: string): Observable<ProtocolEntity> {
    return this.apiClient
      .get<EnvelopeWithData<RawProtocolData>>(`${ENDPOINTS.PROTOCOLS.BASE}/${id}`)
      .pipe(map((data) => this.mapToEntity(data)));
  }

  uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity> {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));
    return this.apiClient
      .post<EnvelopeWithData<RawProtocolData>>(
        ENDPOINTS.PROTOCOLS.RECEPTION.BULK_UPLOAD(protocolId),
        formData,
      )
      .pipe(map((data) => this.mapToEntity(data)));
  }

  getRequirementsByType(type: ProtocolType): Observable<string[]> {
    return this.apiClient.get<string[]>(`${ENDPOINTS.PROTOCOLS.BASE}/requirements/${type}`);
  }

  getChecklist(id: string): Observable<ChecklistItem[]> {
    return this.apiClient.get<ChecklistItem[]>(ENDPOINTS.PROTOCOLS.CHECKLIST(id));
  }

  getDocumentHistory(id: string): Observable<DocumentHistoryItem[]> {
    const mapDocs = (arr: RawDocumentFromApi[]): DocumentHistoryItem[] => {
      return arr.map((doc) => {
        const viewUrl =
          doc.path && doc.path.startsWith('http')
            ? doc.path
            : `/api/reception/document/${doc.id}/view`;
        const reqName =
          doc.requirement?.requirementName ||
          doc.requirementName ||
          doc.tipoDocumento?.nombre ||
          doc.typeName ||
          doc.type ||
          'Documento de recepción';
        return {
          id: Number(doc.id) || 0,
          name: doc.fileName || doc.name || 'Documento sin nombre',
          title: doc.fileName || doc.title || 'Documento sin nombre',
          type: reqName,
          url: doc.url || viewUrl,
          sizeBytes: doc.sizeBytes,
          path: doc.path,
          version: doc.versionNumber || doc.version || doc.reception?.version?.versionNumber || 1,
          fileName: doc.fileName || doc.name || 'Documento sin nombre',
          uploadedAt: doc.uploadedAt || doc.uploaded_at || '',
        };
      });
    };

    return this.apiClient.get<EnvelopeWithArray>(`/documents/protocol/${id}`).pipe(
      map((res) => mapDocs(this.extractAnyArray(res) as RawDocumentFromApi[])),
      catchError((err) => {
        console.warn(
          '[ProtocolApiAdapter] Error en getDocumentHistory (endpoint general). Intentando endpoint de recepción...',
          err,
        );
        return this.apiClient
          .get<EnvelopeWithArray>(ENDPOINTS.PROTOCOLS.RECEPTION.DOCUMENTS_HISTORY(id))
          .pipe(
            map((res) => mapDocs(this.extractAnyArray(res) as RawDocumentFromApi[])),
            catchError((err2) => {
              console.warn(
                '[ProtocolApiAdapter] Error en getDocumentHistory (ambos endpoints):',
                err2,
              );
              return of([]);
            }),
          );
      }),
    );
  }

  finalizeReception(id: string): Observable<{ message?: string }> {
    return this.apiClient.post(ENDPOINTS.PROTOCOLS.RECEPTION.FINALIZE(id), {});
  }

  getCertificate(id: string): Observable<Blob> {
    return this.apiClient.post(
      ENDPOINTS.PROTOCOLS.RECEPTION.CERTIFICATE(id),
      {},
      { responseType: 'blob' },
    );
  }

  finalizeValidation(protocolId: string): Observable<{ message?: string }> {
    return this.finalizeReception(protocolId);
  }

  acceptTimeline(id: string): Observable<{ message?: string }> {
    return this.apiClient.post(ENDPOINTS.PROTOCOLS.ACCEPT_TIMELINE(id), {});
  }

  updateRequirementStatus(
    protocolId: string,
    reqId: string,
    status: string,
  ): Observable<{ message?: string }> {
    return this.apiClient.patch(
      ENDPOINTS.PROTOCOLS.RECEPTION.REQUIREMENT_STATUS(protocolId, reqId),
      {
        status,
      },
    );
  }

  verifyProtocol(
    protocolId: string,
    isComplete: boolean,
    missingItemsList: string,
  ): Observable<{ message?: string }> {
    return this.apiClient.patch(ENDPOINTS.PROTOCOLS.RECEPTION.VERIFY(protocolId), {
      isComplete,
      missingItemsList,
    });
  }

  getValidationDetail(id: string): Observable<ValidationDetailResponse> {
    return this.apiClient
      .get<EnvelopeWithData<ValidationDetailResponse>>(
        ENDPOINTS.PROTOCOLS.RECEPTION.VALIDATION_DETAIL(id),
      )
      .pipe(map((res) => (res.data || res) as ValidationDetailResponse));
  }

  private extractAndMapList(res: EnvelopeWithArray): ProtocolEntity[] {
    const rawList = this.extractAnyArray(res);
    return rawList.map((item) =>
      this.mapToEntity(item as EnvelopeWithData<RawProtocolData> | RawProtocolData | null),
    );
  }

  private extractAnyArray(res: EnvelopeWithArray): unknown[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && typeof res.data === 'object') {
      const nested = res.data as EnvelopeWithNested;
      if (nested.data && Array.isArray(nested.data)) return nested.data;
    }
    return [];
  }

  private mapToEntity(
    data: EnvelopeWithData<RawProtocolData> | RawProtocolData | null,
  ): ProtocolEntity {
    if (!data || typeof data !== 'object') return {} as ProtocolEntity;
    const raw: RawProtocolData =
      'data' in data &&
      data.data !== null &&
      data.data !== undefined &&
      typeof data.data === 'object' &&
      !Array.isArray(data.data)
        ? (data.data as RawProtocolData)
        : (data as RawProtocolData);

    const nestedProtocol = raw.protocol ?? null;

    const protocolId = raw.protocolId ?? nestedProtocol?.id ?? raw.id;

    let statusLabel: string | RawStatusObj = (raw.receptionStatus ||
      raw.status ||
      raw.estado ||
      nestedProtocol?.status ||
      'DESCONOCIDO') as string | RawStatusObj;
    if (typeof statusLabel === 'object' && statusLabel !== null) {
      statusLabel = String(statusLabel.name || statusLabel.label || 'DESCONOCIDO');
    }

    let pi = String(raw.principalInvestigator || nestedProtocol?.principalInvestigator || '');
    const investigatorsList = (raw.investigators || nestedProtocol?.investigators || null) as
      InvestigatorFromApi[] | null;
    if (!pi && investigatorsList && Array.isArray(investigatorsList)) {
      const principal = investigatorsList.find((i) => i.role === 'PRINCIPAL');
      if (principal) pi = String(principal.fullName || principal.nombre || '');
    }

    const statusIdVal = raw.statusId ?? nestedProtocol?.statusId ?? null;

    return {
      id: String(protocolId ?? ''),
      title: String(
        raw.title || raw.titulo || nestedProtocol?.title || nestedProtocol?.titulo || 'Sin título',
      ),
      investigatorId: String(raw.investigatorId || nestedProtocol?.investigatorId || ''),
      principalInvestigator: pi,
      type: String(
        raw.studyType?.code ||
          raw.type ||
          nestedProtocol?.studyType?.code ||
          nestedProtocol?.type ||
          '',
      ) as ProtocolType,
      studyTypeCode: String(
        raw.studyType?.code ||
          raw.studyTypeCode ||
          nestedProtocol?.studyType?.code ||
          nestedProtocol?.studyTypeCode ||
          '',
      ),
      studyType: (raw.studyType ||
        nestedProtocol?.studyType ||
        null) as ProtocolEntity['studyType'],
      status: String(statusLabel).toUpperCase() as ProtocolStatus,
      statusId: statusIdVal ? Number(statusIdVal) : undefined,
      submissionDate: raw.receptionDate
        ? new Date(raw.receptionDate)
        : raw.submissionDate
          ? new Date(raw.submissionDate)
          : nestedProtocol?.receptionDate
            ? new Date(nestedProtocol.receptionDate)
            : nestedProtocol?.submissionDate
              ? new Date(nestedProtocol.submissionDate)
              : new Date(),
      code: String(
        raw.ceishCode || raw.code || nestedProtocol?.ceishCode || nestedProtocol?.code || '',
      ),
      documents: (raw.documents || nestedProtocol?.documents || []) as ProtocolEntity['documents'],
      version: (raw.version || nestedProtocol?.version || 1) as ProtocolEntity['version'],
      riskLevel: (raw.riskLevel ||
        nestedProtocol?.riskLevel ||
        null) as ProtocolEntity['riskLevel'],
      riskLevelId: (raw.riskLevelId || nestedProtocol?.riskLevelId) as number | undefined,
      geographicCoverage: (raw.geographicCoverage || nestedProtocol?.geographicCoverage) as
        string | undefined,
      studyDurationMonths: (raw.studyDurationMonths || nestedProtocol?.studyDurationMonths) as
        number | undefined,
      lugarEjecucion: (raw.lugarEjecucion || nestedProtocol?.lugarEjecucion) as string | undefined,
      fechaInicioEstimada: (raw.fechaInicioEstimada || nestedProtocol?.fechaInicioEstimada) as
        string | undefined,
      fechaFinEstimada: (raw.fechaFinEstimada || nestedProtocol?.fechaFinEstimada) as
        string | undefined,
      sponsorRuc: (raw.sponsorRuc || nestedProtocol?.sponsorRuc) as string | undefined,
      sponsorPhone: (raw.sponsorPhone || nestedProtocol?.sponsorPhone) as string | undefined,
      sponsorAddress: (raw.sponsorAddress || nestedProtocol?.sponsorAddress) as string | undefined,
      sponsorWeb: (raw.sponsorWeb || nestedProtocol?.sponsorWeb) as string | undefined,
      sponsorExecutingAgency: (raw.sponsorExecutingAgency ||
        raw.sponsorExecutingOrgan ||
        raw.executingOrgan ||
        nestedProtocol?.sponsorExecutingAgency) as string | undefined,
      financingAmount: (raw.financingAmount || raw.amount || nestedProtocol?.financingAmount) as
        number | undefined,
      isTimelineTermsAccepted: Boolean(
        raw.isTimelineTermsAccepted ?? nestedProtocol?.isTimelineTermsAccepted ?? false,
      ),
      timelineTermsAcceptedAt: (raw.timelineTermsAcceptedAt ??
        nestedProtocol?.timelineTermsAcceptedAt ??
        null) as string | null,
      timelineTermsAcceptedIp: (raw.timelineTermsAcceptedIp ??
        nestedProtocol?.timelineTermsAcceptedIp ??
        null) as string | null,
      versions: ((raw.versions || nestedProtocol?.versions || []) as RawVersionFromApi[]).map(
        (v) => {
          const parsedObs = ResolutionMapper.parseConsolidatedObservations(
            v.observaciones || v.observations || v.majorObservations || '',
          );
          return {
            id: v.id,
            versionNumber: v.versionNumber || v.numeroVersion || v.version || 1,
            status: v.status || v.estado || '',
            statusId: v.statusId || v.estadoId || undefined,
            resolutionType: v.resolutionType || v.tipoResolucion || undefined,
            majorObservations: parsedObs.majorObservations,
            minorObservations: parsedObs.minorObservations,
            correctionProcedure: parsedObs.correctionProcedure,
            createdAt: v.createdAt ? new Date(v.createdAt) : undefined,
          };
        },
      ),
    };
  }

  getRiskLevels(): Observable<RiskLevel[]> {
    return this.apiClient.get<EnvelopeWithData<RiskLevel[]>>(ENDPOINTS.PROTOCOLS.RISK_LEVELS).pipe(
      map((res) => {
        const raw = res.data || res;
        return Array.isArray(raw) ? raw : [];
      }),
      catchError((err) => {
        console.error('[ProtocolApiAdapter] Error cargando catálogo de riesgos:', err);
        return of([]);
      }),
    );
  }

  getProtocolsByStatusId(statusId: number): Observable<ProtocolEntity[]> {
    return this.apiClient
      .get<EnvelopeWithArray>(`${ENDPOINTS.PROTOCOLS.BASE}?statusId=${statusId}`)
      .pipe(
        map((res) => this.extractAndMapList(res)),
        catchError((err) => {
          console.error('[ProtocolApiAdapter] Error loading protocols by statusId:', err);
          return of([]);
        }),
      );
  }
}
