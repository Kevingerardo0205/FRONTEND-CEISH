import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface BroadcastMessage<T = unknown> {
  type: string;
  payload: T;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationBrokerService {
  private _bus = new Subject<BroadcastMessage>();

  publish<T>(type: string, payload: T): void {
    this._bus.next({ type, payload });
  }

  on<T>(type: string): Observable<T> {
    return this._bus.asObservable().pipe(
      filter((m) => m.type === type),
      map((m) => m.payload as T),
    );
  }
}
