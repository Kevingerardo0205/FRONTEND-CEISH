import { Observable } from 'rxjs';

export interface DocumentValidationResult {
  message: string;
  documentId?: number;
}

export interface DocumentUploadResult {
  documentId: number;
  fileName: string;
  path: string;
}

export interface Template {
  id?: number;
  code: string;
  name: string;
  filePath?: string;
  isActive?: boolean;
}

export abstract class IDocumentRepositoryPort {
  abstract validateDocument(
    documentId: string,
    statusId: number,
    observations: string,
    pageCount?: number | null,
  ): Observable<DocumentValidationResult>;
  abstract uploadDocument(file: File): Observable<DocumentUploadResult>;
  abstract getTemplates(): Observable<Template[]>;
  abstract downloadTemplate(code: string): Observable<{ downloadUrl: string }>;
  abstract createTemplateMetadata(code: string, name: string): Observable<Template>;
  abstract associateTemplateFile(code: string, path: string): Observable<{ message: string }>;
}
