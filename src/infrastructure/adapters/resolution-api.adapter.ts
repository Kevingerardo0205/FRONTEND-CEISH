import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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
}
