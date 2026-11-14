import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { resolveEstado } from '@shared/utils/estado.resolver';

@Injectable({ providedIn: 'root' })
export class LoadReceptionProtocolsUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(): Observable<ProtocolEntity[]> {
    return this.repo.getReceptionProtocols().pipe(
      map((data) => {
        const list = Array.isArray(data) ? data : [];
        return list.filter((p) => {
          const core = resolveEstado(p.status);
          return (
            core &&
            core.categoria === 'RECEPCION' &&
            core.code !== 'COMPLETO' &&
            core.code !== 'ARCHIVADO_VENCIMIENTO'
          );
        });
      }),
    );
  }
}
