import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import {
  IEvaluationRepositoryPort,
  ObservationEntry,
} from '@domain/ports/IEvaluationRepositoryPort';
import { ChecklistRequirement } from '@features/investigador/domain/dtos/crear-protocolo.dto';
import {
  IProtocolRepositoryPort,
  ProtocolDocumentHistoryEntry,
} from '@domain/ports/IProtocolRepositoryPort';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';
import { ProtocoloDetalle } from '@features/investigador/domain/dtos/crear-protocolo.dto';

@Injectable({ providedIn: 'root' })
export class LoadSubsanacionDetailUseCase {
  private evalRepo = inject(IEvaluationRepositoryPort);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private protocoloService = inject(ProtocoloService);

  execute(protocolId: number): Observable<{
    protocol: ProtocoloDetalle;
    observations: ObservationEntry[];
    checklist: ChecklistRequirement[];
    documents: ProtocolDocumentHistoryEntry[];
  }> {
    return forkJoin({
      protocol: this.protocoloService.obtenerProtocolo(protocolId),
      // F11 V14 (EP4): el adaptador ya entrega el arreglo, solo con perfil y dictamen de cada par.
      observations: this.evalRepo.getProtocolObservations(String(protocolId)),
      checklist: this.protocoloService.getChecklist(protocolId),
      documents: this.protocolRepo.getDocumentHistory(String(protocolId)),
    });
  }
}
