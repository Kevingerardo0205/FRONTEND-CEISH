import { TestBed } from '@angular/core/testing';
import { PENDING_COUNT_MOCK_VALUE, PendingCountMockAdapter } from './pending-count-mock.adapter';

describe('PendingCountMockAdapter', () => {
  function countWith(providers: unknown[] = []): number | undefined {
    TestBed.configureTestingModule({ providers: [PendingCountMockAdapter, ...(providers as [])] });
    let count: number | undefined;
    TestBed.inject(PendingCountMockAdapter).count$.subscribe((c) => (count = c));
    return count;
  }

  it('devuelve 6 por defecto, como en el canvas', () => {
    expect(countWith()).toBe(6);
  });

  it('el número es configurable', () => {
    expect(countWith([{ provide: PENDING_COUNT_MOCK_VALUE, useValue: 12 }])).toBe(12);
  });
});
