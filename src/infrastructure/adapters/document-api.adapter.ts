import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IDocumentRepositoryPort,
  DocumentValidationResult,
  DocumentUploadResult,
  Template,
} from '@domain/ports/IDocumentRepositoryPort';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '../api/endpoints.constant';

@Injectable({
  providedIn: 'root',
})
export class DocumentApiAdapter extends IDocumentRepositoryPort {
  private apiClient = inject(ApiClientService);

  validateDocument(
    documentId: string,
    statusId: number,
    observations: string,
    pageCount?: number | null,
  ): Observable<DocumentValidationResult> {
    return this.apiClient.post<DocumentValidationResult>(
      `/reception/document/${documentId}/validate`,
      {
        statusId,
        observations,
        pageCount,
      },
    );
  }

  uploadDocument(file: File): Observable<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post<DocumentUploadResult>(ENDPOINTS.DOCUMENTS.UPLOAD, formData);
  }

  getTemplates(): Observable<Template[]> {
    return this.apiClient.get<unknown>(ENDPOINTS.DOCUMENTS.TEMPLATES).pipe(
      map((res: unknown) => {
        const body = res as { data?: Template[] };
        return body.data ?? (res as Template[]);
      }),
    );
  }

  downloadTemplate(code: string): Observable<{ downloadUrl: string }> {
    return this.apiClient.get<unknown>(ENDPOINTS.DOCUMENTS.TEMPLATE_DOWNLOAD(code)).pipe(
      map((res: unknown) => {
        const body = res as { data?: { downloadUrl: string } };
        return body.data ?? (res as { downloadUrl: string });
      }),
    );
  }

  createTemplateMetadata(code: string, name: string): Observable<Template> {
    return this.apiClient.post<unknown>(ENDPOINTS.DOCUMENTS.TEMPLATES, { code, name }).pipe(
      map((res: unknown) => {
        const body = res as { data?: Template };
        return body.data ?? (res as Template);
      }),
    );
  }

  associateTemplateFile(code: string, path: string): Observable<{ message: string }> {
    return this.apiClient.post<unknown>(ENDPOINTS.DOCUMENTS.TEMPLATE_FILE(code), { path }).pipe(
      map((res: unknown) => {
        const body = res as { data?: { message: string } };
        return body.data ?? (res as { message: string });
      }),
    );
  }
}
