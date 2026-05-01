import { ProtocolType } from '../enums/protocol-type.enum';
import { ProtocolStatus } from '../enums/protocol-status.enum';
import { DocumentEntity } from './document.entity';

export interface ProtocolEntity {
  id: string;
  code?: string;
  title: string;
  investigatorId: string;
  type: ProtocolType;
  status: ProtocolStatus;
  submissionDate?: Date;
  validationDate?: Date;
  documents: DocumentEntity[];
  version: number;
}
