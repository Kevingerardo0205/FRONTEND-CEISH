import { Observable } from 'rxjs';
import { CallEntity, CreateCallDto } from '@domain/entities/call.entity';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

export abstract class ICallRepositoryPort {
  abstract getPendingProtocols(): Observable<ProtocolEntity[]>;
  abstract createCall(dto: CreateCallDto): Observable<CallEntity>;
  abstract getCalls(): Observable<CallEntity[]>;
  abstract getCallById(id: number | string): Observable<CallEntity>;
  abstract getCallProtocols(id: number | string): Observable<ProtocolEntity[]>;
}
