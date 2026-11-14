import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
  IDocumentRepositoryPort,
  DocumentValidationResult,
} from '@domain/ports/IDocumentRepositoryPort';
import { ValidationChecklistItem } from '@domain/entities/protocol.entity';

@Injectable({ providedIn: 'root' })
export class ValidateChecklistItemUseCase {
  private docRepo = inject(IDocumentRepositoryPort);

  execute(
    item: ValidationChecklistItem,
    actionType: number,
    observations: string,
  ): Observable<DocumentValidationResult> {
    if (!item.attachedDocument) {
      return throwError(() => new Error('No hay documento adjunto para validar'));
    }

    let pages = item.attachedDocument.pageCount;
    if (pages === null || pages === undefined) {
      pages = item.attachedDocument.originalPageCount || 1;
    }

    if (pages <= 0 || !Number.isInteger(pages)) {
      return throwError(() => new Error('El número de páginas debe ser un entero mayor a 0'));
    }

    if (actionType === 2 && (!observations || observations.trim().length < 5)) {
      return throwError(() => new Error('El motivo de rechazo requiere mínimo 5 caracteres'));
    }

    return this.docRepo.validateDocument(
      item.attachedDocument.id.toString(),
      actionType,
      observations || '',
      pages,
    );
  }
}
