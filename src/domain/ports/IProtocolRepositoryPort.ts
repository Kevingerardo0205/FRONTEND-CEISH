import { Observable } from 'rxjs';
import { ProtocolEntity, ValidationDetailResponse } from '../entities/protocol.entity';
import { ProtocolType } from '../enums/protocol-type.enum';

export abstract class IProtocolRepositoryPort {
  abstract getAll(): Observable<ProtocolEntity[]>;
  abstract save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity>;
  abstract getById(id: string): Observable<ProtocolEntity>;
  abstract uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity>;
  abstract getRequirementsByType(type: ProtocolType): Observable<string[]>;
  abstract getChecklist(id: string): Observable<any>;
  abstract getDocumentHistory(id: string): Observable<any[]>;
  abstract getReceptionProtocols(): Observable<ProtocolEntity[]>;
  abstract getProtocolsByStatus(status: string): Observable<ProtocolEntity[]>;
  abstract finalizeReception(id: string): Observable<any>;
  abstract getCertificate(id: string): Observable<Blob>;
  abstract finalizeValidation(protocolId: string): Observable<any>;
  abstract updateRequirementStatus(protocolId: string, reqId: string, status: string): Observable<any>;
  abstract verifyProtocol(protocolId: string, isComplete: boolean, missingItemsList: string): Observable<any>;
  abstract getValidationDetail(id: string): Observable<ValidationDetailResponse>;
}
