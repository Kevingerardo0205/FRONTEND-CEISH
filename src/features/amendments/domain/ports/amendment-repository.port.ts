import { Observable } from 'rxjs';
import {
  AmendmentItem,
  CreateAmendmentDTO,
  ReviewAmendmentDTO,
} from '../entities/amendment.entity';

export interface ApprovedProtocolOption {
  id: string;
  code: string;
  title: string;
  investigatorName: string;
  approvalDate?: string;
  currentVersion: number;
}

export abstract class IAmendmentRepositoryPort {
  abstract getApprovedProtocols(): Observable<ApprovedProtocolOption[]>;
  abstract getAmendments(): Observable<AmendmentItem[]>;
  abstract getAmendmentsByProtocolId(protocolId: string): Observable<AmendmentItem[]>;
  abstract getAmendmentById(id: string): Observable<AmendmentItem>;
  abstract createAmendment(dto: CreateAmendmentDTO): Observable<AmendmentItem>;
  abstract reviewAmendment(dto: ReviewAmendmentDTO): Observable<AmendmentItem>;
}
