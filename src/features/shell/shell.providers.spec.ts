import { TestBed } from '@angular/core/testing';
import { GetPendingCountUseCase } from './application/get-pending-count.use-case';
import { SHELL_PROVIDERS } from './shell.providers';

describe('SHELL_PROVIDERS', () => {
  it('el contador del menú sale del use case con el mock (6)', () => {
    TestBed.configureTestingModule({ providers: SHELL_PROVIDERS });
    let count: number | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBe(6);
  });
});
