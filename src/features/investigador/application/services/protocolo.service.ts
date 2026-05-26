import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle, ChecklistRequirement } from '../../domain/dtos/crear-protocolo.dto';
import { RequisitoDocumento } from '../../constants/anexos-pet.constants';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { AuthFacade } from '@features/auth/facades/auth.facade';

@Injectable({ providedIn: 'root' })
export class ProtocoloService extends BaseApiService {
  private authFacade = inject(AuthFacade);

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
    return this.get<any[]>(`${ENDPOINTS.PROTOCOLS.BASE}/study-types`);
  }

  /**
   * Obtener niveles de riesgo dinámicos
   */
  getRiskLevels(): Observable<any[]> {
    return this.get<any[]>(`${ENDPOINTS.PROTOCOLS.BASE}/risk-levels`);
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
    
    return this.get<any[]>(url).pipe(
      catchError((err) => {
        console.warn(`[ProtocoloService] Error en checklist oficial (${url}), intentando desde detalle...`, err);
        return this.obtenerProtocolo(protocolId).pipe(
          map((protocol: any) => {
            return protocol.checklist || protocol.requirements || protocol.protocolo_requisitos || [];
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
    return this.get<any[]>(url);
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
    return this.get<ProtocoloResumen[]>(`${ENDPOINTS.PROTOCOLS.BASE}/mis-protocolos`);
  }

  obtenerProtocolo(codigo: string | number): Observable<ProtocoloDetalle> {
    return this.get<ProtocoloDetalle>(ENDPOINTS.PROTOCOLS.BY_ID(codigo.toString()));
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
    return this.get<any[]>(ENDPOINTS.PROTOCOLS.REQUIREMENTS, params);
  }

  obtenerRequisitosDeProtocolo(protocolId: number): Observable<ChecklistRequirement[]> {
    return this.getChecklist(protocolId);
  }

  actualizarProtocolo(id: number, data: Partial<CrearProtocoloDto>): Observable<any> {
    return this.put<any>(`${ENDPOINTS.PROTOCOLS.BASE}/${id}`, data);
  }
}
