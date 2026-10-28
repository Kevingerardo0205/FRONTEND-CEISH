import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PendingCountPort } from '../domain/pending-count.port';

/** Fuente del contador del menú (badge 'pendientes'). */
@Injectable({ providedIn: 'root' })
export class GetPendingCountUseCase {
  private pendingCount = inject(PendingCountPort);

  execute(): Observable<number> {
    return this.pendingCount.count$;
  }
}
