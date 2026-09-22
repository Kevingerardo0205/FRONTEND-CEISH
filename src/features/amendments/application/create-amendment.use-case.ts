import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IAmendmentRepositoryPort } from '../domain/ports/amendment-repository.port';
import { AmendmentItem, CreateAmendmentDTO } from '../domain/entities/amendment.entity';

@Injectable({ providedIn: 'root' })
export class CreateAmendmentUseCase {
  private readonly repository = inject(IAmendmentRepositoryPort);

  execute(dto: CreateAmendmentDTO): Observable<AmendmentItem> {
    return this.repository.createAmendment(dto);
  }
}
