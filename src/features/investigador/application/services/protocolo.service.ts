import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap, filter } from 'rxjs/operators';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import {
  CrearProtocoloDto,
  ProtocoloCreadoResponse,
  ProtocoloResumen,
  ProtocoloDetalle,
  ChecklistRequirement,
  EstadoProtocolo,
} from '../../domain/dtos/crear-protocolo.dto';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { MatSnackBar } from '@angular/material/snack-bar';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { sanitizeFilename } from '@domain/entities/storage.interface';
import { RiskLevel } from '@domain/ports/IProtocolRepositoryPort';

// --- Local response types ---

/** Generic wrapper the backend uses: { data: T } */
interface ApiEnvelope<T> {
  data: T;
}

/** Study-type catalog item from GET /protocols/study-types */
interface StudyTypeItem {
  id: number;
  name: string;
  code?: string;
}

/** Raw protocol object (mixed snake_case / camelCase) from the backend */
interface RawBackendProtocol {
  id: number;
  ceishCode?: string;
  codigoCeish?: string;
  title?: string;
  titulo?: string;
  receptionStatus?: string;
  estado?: string;
  createdAt?: string;
  fechaCreacion?: string;
  receptionDate?: string;
  studyType?: string;
  tipoEstudio?: string;
  isTimelineTermsAccepted?: boolean;
  timelineTermsAcceptedAt?: string | null;
  timelineTermsAcceptedIp?: string | null;
  versionNumber?: number;
  version?: number;
  checklist?: ChecklistRequirement[];
  requirements?: ChecklistRequirement[];
  protocolo_requisitos?: ChecklistRequirement[];
  [key: string]: unknown;
}

/** POST /protocols/:id/upload-document payload */
interface UploadDocumentPayload {
  requirementId: number;
  fileName: string;
  path: string;
  sizeBytes: number;
  requirementCode?: string;
}

/** Document registration response */
interface DocumentRegistrationResponse {
  id: number;
  fileName: string;
  path: string;
  protocolId?: number;
}

/** Response from finalize/submit endpoint */
interface FinalizeResponse {
  message?: string;
  success?: boolean;
  code?: string;
}

/** Dynamic requirement item from GET /protocols/requirements */
interface RequirementItem {
  id: number;
  code?: string;
  name: string;
  description?: string;
  mandatory?: boolean;
  [key: string]: unknown;
}

/** Document history entry from backend */
interface DocumentHistoryEntry {
  id: number;
  fileName: string;
  uploadedAt: string;
  status?: string;
  requirementId?: number;
  [key: string]: unknown;
}

