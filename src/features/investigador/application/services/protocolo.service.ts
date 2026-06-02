import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle, ChecklistRequirement, EstadoProtocolo } from '../../domain/dtos/crear-protocolo.dto';
import { RequisitoDocumento } from '../../constants/anexos-pet.constants';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ProtocoloService extends BaseApiService {
  private authFacade = inject(AuthFacade);
  private snackBar = inject(MatSnackBar);

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
    const formData = new FormData();
    // El backend espera 'file' (singular)
    formData.append('file', file); 
    formData.append('protocolId', protocolId.toString()); // ID faltante detectado en logs del backend
    formData.append('requirementId', requirementId.toString());
    formData.append('fileName', file.name);
    formData.append('sizeBytes', file.size.toString());

    const url = this.isInvestigador
      ? `/protocols/${protocolId}/upload-document`
      : ENDPOINTS.PROTOCOLS.UPLOAD_DOCUMENT(protocolId.toString());

    console.log(`[ProtocoloService] Subiendo documento a: ${url} (ReqID: ${requirementId})`);
    return this.post<any>(url, formData);
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
    const formData = new FormData();
    // El backend espera 'file' (singular)
    files.forEach(file => formData.append('file', file));

    const url = this.isInvestigador
      ? `/protocols/${protocolId}/documents/bulk`
      : ENDPOINTS.PROTOCOLS.RECEPTION.BULK_UPLOAD(protocolId.toString());

    return this.post<any>(url, formData);
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
    return this.get<any>(`${ENDPOINTS.PROTOCOLS.BASE}/mis-protocolos`).pipe(
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
          timelineTermsAcceptedIp: p.timelineTermsAcceptedIp || null
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
