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
   */
  getRequisitos(tipo: string, muestras: boolean, vulnerable: boolean): Observable<RequisitoDocumento[]> {
    const params = {
      tipo,
      muestras: muestras.toString(),
      vulnerable: vulnerable.toString()
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
   */
  subirDocumento(formData: FormData): Observable<any> {
    return this.post<any>('/documents', formData);
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

  obtenerProtocolo(codigo: string): Observable<ProtocoloDetalle> {
    return this.get<ProtocoloDetalle>(`/protocols/${codigo}`);
  }

  /**
   * @deprecated
   */
  crearProtocolo(formData: FormData): Observable<ProtocoloCreadoResponse> {
    return this.post<ProtocoloCreadoResponse>('/protocols', formData);
  }
}
