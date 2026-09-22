import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ICallRepositoryPort,
  CreateCallCommand,
  ProtocolPendingForCall,
  MinutesSignedResult,
} from '../../domain/evaluations/icall-repository.port';
import { CallEntity } from '../../domain/evaluations/call.entity';
import { CallMapper, CallResponseDto } from './call.mapper';

@Injectable({
  providedIn: 'root',
})
export class CallHttpRepository implements ICallRepositoryPort {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/evaluations/calls`;

  getPendingProtocols(): Observable<ProtocolPendingForCall[]> {
    return this.http.get<ProtocolPendingForCall[]>(`${this.apiUrl}/protocols/pending`);
  }

  createCall(command: CreateCallCommand): Observable<CallEntity> {
    return this.http
      .post<CallResponseDto>(this.apiUrl, command)
      .pipe(map((dto) => CallMapper.toDomain(dto)));
  }

  getCalls(): Observable<CallEntity[]> {
    return this.http
      .get<CallResponseDto[]>(this.apiUrl)
      .pipe(map((dtos) => CallMapper.toDomainList(dtos)));
  }

  getCallById(id: number): Observable<CallEntity> {
    return this.http
      .get<CallResponseDto>(`${this.apiUrl}/${id}`)
      .pipe(map((dto) => CallMapper.toDomain(dto)));
  }

  signMinutes(minutesId: number): Observable<MinutesSignedResult> {
    return this.http.post<MinutesSignedResult>(`${this.apiUrl}/minutes/${minutesId}/sign`, {});
  }
}
