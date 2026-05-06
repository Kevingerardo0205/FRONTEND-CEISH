import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ProtocolCode } from '@domain/value-objects/protocol-code.vo';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

@Injectable({
  providedIn: 'root'
})
export class ValidateDocumentaryUseCase {
  private repository = inject(IProtocolRepositoryPort);
  private notificationBroker = inject(NotificationBrokerService);

  execute(protocolId: string, isComplete: boolean, observations?: string): Observable<ProtocolEntity> {
    if (!isComplete) {
      return this.repository.getById(protocolId).pipe(
        map(protocol => ({
          ...protocol,
          status: ProtocolStatus.OBSERVED,
        })),
        tap(protocol => {
          this.repository.save(protocol).subscribe();
          this.notificationBroker.publish('PROTOCOL_OBSERVED', {
            investigatorId: protocol.investigatorId,
            protocolCode: protocol.code || 'S/N',
            observations: observations
          });
        })
      );
    }

    return this.repository.getById(protocolId).pipe(
      map(protocol => {
        const sequence = Math.floor(Math.random() * 900) + 1;
        const officialCode = ProtocolCode.create(protocol.type, sequence).getValue();

        return {
          ...protocol,
          code: officialCode,
          status: ProtocolStatus.VALIDATED,
          validationDate: new Date()
        };
      }),
      tap(updatedProtocol => {
        this.repository.save(updatedProtocol).subscribe();
        this.notificationBroker.publish('PROTOCOL_VALIDATED', {
          investigatorId: updatedProtocol.investigatorId,
          protocolCode: updatedProtocol.code,
          message: 'Su protocolo ha sido validado documentalmente y ha pasado a la etapa de asignación.'
        });
      })
    );
  }
}
