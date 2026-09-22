import { ProtocolEntity } from './protocol.entity';

export type SessionType = 'ORDINARIA' | 'EXTRAORDINARIA';

export interface CallEntity {
  id: number;
  callNumber: string;
  sessionType: SessionType;
  meetingDate: string;
  meetingPlace: string;
  agenda: string;
  status?: string;
  protocolVersionIds?: number[];
  protocols?: ProtocolEntity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCallDto {
  callNumber: string;
  sessionType: SessionType;
  meetingDate: string;
  meetingPlace: string;
  agenda: string;
  protocolVersionIds: number[];
}
