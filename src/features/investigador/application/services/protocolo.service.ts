import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle } from '../../domain/dtos/crear-protocolo.dto';
import { RequisitoDocumento } from '../../constants/anexos-pet.constants';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({ providedIn: 'root' })
export class ProtocoloService extends BaseApiService {

  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * Obtener tipos de estudio dinámicos del backend
   */
  getStudyTypes(): Observable<any[]> {
    return this.get<any[]>('/protocols/study-types');
  }

  /**
   * Obtener niveles de riesgo dinámicos
   */
  getRiskLevels(): Observable<any[]> {
    return this.get<any[]>('/protocols/risk-levels');
  }

  /**
   * 1. Obtener lista dinámica de documentos requeridos (Simulado/Estático)
   */
  getRequisitos(codigoTipo: string, muestras: boolean, vulnerable: boolean, indigena: boolean = false): Observable<RequisitoDocumento[]> {
    const params = {
      tipo: codigoTipo,
      hasSamples: muestras,
      isVulnerable: vulnerable,
      isIndigenous: indigena
    };
    
    return this.get<RequisitoDocumento[]>('/protocols/requirements', params);
  }

  /**
   * Obtener el Checklist REAL desde el módulo de Recepción (Sprint 1)
   * Este endpoint devuelve los requisitos que el backend exige para este protocolo específico.
   */
  getChecklist(protocolId: number): Observable<any> {
    return this.get<any>(ENDPOINTS.PROTOCOLS.RECEPTION.CHECKLIST(protocolId.toString()));
  }

  /**
   * 2. Guardado Inicial (Paso 1, 2 y 3)
   */
  guardarProtocoloInicial(data: CrearProtocoloDto): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>(ENDPOINTS.PROTOCOLS.RECEPTION.CREATE, data);
  }

  /**
   * 3. Subida de Archivos (Paso 4)
   * Soporta carga masiva según el nuevo endpoint del Sprint 1
   */
  subirDocumento(data: any): Observable<any> {
    return this.post<any>(ENDPOINTS.DOCUMENTS.BASE, data);
  }

  subirDocumentosBulk(protocolId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.post<any>(ENDPOINTS.PROTOCOLS.RECEPTION.BULK_UPLOAD(protocolId.toString()), formData);
  }

  /**
   * 4. Cierre y Generación de Código CEISH (Paso 5)
   */
  finalizarProtocolo(protocolId: number): Observable<any> {
    return this.post<any>(ENDPOINTS.PROTOCOLS.RECEPTION.FINALIZE(protocolId.toString()), {});
  }

  misProtocolos(): Observable<ProtocoloResumen[]> {
    return this.get<ProtocoloResumen[]>('/protocols/mis-protocolos');
  }

  obtenerProtocolo(codigo: string | number): Observable<ProtocoloDetalle> {
    return this.get<ProtocoloDetalle>(`${ENDPOINTS.PROTOCOLS.BASE}/${codigo}`);
  }

  /**
   * @deprecated Usar getChecklist
   */
  obtenerRequisitosDeProtocolo(protocolId: number): Observable<any[]> {
    return this.getChecklist(protocolId);
  }

  /**
   * @deprecated
   */
  crearProtocolo(formData: FormData): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>(ENDPOINTS.PROTOCOLS.BASE, formData);
  }
}
