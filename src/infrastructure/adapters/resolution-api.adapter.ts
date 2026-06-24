import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({
  providedIn: 'root'
})
export class ResolutionApiAdapter extends IResolutionRepositoryPort {
  private apiClient = inject(ApiClientService);

  submitResolution(data: any): Observable<ResolutionEntity> {
    return this.apiClient.post<ResolutionEntity>(ENDPOINTS.RESOLUTIONS.BASE, data);
  }

  getResolutionByProtocolId(protocolId: string): Observable<any> {
    return this.apiClient.get<any>(`${ENDPOINTS.RESOLUTIONS.BASE}/protocol/${protocolId}`).pipe(
      map(res => res.data || res)
    );
  }
}