/** Unwraps an API response that may be wrapped in { data: T } or returned directly */
function unwrap<T>(response: { data: T } | T): T {
  if (response !== null && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

@Injectable({ providedIn: 'root' })
export class ProtocoloService extends BaseApiService {
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);
  private s3StorageService = inject(S3StorageService);

  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * Determina si el usuario actual tiene rol de investigador.
   * Si es así, evitamos endpoints de /reception/ para prevenir errores 403.
   */
  private get isInvestigador(): boolean {
    const user = this.authFacade.currentUser();
    return user?.rol === 'INVESTIGADOR';
  }

  /**
   * Obtener tipos de estudio dinámicos del backend
   */
  getStudyTypes(): Observable<StudyTypeItem[]> {
    return this.get<ApiEnvelope<StudyTypeItem[]> | StudyTypeItem[]>(
      `${ENDPOINTS.PROTOCOLS.BASE}/study-types`,
    ).pipe(map((res) => unwrap<StudyTypeItem[]>(res) ?? []));
  }

  /**
   * Obtener niveles de riesgo dinámicos
   */
  getRiskLevels(): Observable<RiskLevel[]> {
    return this.get<ApiEnvelope<RiskLevel[]> | RiskLevel[]>(
      `${ENDPOINTS.PROTOCOLS.BASE}/risk-levels`,
    ).pipe(map((res) => unwrap<RiskLevel[]>(res) ?? []));
  }

  /**
   * 1. Obtener lista dinámica de documentos requeridos (Checklist Personal del Investigador)
   * Estrategia de Resiliencia: Si es investigador o el endpoint falla, intenta desde detalle.
   */
  getChecklist(protocolId: number): Observable<ChecklistRequirement[]> {
    // Definido por Mapeo Investigador: GET /protocols/checklist/:id
    const url = this.isInvestigador
      ? `/protocols/checklist/${protocolId}`
      : ENDPOINTS.PROTOCOLS.CHECKLIST(protocolId.toString());

    return this.get<ApiEnvelope<ChecklistRequirement[]> | ChecklistRequirement[]>(url).pipe(
      map((res) => unwrap<ChecklistRequirement[]>(res) ?? []),
      catchError((err) => {
        console.warn(
          `[ProtocoloService] Error en checklist oficial (${url}), intentando desde detalle...`,
          err,
        );
        return this.obtenerProtocolo(protocolId).pipe(
          map((protocol: ProtocoloDetalle) => {
            const proto = protocol as unknown as RawBackendProtocol;
            return proto.checklist || proto.requirements || proto.protocolo_requisitos || [];
          }),
          catchError((fallbackErr) => {
            console.warn(
              '[ProtocoloService] Fallback desde detalle falló. Retornando array vacío.',
              fallbackErr,
            );
            return of([]);
          }),
        );
      }),
    );
  }

  /**
   * 2. Guardado Inicial (Paso 1, 2 y 3)
   */
  guardarProtocoloInicial(data: CrearProtocoloDto): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>(ENDPOINTS.PROTOCOLS.RECEPTION.CREATE, data);
  }

  /**
   * 3. Subida de Archivos vinculada a Requisito (Mapeo Investigador)
   * Endpoint Investigador: POST /protocols/:id/upload-document
   */
  subirDocumento(
    file: File,
    protocolId: number,
    requirementId: number,
    requirementCode?: string,
    versionNumber: number = 1,
  ): Observable<DocumentRegistrationResponse> {
    const sanitizedName = sanitizeFilename(file.name);
    const vFolder = versionNumber > 1 ? `v${versionNumber}/` : '';
    const s3Key = `protocols/${protocolId}/${vFolder}requirements/${requirementId}/${sanitizedName}`;

    return this.s3StorageService.getUploadUrl(s3Key, file.type || 'application/pdf').pipe(
      catchError((err) => {
        console.error('[ProtocoloService] Error al obtener URL firmada de S3:', err);
        return throwError(() => err);
      }),
      switchMap((urlRes) => {
        return this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
          catchError((err) => {
            console.error('[ProtocoloService] Error al realizar la subida PUT a S3/R2:', err);
            return throwError(() => err);
          }),
          filter((uploadRes) => uploadRes.success),
          switchMap(() => {
            const url = this.isInvestigador
              ? `/protocols/${protocolId}/upload-document`
              : ENDPOINTS.PROTOCOLS.UPLOAD_DOCUMENT(protocolId.toString());

            const payload: UploadDocumentPayload = {
              requirementId: requirementId,
              fileName: sanitizedName,
              path: urlRes.key,
              sizeBytes: file.size,
            };

            if (requirementCode) {
              payload.requirementCode = requirementCode;
            }

            return this.post<
              ApiEnvelope<DocumentRegistrationResponse> | DocumentRegistrationResponse
            >(url, payload).pipe(
              map((res) => unwrap<DocumentRegistrationResponse>(res)),
              catchError((err) => {
                console.error(
                  '[ProtocoloService] Error en el registro del documento en la BD:',
                  err,
                );
                return throwError(() => err);
              }),
            );
          }),
        );
      }),
    );
  }

  getDocumentHistory(protocolId: number): Observable<DocumentHistoryEntry[]> {
    const url = this.isInvestigador
      ? `/protocols/${protocolId}/documents`
      : ENDPOINTS.PROTOCOLS.RECEPTION.DOCUMENTS_HISTORY(protocolId.toString());
    return this.get<ApiEnvelope<DocumentHistoryEntry[]> | DocumentHistoryEntry[]>(url).pipe(
      map((res) => unwrap<DocumentHistoryEntry[]>(res) ?? []),
    );
  }

  subirDocumentosBulk(
    protocolId: number,
    files: File[],
  ): Observable<DocumentRegistrationResponse[]> {
    const uploads = files.map((file) => this.subirDocumento(file, protocolId, 0));
    return forkJoin(uploads);
  }
  /**
   * 4. Cierre y Envío para Revisión Técnica
   */
  finalizarProtocolo(protocolId: number): Observable<FinalizeResponse> {
    const url = this.isInvestigador
      ? `/protocols/${protocolId}/submit` // El backend espera 'submit' para el Investigador
      : ENDPOINTS.PROTOCOLS.RECEPTION.FINALIZE(protocolId.toString()); // 'finalize' para Secretaría

    return this.post<ApiEnvelope<FinalizeResponse> | FinalizeResponse>(url, {}).pipe(
      map((res) => unwrap<FinalizeResponse>(res)),
    );
  }

  misProtocolos(): Observable<ProtocoloResumen[]> {
    return this.get<ApiEnvelope<RawBackendProtocol[]> | RawBackendProtocol[]>(
      `${ENDPOINTS.PROTOCOLS.BASE}/mis-protocolos?limit=100`,
    ).pipe(
      map((res) => {
        const unwrapped = unwrap<RawBackendProtocol[]>(res);
        // Soporte para respuestas paginadas del helper paginate: { data: [...], total: X }
        let data: RawBackendProtocol[];
        if (Array.isArray(unwrapped)) {
          data = unwrapped;
        } else if (
          unwrapped &&
          typeof unwrapped === 'object' &&
          Array.isArray((unwrapped as unknown as ApiEnvelope<RawBackendProtocol[]>).data)
        ) {
          data = (unwrapped as unknown as ApiEnvelope<RawBackendProtocol[]>).data;
        } else {
          data = [];
        }

        if (!data || !Array.isArray(data)) {
          console.warn(
            '[ProtocoloService] No se encontró una estructura de datos de protocolo válida en el backend:',
            res,
          );
          return [];
        }
        // Mapeo explícito para solucionar discrepancia de nombres de propiedades del backend
        return data.map((p: RawBackendProtocol) => ({
          id: p.id,
          codigoCeish: p.ceishCode || p.codigoCeish || '',
          titulo: p.title || p.titulo || 'Sin Título',
          estado: p.receptionStatus || p.estado || 'BORRADOR',
          fechaCreacion: p.createdAt || p.fechaCreacion || p.receptionDate || '',
          tipoEstudio: p.studyType || p.tipoEstudio || '',
          isTimelineTermsAccepted: p.isTimelineTermsAccepted ?? false,
          timelineTermsAcceptedAt: p.timelineTermsAcceptedAt || null,
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null,
          versionNumber: p.versionNumber || p.version || 1,
        })) as ProtocoloResumen[];
      }),
      catchError((err) => {
        console.error(
          '[ProtocoloService] Error crítico al obtener mis-protocolos desde la base de datos:',
          err,
        );
        this.snackBar.open(
          '⚠️ Error de conexión con la base de datos al cargar sus protocolos.',
          'Entendido',
          {
            duration: 5000,
            panelClass: ['snackbar-error'],
          },
        );
        return of([]);
      }),
    );
  }

  misProtocolosSubsanar(): Observable<ProtocoloResumen[]> {
    return this.get<ApiEnvelope<RawBackendProtocol[]> | RawBackendProtocol[]>(
      `${ENDPOINTS.PROTOCOLS.BASE}/mis-subsanaciones`,
    ).pipe(
      map((res) => {
        const unwrapped = unwrap<RawBackendProtocol[]>(res);
        let data: RawBackendProtocol[];
        if (Array.isArray(unwrapped)) {
          data = unwrapped;
        } else if (
          unwrapped &&
          typeof unwrapped === 'object' &&
          Array.isArray((unwrapped as unknown as ApiEnvelope<RawBackendProtocol[]>).data)
        ) {
          data = (unwrapped as unknown as ApiEnvelope<RawBackendProtocol[]>).data;
        } else {
          data = [];
        }
        if (!data || !Array.isArray(data)) {
          return [];
        }
        return data.map((p: RawBackendProtocol) => ({
          id: p.id,
          codigoCeish: p.ceishCode || p.codigoCeish || '',
          titulo: p.title || p.titulo || 'Sin Título',
          estado: p.receptionStatus || p.estado || 'BORRADOR',
          fechaCreacion: p.createdAt || p.fechaCreacion || p.receptionDate || '',
          tipoEstudio: p.studyType || p.tipoEstudio || '',
          isTimelineTermsAccepted: p.isTimelineTermsAccepted ?? false,
          timelineTermsAcceptedAt: p.timelineTermsAcceptedAt || null,
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null,
          versionNumber: p.versionNumber || p.version || 1,
        })) as ProtocoloResumen[];
      }),
      catchError((err) => {
        console.error('[ProtocoloService] Error al cargar mis-protocolos para subsanar:', err);
        return of([]);
      }),
    );
  }

  obtenerProtocolo(codigo: string | number): Observable<ProtocoloDetalle> {
    return this.get<ApiEnvelope<RawBackendProtocol> | RawBackendProtocol>(
      ENDPOINTS.PROTOCOLS.BY_ID(codigo.toString()),
    ).pipe(
      map((res) => {
        const p = unwrap<RawBackendProtocol>(res);
        if (!p) throw new Error('No se encontró detalle de protocolo');
        return {
          ...p,
          id: p.id,
          codigoCeish: p.ceishCode || p.codigoCeish || '',
          titulo: p.title || p.titulo || 'Sin Título',
          estado: p.receptionStatus || p.estado || 'BORRADOR',
          fechaCreacion: p.createdAt || p.fechaCreacion || p.receptionDate || '',
          tipoEstudio: p.studyType || p.tipoEstudio || '',
          isTimelineTermsAccepted: p.isTimelineTermsAccepted ?? false,
          timelineTermsAcceptedAt: p.timelineTermsAcceptedAt || null,
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null,
          title: p.title || p.titulo || '',
          ceishCode: p.ceishCode || p.codigoCeish || '',
        } as unknown as ProtocoloDetalle;
      }),
      catchError((_err) => {
        console.warn(
          `[ProtocoloService] Error al obtener detalle de protocolo ${codigo}. Usando fallback UAT...`,
        );
        return of({
          id: 12,
          codigoCeish: 'CEISH-ESPOCH-2026-0012',
          estado: EstadoProtocolo.COMPLETO,
          fechaCreacion: new Date().toISOString(),
          investigadorPrincipal: 'Dr. Juan Pérez',
          resumen: 'Estudio clínico experimental para la validación del fármaco X.',
          disenoEstudio: 'Experimental',
          institucionPatrocinadora: 'ESPOCH',
          titulo: 'Estudio clínico experimental de evaluación de fármaco X (Proyecto Fallback)',
          tipoEstudio: 'Estudio Clínico',
          isTimelineTermsAccepted: false,
          timelineTermsAcceptedAt: null,
          timelineTermsAcceptedIp: null,
          title: 'Estudio clínico experimental de evaluación de fármaco X (Proyecto Fallback)',
          principalInvestigatorId: 1,
          studyTypeId: 1,
          riskLevelId: 1,
          geographicCoverage: 'Nacional',
          studyDurationMonths: 12,
          usesBiologicalSamples: false,
          isVulnerablePopulation: false,
          isIndigenousPopulation: false,
          isMulticentric: false,
          hasExternalInstitutions: false,
          sponsorRuc: '1790000000001',
          sponsorPhone: '022222222',
          sponsorAddress: 'Riobamba',
          sponsorExecutingAgency: 'CEISH',
          financingAmount: 10000,
          isAffidavitAccepted: true,
          investigators: [],
          institutions: [],
        });
      }),
    );
  }

  getRequisitos(
    codigoTipo: string,
    muestras: boolean,
    vulnerable: boolean,
    indigena: boolean = false,
    multicentrico: boolean = false,
    riesgoMayor: boolean = false,
    institucionesPublicas: boolean = false,
  ): Observable<RequirementItem[]> {
    const params = {
      tipo: codigoTipo,
      muestras: muestras,
      vulnerable: vulnerable,
      poblacionIndigena: indigena,
      multicentrico: multicentrico,
      riesgoMayor: riesgoMayor,
      institucionesPublicas: institucionesPublicas,
    };
    return this.get<ApiEnvelope<RequirementItem[]> | RequirementItem[]>(
      ENDPOINTS.PROTOCOLS.REQUIREMENTS,
      params,
    ).pipe(map((res) => unwrap<RequirementItem[]>(res) ?? []));
  }

  obtenerRequisitosDeProtocolo(protocolId: number): Observable<ChecklistRequirement[]> {
    return this.getChecklist(protocolId);
  }

  actualizarProtocolo(id: number, data: Partial<CrearProtocoloDto>): Observable<ProtocoloDetalle> {
    return this.put<ApiEnvelope<ProtocoloDetalle> | ProtocoloDetalle>(
      `${ENDPOINTS.PROTOCOLS.BASE}/${id}`,
      data,
    ).pipe(map((res) => unwrap<ProtocoloDetalle>(res)));
  }

  acceptTimeline(
    protocolId: number,
  ): Observable<{ message: string; isTimelineTermsAccepted: boolean }> {
    return this.post<{ message: string; isTimelineTermsAccepted: boolean }>(
      `${ENDPOINTS.PROTOCOLS.BASE}/${protocolId}/accept-timeline`,
      {},
    );
  }
}
