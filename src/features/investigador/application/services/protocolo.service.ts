import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@infrastructure/api/base-api.service';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle } from '../../domain/dtos/crear-protocolo.dto';
import { RequisitoDocumento } from '../../constants/anexos-pet.constants';

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
   * 1. Obtener lista dinámica de documentos requeridos
   * Ahora usa el código del tipo de estudio (IO, EI, EC)
   * Enviamos varios formatos de parámetros para asegurar compatibilidad
   */
  getRequisitos(codigoTipo: string, muestras: boolean, vulnerable: boolean): Observable<RequisitoDocumento[]> {
    const params = {
      tipo: codigoTipo,
      studyType: codigoTipo,
      muestras: muestras ? 1 : 0,
      vulnerable: vulnerable ? 1 : 0,
      hasSamples: muestras,
      isVulnerable: vulnerable
    };
    
    return this.get<RequisitoDocumento[]>('/protocols/requirements', params);
  }

  /**
   * 2. Guardado Inicial (Paso 1, 2 y 3)
   */
  guardarProtocoloInicial(data: CrearProtocoloDto): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>('/protocols', data);
  }

  /**
   * 3. Subida de Archivos (Paso 4)
   * AHORA RECIBE JSON (Simulación hasta que backend tenga Multer)
   */
  subirDocumento(data: any): Observable<any> {
    return this.post<any>('/documents', data);
  }

  /**
   * 4. Cierre y Generación de Código CEISH (Paso 5)
   */
  finalizarProtocolo(protocolId: number): Observable<any> {
    return this.post<any>('/reception/verify', { protocolId, isComplete: true });
  }

  misProtocolos(): Observable<ProtocoloResumen[]> {
    return this.get<ProtocoloResumen[]>('/protocols/mis-protocolos');
  }

  obtenerProtocolo(codigo: string | number): Observable<ProtocoloDetalle> {
    return this.get<ProtocoloDetalle>(`/protocols/${codigo}`);
  }

  /**
   * Obtener requisitos específicos de un protocolo ya creado
   */
  obtenerRequisitosDeProtocolo(protocolId: number): Observable<any[]> {
    return this.get<any[]>(`/protocols/${protocolId}/requirements`);
  }

  /**
   * @deprecated
   */
  crearProtocolo(formData: FormData): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>('/protocols', formData);
  }
}
