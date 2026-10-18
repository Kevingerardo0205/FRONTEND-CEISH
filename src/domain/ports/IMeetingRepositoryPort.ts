import { Observable } from 'rxjs';
import {
  CreatedMeeting,
  CreateMeetingDto,
  MeetingDetail,
  MeetingListParams,
  MeetingPlaceOption,
  PaginatedMeetings,
  PendingProtocol,
} from '@domain/entities/meeting.entity';

export abstract class IMeetingRepositoryPort {
  abstract list(params?: MeetingListParams): Observable<PaginatedMeetings>;
  abstract getById(id: string): Observable<MeetingDetail>;
  abstract getPendingProtocols(): Observable<PendingProtocol[]>;
  abstract getPlaces(): Observable<MeetingPlaceOption[]>;
  abstract create(dto: CreateMeetingDto): Observable<CreatedMeeting>;
  /** Devuelve la fecha límite sugerida (ISO 8601) para la entrega de evaluaciones. */
  abstract calculateEvalDate(meetingDate: string): Observable<string>;
  /** Descarga autenticada de GET /meetings/:id/pdf. */
  abstract downloadPdf(id: string): Observable<Blob>;
}
