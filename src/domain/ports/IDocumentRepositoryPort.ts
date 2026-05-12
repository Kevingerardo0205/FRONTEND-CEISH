import { Observable } from 'rxjs';

export abstract class IDocumentRepositoryPort {
  abstract validateDocument(documentId: string, statusId: number, observations: string): Observable<any>;
}
