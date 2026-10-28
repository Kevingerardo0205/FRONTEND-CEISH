import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PendingCountPort } from '../domain/pending-count.port';
import { GetPendingCountUseCase } from './get-pending-count.use-case';

describe('GetPendingCountUseCase', () => {
  it('devuelve el conteo del port', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PendingCountPort, useValue: { count$: of(3) } }],
    });
    let count: number | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBe(3);
  });
});
