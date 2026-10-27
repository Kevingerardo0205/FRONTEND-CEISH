import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

@Injectable({
  providedIn: 'root',
})
export class GetAllProtocolsUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(): Observable<ProtocolEntity[]> {
    return this.repo.getAll();
  }
}
