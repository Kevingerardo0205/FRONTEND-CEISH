import { Observable } from 'rxjs';
import { CallEntity, CallSessionType } from './call.entity';

export interface CreateCallCommand {
  date: string;
  time: string;
  placeId?: number;
  sessionType: CallSessionType | string;
  agendaSummary?: string;
  protocolIds: number[];
}

export interface ProtocolPendingForCall {
  id: number;
  ceishCode: string;
  title: string;
  investigatorName: string;
  submissionDeadline?: Date;
  versionNumber: number;
}

export interface MinutesSignedResult {
  minutesId: number;
  signedByPresident: boolean;
  signedBySecretary: boolean;
  isSessionFinalized: boolean;
}

export interface ICallRepositoryPort {
  getPendingProtocols(): Observable<ProtocolPendingForCall[]>;
  createCall(command: CreateCallCommand): Observable<CallEntity>;
  getCalls(): Observable<CallEntity[]>;
  getCallById(id: number): Observable<CallEntity>;
  signMinutes(minutesId: number): Observable<MinutesSignedResult>;
}
