import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IEvaluationRepositoryPort, ObservationEntry } from '@domain/ports/IEvaluationRepositoryPort';
import { ChecklistRequirement } from '@features/investigador/domain/dtos/crear-protocolo.dto';
import { IProtocolRepositoryPort, ProtocolDocumentHistoryEntry } from '@domain/ports/IProtocolRepositoryPort';
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
      observations: this.evalRepo.getProtocolObservations(String(protocolId)).pipe(
        switchMap((res: any) => {
          if (Array.isArray(res)) return [res];
          if (res && Array.isArray(res.observations)) return [res.observations];
          if (res && Array.isArray(res.data)) return [res.data];
          return [[]];
        })
      ),
      checklist: this.protocoloService.getChecklist(protocolId),
      documents: this.protocolRepo.getDocumentHistory(String(protocolId))
    });
  }
}
