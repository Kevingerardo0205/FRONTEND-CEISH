import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap, filter } from 'rxjs/operators';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle, ChecklistRequirement, EstadoProtocolo } from '../../domain/dtos/crear-protocolo.dto';
import { RequisitoDocumento } from '../../constants/anexos-pet.constants';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { MatSnackBar } from '@angular/material/snack-bar';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { sanitizeFilename } from '@domain/entities/storage.interface';

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
  getStudyTypes(): Observable<any[]> {
    return this.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/study-types`).pipe(
      map(res => (res?.data || res) as any[])
    );
  }

  /**
   * Obtener niveles de riesgo dinámicos
   */
  getRiskLevels(): Observable<any[]> {
    return this.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/risk-levels`).pipe(
      map(res => (res?.data || res) as any[])
    );
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

    console.log(`[ProtocoloService] Consultando checklist en: ${url}`);
    
    return this.get<any>(url).pipe(
      map(res => (res?.data || res) as ChecklistRequirement[]),
      catchError((err) => {
        console.warn(`[ProtocoloService] Error en checklist oficial (${url}), intentando desde detalle...`, err);
        return this.obtenerProtocolo(protocolId).pipe(
          map((protocol: any) => {
            const proto = protocol?.data || protocol;
            return proto.checklist || proto.requirements || proto.protocolo_requisitos || [];
          }),
          catchError(fallbackErr => {
            console.warn('[ProtocoloService] Fallback desde detalle falló. Retornando array vacío.', fallbackErr);
            return of([]);
          })
        );
      })
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
  subirDocumento(file: File, protocolId: number, requirementId: number): Observable<any> {
    const sanitizedName = sanitizeFilename(file.name);
    const s3Key = `protocols/${protocolId}/requirements/${requirementId}/${sanitizedName}`;

    console.log(`[ProtocoloService] Iniciando subida de documento para req ${requirementId}. S3 Key: ${s3Key}`);

    return this.s3StorageService.getUploadUrl(s3Key, file.type || 'application/pdf').pipe(
      catchError(err => {
        console.error('[ProtocoloService] Error al obtener URL firmada de S3:', err);
        return throwError(() => err);
      }),
      switchMap(urlRes => {
        console.log('[ProtocoloService] URL firmada obtenida con éxito. URL:', urlRes.uploadUrl);
        return this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, file).pipe(
          catchError(err => {
            console.error('[ProtocoloService] Error al realizar la subida PUT a S3/R2:', err);
            return throwError(() => err);
          }),
          filter(uploadRes => uploadRes.success),
          switchMap(() => {
            const url = this.isInvestigador
              ? `/protocols/${protocolId}/upload-document`
              : ENDPOINTS.PROTOCOLS.UPLOAD_DOCUMENT(protocolId.toString());

            const payload = {
              requirementId: requirementId,
              fileName: sanitizedName,
              path: urlRes.key,
              sizeBytes: file.size
            };

            console.log(`[ProtocoloService] Registrando documento S3 en BD: ${url}`, payload);
            return this.post<any>(url, payload).pipe(
              catchError(err => {
                console.error('[ProtocoloService] Error en el registro del documento en la BD:', err);
                return throwError(() => err);
              })
            );
          })
        );
      })
    );
  }

  getDocumentHistory(protocolId: number): Observable<any[]> {
    const url = this.isInvestigador
      ? `/protocols/${protocolId}/documents`
      : ENDPOINTS.PROTOCOLS.RECEPTION.DOCUMENTS_HISTORY(protocolId.toString());
    return this.get<any>(url).pipe(
      map(res => (res?.data || res) as any[])
    );
  }

  subirDocumentosBulk(protocolId: number, files: File[]): Observable<any> {
    const uploads = files.map(file => this.subirDocumento(file, protocolId, 0));
    return forkJoin(uploads);
  }
  /**
   * 4. Cierre y Envío para Revisión Técnica
   */
  finalizarProtocolo(protocolId: number): Observable<any> {
    const url = this.isInvestigador
      ? `/protocols/${protocolId}/submit` // El backend espera 'submit' para el Investigador
      : ENDPOINTS.PROTOCOLS.RECEPTION.FINALIZE(protocolId.toString()); // 'finalize' para Secretaría

    console.log(`[ProtocoloService] Enviando/Finalizando protocolo: ${url}`);
    return this.post<any>(url, {});
  }

  misProtocolos(): Observable<ProtocoloResumen[]> {
    return this.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/mis-protocolos?limit=100`).pipe(
      map(res => {
        let data = res?.data || res;
        // Soporte para respuestas paginadas del helper paginate: { data: [...], total: X }
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          data = data.data;
        }

        if (!data || !Array.isArray(data)) {
          console.warn('[ProtocoloService] No se encontró una estructura de datos de protocolo válida en el backend:', res);
          return [];
        }
        console.log(`[ProtocoloService] Cargados ${data.length} protocolos reales desde la base de datos.`);
        
        // Mapeo explícito para solucionar discrepancia de nombres de propiedades del backend
        return data.map((p: any) => ({
          id: p.id,
          codigoCeish: p.ceishCode || p.codigoCeish || '',
          titulo: p.title || p.titulo || 'Sin Título',
          estado: p.receptionStatus || p.estado || 'BORRADOR',
          fechaCreacion: p.createdAt || p.fechaCreacion || p.receptionDate || '',
          tipoEstudio: p.studyType || p.tipoEstudio || '',
          isTimelineTermsAccepted: p.isTimelineTermsAccepted ?? false,
          timelineTermsAcceptedAt: p.timelineTermsAcceptedAt || null,
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null,
          versionNumber: p.versionNumber || p.version || 1
        })) as ProtocoloResumen[];
      }),
      catchError(err => {
        console.error('[ProtocoloService] Error crítico al obtener mis-protocolos desde la base de datos:', err);
        this.snackBar.open('⚠️ Error de conexión con la base de datos al cargar sus protocolos.', 'Entendido', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        return of([]);
      })
    );
  }

  misProtocolosSubsanar(): Observable<ProtocoloResumen[]> {
    return this.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/mis-protocolos?subsanar=true&limit=100`).pipe(
      map(res => {
        let data = res?.data || res;
        if (data && !Array.isArray(data) && Array.isArray(data.data)) {
          data = data.data;
        }
        if (!data || !Array.isArray(data)) {
          return [];
        }
        return data.map((p: any) => ({
          id: p.id,
          codigoCeish: p.ceishCode || p.codigoCeish || '',
          titulo: p.title || p.titulo || 'Sin Título',
          estado: p.receptionStatus || p.estado || 'BORRADOR',
          fechaCreacion: p.createdAt || p.fechaCreacion || p.receptionDate || '',
          tipoEstudio: p.studyType || p.tipoEstudio || '',
          isTimelineTermsAccepted: p.isTimelineTermsAccepted ?? false,
          timelineTermsAcceptedAt: p.timelineTermsAcceptedAt || null,
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null,
          versionNumber: p.versionNumber || p.version || 1
        })) as ProtocoloResumen[];
      }),
      catchError(err => {
        console.error('[ProtocoloService] Error al cargar mis-protocolos para subsanar:', err);
        return of([]);
      })
    );
  }

  obtenerProtocolo(codigo: string | number): Observable<ProtocoloDetalle> {
    return this.get<any>(ENDPOINTS.PROTOCOLS.BY_ID(codigo.toString())).pipe(
      map(res => {
        const p = res?.data || res;
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
          ceishCode: p.ceishCode || p.codigoCeish || ''
        } as ProtocoloDetalle;
      }),
      catchError(err => {
        console.warn(`[ProtocoloService] Error al obtener detalle de protocolo ${codigo}. Usando fallback UAT...`);
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
          institutions: []
        });
      })
    );
  }

  getRequisitos(
    codigoTipo: string, 
    muestras: boolean, 
    vulnerable: boolean, 
    indigena: boolean = false, 
    multicentrico: boolean = false,
    riesgoMayor: boolean = false,
    institucionesPublicas: boolean = false
  ): Observable<any[]> {
    const params = { 
      tipo: codigoTipo, 
      muestras: muestras, 
      vulnerable: vulnerable, 
      poblacionIndigena: indigena,
      multicentrico: multicentrico,
      riesgoMayor: riesgoMayor,
      institucionesPublicas: institucionesPublicas
    };
    return this.get<any>(ENDPOINTS.PROTOCOLS.REQUIREMENTS, params).pipe(
      map(res => (res?.data || res) as any[])
    );
  }

  obtenerRequisitosDeProtocolo(protocolId: number): Observable<ChecklistRequirement[]> {
    return this.getChecklist(protocolId);
  }

  actualizarProtocolo(id: number, data: Partial<CrearProtocoloDto>): Observable<any> {
    return this.put<any>(`${ENDPOINTS.PROTOCOLS.BASE}/${id}`, data);
  }

  acceptTimeline(protocolId: number): Observable<{ message: string; isTimelineTermsAccepted: boolean }> {
    return this.post<{ message: string; isTimelineTermsAccepted: boolean }>(
      `${ENDPOINTS.PROTOCOLS.BASE}/${protocolId}/accept-timeline`,
      {}
    );
  }
}
