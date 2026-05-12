import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({
  providedIn: 'root'
})
export class ProtocolApiAdapter extends IProtocolRepositoryPort {
  private apiClient = inject(ApiClientService);

  getAll(): Observable<ProtocolEntity[]> {
    return this.apiClient.get<any[]>(ENDPOINTS.PROTOCOLS.BASE).pipe(
      map(data => data.map(item => this.mapToEntity(item)))
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
    files.forEach(file => formData.append('files', file));
    return this.apiClient.post<any>(`/reception/protocol/${protocolId}/document`, formData).pipe(
      map(data => this.mapToEntity(data))
    );
  }

  getRequirementsByType(type: ProtocolType): Observable<string[]> {
    return this.apiClient.get<string[]>(`${ENDPOINTS.PROTOCOLS.BASE}/requirements/${type}`);
  }

  finalizeValidation(protocolId: string): Observable<any> {
    return this.apiClient.post(`/reception/protocol/${protocolId}/finalize`);
  }

  private mapToEntity(data: any): ProtocolEntity {
    return {
      id: data.id,
      title: data.title,
      investigatorId: data.investigatorId,
      type: data.type,
      status: data.status?.toUpperCase(),
      submissionDate: new Date(data.submissionDate),
      code: data.code,
      documents: data.documents || [],
      version: data.version
    };
  }
}
