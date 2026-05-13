import { Observable } from 'rxjs';
import { ProtocolEntity } from '../entities/protocol.entity';
import { ProtocolType } from '../enums/protocol-type.enum';

export abstract class IProtocolRepositoryPort {
  abstract getAll(): Observable<ProtocolEntity[]>;
  abstract save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity>;
  abstract getById(id: string): Observable<ProtocolEntity>;
  abstract uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity>;
  abstract getRequirementsByType(type: ProtocolType): Observable<string[]>;
  abstract getChecklist(id: string): Observable<any>;
  abstract finalizeReception(id: string): Observable<any>;
  abstract getCertificate(id: string): Observable<Blob>;
  abstract finalizeValidation(protocolId: string): Observable<any>;
}
