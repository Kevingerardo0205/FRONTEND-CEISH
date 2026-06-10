import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';

@Injectable({
  providedIn: 'root'
})
export class DocumentApiAdapter extends IDocumentRepositoryPort {
  private apiClient = inject(ApiClientService);

  validateDocument(documentId: string, statusId: number, observations: string, pageCount?: number | null): Observable<any> {
    return this.apiClient.post(`/reception/document/${documentId}/validate`, {
      statusId,
      observations,
      pageCount
    });
  }

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post<any>(ENDPOINTS.DOCUMENTS.UPLOAD, formData);
  }
}
