import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PendingCountPort } from '../domain/pending-count.port';

/** Valor fijo del mock. Por defecto 6, como en el canvas. */
export const PENDING_COUNT_MOCK_VALUE = new InjectionToken<number>('PENDING_COUNT_MOCK_VALUE', {
  factory: () => 6,
});

/** Mock temporal mientras falta GET /secretaria/pendientes en el backend. */
@Injectable()
export class PendingCountMockAdapter extends PendingCountPort {
  readonly count$: Observable<number> = of(inject(PENDING_COUNT_MOCK_VALUE));
}
