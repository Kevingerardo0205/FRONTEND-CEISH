import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IAiAssistantRepositoryPort, ChatHistoryItem } from '@domain/ports/IAiAssistantRepositoryPort';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({ providedIn: 'root' })
export class AiAssistantApiAdapter implements IAiAssistantRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  chat(
    message: string,
    protocolId?: number,
    history?: ChatHistoryItem[]
  ): Observable<{ response: string }> {
    const payload = {
      message,
      protocolId,
      history
    };
    return this.apiClient.post<any>(ENDPOINTS.AI_ASSISTANT, payload).pipe(
      map(res => {
        const data = res.data || res;
        return { response: data.response || '' };
      })
    );
  }

  getAllowedRoles(): Observable<{ allowedRoles: string[] }> {
    return this.apiClient.get<any>(ENDPOINTS.AI_ASSISTANT_ALLOWED_ROLES).pipe(
      map(res => {
        const data = res.data || res;
        return { allowedRoles: data.allowedRoles || [] };
      })
    );
  }
}
