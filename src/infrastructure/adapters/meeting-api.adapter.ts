import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IMeetingRepositoryPort } from '@domain/ports/IMeetingRepositoryPort';
import {
  CreatedMeeting,
  CreateMeetingDto,
  MeetingApiError,
  MeetingContractError,
  MeetingDetail,
  MeetingErrorCode,
  MeetingListParams,
  MeetingPlaceOption,
  PaginatedMeetings,
  PendingProtocol,
} from '@domain/entities/meeting.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import { MeetingMapper } from '@infrastructure/mappers/meeting.mapper';
import { environment } from 'src/environments/environment';

const KNOWN_CODES: MeetingErrorCode[] = ['VERSIONES_DUPLICADAS', 'SEGUIMIENTO_NO_DISPONIBLE'];

@Injectable({
  providedIn: 'root',
})
export class MeetingApiAdapter extends IMeetingRepositoryPort {
  private apiClient = inject(ApiClientService);
  private http = inject(HttpClient);

  list(params: MeetingListParams = {}): Observable<PaginatedMeetings> {
    return this.apiClient.get<unknown>(ENDPOINTS.MEETINGS.BASE, { ...params }).pipe(
      map((res) => MeetingMapper.toPaginated(res)),
      toMeetingError(),
    );
  }

  getById(id: string): Observable<MeetingDetail> {
    return this.apiClient.get<unknown>(ENDPOINTS.MEETINGS.BY_ID(id)).pipe(
      map((res) => MeetingMapper.toDetail(MeetingMapper.unwrapData(res))),
      toMeetingError(),
    );
  }

  getPendingProtocols(): Observable<PendingProtocol[]> {
    return this.apiClient.get<unknown>(ENDPOINTS.MEETINGS.PENDING_PROTOCOLS).pipe(
      map((res) => MeetingMapper.toPendingProtocols(res)),
      toMeetingError(),
    );
  }

  /** Sin parámetros: el backend devuelve solo lugares activos. */
  getPlaces(): Observable<MeetingPlaceOption[]> {
    return this.apiClient.get<unknown>(ENDPOINTS.MEETINGS.PLACES).pipe(
      map((res) => MeetingMapper.toPlaces(res)),
      toMeetingError(),
    );
  }

  create(dto: CreateMeetingDto): Observable<CreatedMeeting> {
    const body: CreateMeetingDto = {
      sessionType: dto.sessionType,
      meetingDate: dto.meetingDate,
    };
    if (dto.evalSubmissionDeadline !== undefined) {
      body.evalSubmissionDeadline = dto.evalSubmissionDeadline;
    }
    if (dto.locationId !== undefined) body.locationId = dto.locationId;
    if (dto.protocolVersionIds !== undefined) body.protocolVersionIds = dto.protocolVersionIds;

    return this.apiClient.post<unknown>(ENDPOINTS.MEETINGS.BASE, body).pipe(
      map((res) => MeetingMapper.toCreated(res)),
      toMeetingError(),
    );
  }

  calculateEvalDate(meetingDate: string): Observable<string> {
    return this.apiClient
      .post<unknown>(ENDPOINTS.MEETINGS.CALCULATE_EVAL_DATE, { meetingDate })
      .pipe(
        map((res) => MeetingMapper.toSuggestedEvalDate(res)),
        toMeetingError(),
      );
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http
      .get(`${environment.apiUrl}${ENDPOINTS.MEETINGS.PDF(id)}`, { responseType: 'blob' })
      .pipe(toMeetingError());
  }
}

function toMeetingError<T>(): OperatorFunction<T, T> {
  return catchError((err: unknown) => throwError(() => normalizeMeetingError(err)));
}

/**
 * Normaliza errores HTTP del backend. Acepta tanto `HttpErrorResponse` como el `Error`
 * que re-lanza el ErrorInterceptor global (que solo conserva `error.message`).
 */
export function normalizeMeetingError(err: unknown): Error {
  if (err instanceof MeetingContractError || err instanceof MeetingApiError) return err;

  let status: number | null = null;
  let messages: string[] = [];
  const codeHints: string[] = [];
  let isValidationList = false;

  if (err instanceof HttpErrorResponse) {
    status = err.status;
    const body = (typeof err.error === 'object' && err.error !== null ? err.error : {}) as Record<
      string,
      unknown
    >;
    const message = body['message'];
    if (Array.isArray(message)) {
      isValidationList = true;
      messages = message.map(String);
    } else if (typeof message === 'string') {
      messages = [message];
    }
    for (const key of ['code', 'error']) {
      if (typeof body[key] === 'string') codeHints.push(body[key] as string);
    }
    if (messages.length === 0) messages = [err.message];
  } else if (err instanceof Error) {
    messages = [err.message];
  } else {
    messages = [String(err)];
  }

  const haystack = [...messages, ...codeHints].join(' | ');
  const code =
    KNOWN_CODES.find((c) => haystack.includes(c)) ??
    (isValidationList || status === 400 ? 'VALIDACION' : 'DESCONOCIDO');
  return new MeetingApiError(code, messages.join('; '), status);
}
