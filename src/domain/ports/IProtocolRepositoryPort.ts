import { Observable } from 'rxjs';
import { ProtocolEntity, ValidationDetailResponse } from '../entities/protocol.entity';
import { ProtocolType } from '../enums/protocol-type.enum';

export interface ChecklistItem {
  id: number;
  code: string;
  name: string;
  status: string;
  observations?: string | null;
}

export interface ProtocolDocumentHistoryEntry {
  id: number;
  fileName: string;
  uploadedAt: string;
  status?: string;
  name?: string;
  title?: string;
  type?: string;
  url?: string;
  sizeBytes?: number;
  path?: string;
  version?: number;
}

export interface RiskLevel {
  id: number;
  name: string;
  description?: string;
}

export abstract class IProtocolRepositoryPort {
  abstract getAll(): Observable<ProtocolEntity[]>;
  abstract save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity>;
  abstract getById(id: string): Observable<ProtocolEntity>;
  abstract uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity>;
  abstract getRequirementsByType(type: ProtocolType): Observable<string[]>;
  abstract getChecklist(id: string): Observable<ChecklistItem[]>;
  abstract getDocumentHistory(id: string): Observable<ProtocolDocumentHistoryEntry[]>;
  abstract getReceptionProtocols(status?: string): Observable<ProtocolEntity[]>;
  abstract getProtocolsByStatus(status: string): Observable<ProtocolEntity[]>;
  abstract finalizeReception(id: string): Observable<{ message?: string }>;
  abstract getCertificate(id: string): Observable<Blob>;
  abstract finalizeValidation(protocolId: string): Observable<{ message?: string }>;
  abstract updateRequirementStatus(protocolId: string, reqId: string, status: string): Observable<{ message?: string }>;
  abstract verifyProtocol(protocolId: string, isComplete: boolean, missingItemsList: string): Observable<{ message?: string }>;
  abstract getValidationDetail(id: string): Observable<ValidationDetailResponse>;
  abstract acceptTimeline(id: string): Observable<{ message?: string }>;
  abstract getRiskLevels(): Observable<RiskLevel[]>;
  abstract getProtocolsByStatusId(statusId: number): Observable<ProtocolEntity[]>;
}
