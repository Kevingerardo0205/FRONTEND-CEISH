import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GetUploadUrlResponse, GetDownloadUrlResponse } from '@domain/entities/storage.interface';

interface UploadUrlApiResponse {
  data: GetUploadUrlResponse;
}

interface DownloadUrlApiResponse {
  data: GetDownloadUrlResponse;
}

@Injectable({
  providedIn: 'root'
})
export class S3StorageService {
  private http = inject(HttpClient);

  /**
   * Obtiene la URL firmada de subida (PUT)
   */
  getUploadUrl(key: string, contentType: string): Observable<GetUploadUrlResponse> {
    return this.http.post<UploadUrlApiResponse>(
      `${environment.apiUrl}/storage/upload-url`,
      { key, contentType }
    ).pipe(
      map(res => res.data || res as unknown as GetUploadUrlResponse)
    );
  }

  /**
   * Obtiene la URL firmada de visualización (GET) para un documento de recepción
   */
  getDocumentDownloadUrl(documentId: number): Observable<GetDownloadUrlResponse> {
    return this.http.get<DownloadUrlApiResponse>(
      `${environment.apiUrl}/reception/document/${documentId}/download-url`
    ).pipe(
      map(res => res.data || res as unknown as GetDownloadUrlResponse)
    );
  }

  /**
   * TAREA 5: Obtiene la URL firmada de visualización (GET) para un documento
   * de evaluación ya subido a R2/S3 usando su key relativa.
   * Ruta: POST /api/storage/download-url
   * @param key Ruta relativa en R2 — ej: protocols/83/docEvaluacion/informe_firmado.pdf
   */
  getEvaluationDocumentUrl(key: string): Observable<GetDownloadUrlResponse> {
    return this.http.post<DownloadUrlApiResponse>(
      `${environment.apiUrl}/storage/download-url`,
      { key }
    ).pipe(
      map(res => res.data || res as unknown as GetDownloadUrlResponse)
    );
  }

  /**
   * Sube el archivo binario a S3 reportando el progreso de carga
   */
  uploadFileToS3(uploadUrl: string, file: File): Observable<{ progress: number; success: boolean }> {
    const headers = new HttpHeaders({
      'Content-Type': file.type || 'application/pdf'
    });

    const req = new HttpRequest('PUT', uploadUrl, file, {
      headers: headers,
      reportProgress: true,
      responseType: 'text' // S3 PUT responde cuerpo vacío
    });

    return this.http.request(req).pipe(
      map((event: HttpEvent<unknown>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            return { progress, success: false };
          }
          case HttpEventType.Response:
            return { progress: 100, success: true };
          default:
            return { progress: 0, success: false };
        }
      })
    );
  }
}
