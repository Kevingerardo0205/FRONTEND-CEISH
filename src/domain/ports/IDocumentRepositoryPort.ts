import { Observable } from 'rxjs';

export abstract class IDocumentRepositoryPort {
  abstract validateDocument(documentId: string, statusId: number, observations: string, pageCount?: number | null): Observable<any>;
  abstract uploadDocument(file: File): Observable<any>;
  abstract getTemplates(): Observable<any[]>;
  abstract downloadTemplate(code: string): Observable<{ downloadUrl: string } | any>;
  abstract createTemplateMetadata(code: string, name: string): Observable<any>;
  abstract associateTemplateFile(code: string, path: string): Observable<any>;
}
