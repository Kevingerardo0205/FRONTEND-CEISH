import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ProtocolCode } from '@domain/value-objects/protocol-code.vo';

@Injectable({
  providedIn: 'root'
})
export class ValidateDocumentaryUseCase {
  private repository = inject(IProtocolRepositoryPort);

  execute(protocolId: string, isComplete: boolean, observations?: string): Observable<ProtocolEntity> {
    if (!isComplete) {
      // Si está incompleto, se marca como OBSERVADO (HU-003)
      return this.repository.save({
        id: protocolId,
        status: ProtocolStatus.OBSERVED,
        // En un caso real aquí se dispararía el plazo de 15 días
      } as any);
    }

    // Si está completo, se genera el código oficial
    return this.repository.getById(protocolId).pipe(
      map(protocol => {
        // Simulamos una secuencia obtenida del backend (ej: 42)
        const sequence = Math.floor(Math.random() * 900) + 1;
        const officialCode = ProtocolCode.create(protocol.type, sequence).getValue();

        return {
          ...protocol,
          code: officialCode,
          status: ProtocolStatus.VALIDATED,
          validationDate: new Date()
        };
      }),
      map(updatedProtocol => {
        this.repository.save(updatedProtocol).subscribe();
        return updatedProtocol as ProtocolEntity;
      })
    );
  }
}
