import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICallRepositoryPort } from '@domain/ports/ICallRepositoryPort';
import { CallEntity, CreateCallDto } from '@domain/entities/call.entity';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

import { CallMapper } from '@infrastructure/mappers/call.mapper';

interface CallApiResponse<T> {
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CallApiAdapter extends ICallRepositoryPort {
  private apiClient = inject(ApiClientService);

  getPendingProtocols(): Observable<ProtocolEntity[]> {
    return this.apiClient.get<CallApiResponse<ProtocolEntity[]> | ProtocolEntity[]>(ENDPOINTS.CALLS.PENDING_PROTOCOLS).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return (res as CallApiResponse<ProtocolEntity[]>)?.data || [];
      })
    );
  }

  createCall(dto: CreateCallDto): Observable<CallEntity> {
    return this.apiClient.post<CallApiResponse<CallEntity> | CallEntity>(ENDPOINTS.CALLS.BASE, dto).pipe(
      map(res => {
        const rawData = ('data' in (res as CallApiResponse<CallEntity>) && (res as CallApiResponse<CallEntity>).data) 
          ? (res as CallApiResponse<CallEntity>).data! 
          : res;
        return CallMapper.toDomain(rawData);
      })
    );
  }

  getCalls(): Observable<CallEntity[]> {
    return this.apiClient.get<CallApiResponse<CallEntity[]> | CallEntity[]>(ENDPOINTS.CALLS.BASE).pipe(
      map(res => CallMapper.toDomainList(res))
    );
  }

  getCallById(id: number | string): Observable<CallEntity> {
    return this.apiClient.get<CallApiResponse<CallEntity> | CallEntity>(ENDPOINTS.CALLS.BY_ID(id)).pipe(
      map(res => {
        const rawData = ('data' in (res as CallApiResponse<CallEntity>) && (res as CallApiResponse<CallEntity>).data)
          ? (res as CallApiResponse<CallEntity>).data!
          : res;
        return CallMapper.toDomain(rawData);
      })
    );
  }

  getCallProtocols(id: number | string): Observable<ProtocolEntity[]> {
    return this.apiClient.get<CallApiResponse<ProtocolEntity[]> | ProtocolEntity[]>(ENDPOINTS.CALLS.PROTOCOLS_BY_ID(id)).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return (res as CallApiResponse<ProtocolEntity[]>)?.data || [];
      })
    );
  }
}
