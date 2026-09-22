import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

@Injectable({ providedIn: 'root' })
export class LoadProtocolByIdUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(id: string): Observable<ProtocolEntity> {
    return this.repo.getById(id);
  }
}
