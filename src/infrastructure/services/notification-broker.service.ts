import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface BroadcastMessage {
  type: string;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationBrokerService {
  private _bus = new Subject<BroadcastMessage>();

  publish(type: string, payload: any): void {
    console.log(`[NotificationBroker] Publicando evento: ${type}`, payload);
    this._bus.next({ type, payload });
  }

  on(type: string): Observable<any> {
    return this._bus.asObservable().pipe(
      filter(m => m.type === type),
      map(m => m.payload)
    );
  }
}
