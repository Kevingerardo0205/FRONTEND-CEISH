import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

interface ResolutionApiResponse {
  data: ResolutionEntity;
}

@Injectable({
  providedIn: 'root'
})
export class ResolutionApiAdapter extends IResolutionRepositoryPort {
  private apiClient = inject(ApiClientService);

  submitResolution(data: Partial<ResolutionEntity>): Observable<ResolutionEntity> {
    return this.apiClient.post<ResolutionEntity>(ENDPOINTS.RESOLUTIONS.BASE, data);
  }

  getResolutionByProtocolId(protocolId: string): Observable<ResolutionEntity | null> {
    return this.apiClient.get<ResolutionApiResponse>(`${ENDPOINTS.RESOLUTIONS.BASE}/protocol/${protocolId}`).pipe(
      map(res => res.data || (res as unknown as ResolutionEntity))
    );
  }
}
