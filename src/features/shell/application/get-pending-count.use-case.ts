import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { PendingCountPort } from '../domain/pending-count.port';

/** Fuente del contador del menú (badge 'pendientes'). */
@Injectable({ providedIn: 'root' })
export class GetPendingCountUseCase {
  private pendingCount = inject(PendingCountPort, { optional: true });

  execute(): Observable<number | null> {
    if (!this.pendingCount) {
      return of(null);
    }
    return this.pendingCount.count$.pipe(catchError(() => of(null)));
  }
}
