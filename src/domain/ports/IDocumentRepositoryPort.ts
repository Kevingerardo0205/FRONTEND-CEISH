import { Observable } from 'rxjs';

export abstract class IDocumentRepositoryPort {
  abstract validateDocument(documentId: string, statusId: number, observations: string, pageCount?: number | null): Observable<any>;
}
