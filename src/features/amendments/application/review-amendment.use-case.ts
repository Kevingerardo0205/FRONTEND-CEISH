import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAmendmentRepositoryPort } from '../domain/ports/amendment-repository.port';
import { AmendmentItem, ReviewAmendmentDTO } from '../domain/entities/amendment.entity';

@Injectable({ providedIn: 'root' })
export class ReviewAmendmentUseCase {
  private readonly repository = inject(IAmendmentRepositoryPort);

  execute(dto: ReviewAmendmentDTO): Observable<AmendmentItem> {
    return this.repository.reviewAmendment(dto);
  }
}
