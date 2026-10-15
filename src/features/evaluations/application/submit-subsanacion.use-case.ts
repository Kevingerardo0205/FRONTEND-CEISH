import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';

@Injectable({ providedIn: 'root' })
export class SubmitSubsanacionUseCase {
  private protocoloService = inject(ProtocoloService);

  execute(protocolId: number): Observable<{ message?: string; success?: boolean; code?: string }> {
    return this.protocoloService.finalizarProtocolo(protocolId);
  }
}
