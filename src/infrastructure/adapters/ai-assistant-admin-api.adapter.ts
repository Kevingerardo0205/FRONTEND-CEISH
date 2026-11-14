import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  IAiAssistantAdminRepositoryPort,
  AiAssistantConfigSummary,
} from '@domain/ports/IAiAssistantAdminRepositoryPort';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

interface AiConfigApiResponse {
  data: { petFileName: string; allowedRoles: string[]; updatedAt: string };
}

interface UploadPetApiResponse {
  data: { message: string; petFileName: string; characterCount: number };
}

interface UpdateRolesApiResponse {
  data: { message: string; allowedRoles: string[] };
}

@Injectable({ providedIn: 'root' })
export class AiAssistantAdminApiAdapter implements IAiAssistantAdminRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getConfig(): Observable<AiAssistantConfigSummary> {
    return this.apiClient.get<AiConfigApiResponse>(ENDPOINTS.AI_ASSISTANT_ADMIN.CONFIG).pipe(
      map((res) => {
        const data = res.data || (res as unknown as AiConfigApiResponse['data']);
        return {
          petFileName: data.petFileName || '',
          allowedRoles: data.allowedRoles || [],
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
      }),
    );
  }

  uploadPet(
    file: File,
  ): Observable<{ message: string; petFileName: string; characterCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiClient
      .post<UploadPetApiResponse>(ENDPOINTS.AI_ASSISTANT_ADMIN.UPLOAD_PET, formData)
      .pipe(
        map((res) => {
          const data = res.data || (res as unknown as UploadPetApiResponse['data']);
          return {
            message: data.message || '',
            petFileName: data.petFileName || '',
            characterCount: data.characterCount || 0,
          };
        }),
      );
  }

  updateRoles(allowedRoles: string[]): Observable<{ message: string; allowedRoles: string[] }> {
    return this.apiClient
      .put<UpdateRolesApiResponse>(ENDPOINTS.AI_ASSISTANT_ADMIN.ROLES, { allowedRoles })
      .pipe(
        map((res) => {
          const data = res.data || (res as unknown as UpdateRolesApiResponse['data']);
          return {
            message: data.message || '',
            allowedRoles: data.allowedRoles || [],
          };
        }),
      );
  }
}
