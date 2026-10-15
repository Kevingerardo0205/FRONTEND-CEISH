import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { resolveEstado } from '@shared/utils/estado.resolver';

interface ValidationQueues {
  pending: ProtocolEntity[];
  observed: ProtocolEntity[];
}

@Injectable({ providedIn: 'root' })
export class LoadValidationQueuesUseCase {
  private repo = inject(IProtocolRepositoryPort);

  execute(): Observable<ValidationQueues> {
    return this.repo.getReceptionProtocols().pipe(
      map(res => {
        const protocols = Array.isArray(res) ? res : [];
        return {
          pending: protocols.filter(p => {
            const core = resolveEstado(p.status);
            return core && ((core.categoria === 'RECEPCION' && ['INICIADO', 'EN_REVISION_SECRETARIA'].includes(core.code)) || core.code === 'EN_CONTROL_DOCUMENTAL');
          }),
          observed: protocols.filter(p => {
            const core = resolveEstado(p.status);
            return core && ['INCOMPLETO', 'REQUIERE_SUBSANACION_DOC', 'REQUIERE_SUBSANACION_VERSION'].includes(core.code);
          })
        };
      })
    );
  }
}
