import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

/** Lo que el formulario de asignación muestra del protocolo (F03 §3), de `GET /protocols/:id`. */
export interface AssignmentProtocolSummary {
  id: number;
  code: string | null;
  title: string | null;
  isTimelineTermsAccepted: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoadAssignmentProtocolUseCase {
  private readonly repo = inject(IProtocolRepositoryPort);

  execute(protocolId: number): Observable<AssignmentProtocolSummary> {
    return this.repo.getById(String(protocolId)).pipe(
      map((p) => ({
        id: protocolId,
        code: p.code?.trim() ? p.code : null,
        title: p.title?.trim() ? p.title : null,
        isTimelineTermsAccepted: p.isTimelineTermsAccepted === true,
      })),
    );
  }
}
