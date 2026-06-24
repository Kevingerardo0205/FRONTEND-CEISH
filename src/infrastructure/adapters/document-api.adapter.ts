import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  getTemplates(): Observable<any[]> {
    return this.apiClient.get<any>(ENDPOINTS.DOCUMENTS.TEMPLATES).pipe(
      map(res => res.data || res)
    );
  }

  downloadTemplate(code: string): Observable<any> {
    return this.apiClient.get<any>(ENDPOINTS.DOCUMENTS.TEMPLATE_DOWNLOAD(code)).pipe(
      map(res => res.data || res)
    );
  }

  createTemplateMetadata(code: string, name: string): Observable<any> {
    return this.apiClient.post<any>(ENDPOINTS.DOCUMENTS.TEMPLATES, { code, name }).pipe(
      map(res => res.data || res)
    );
  }

  associateTemplateFile(code: string, path: string): Observable<any> {
    return this.apiClient.post<any>(ENDPOINTS.DOCUMENTS.TEMPLATE_FILE(code), { path }).pipe(
      map(res => res.data || res)
    );
  }
}
