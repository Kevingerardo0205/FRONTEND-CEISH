import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PendingCountPort } from '../domain/pending-count.port';
import { GetPendingCountUseCase } from './get-pending-count.use-case';

describe('GetPendingCountUseCase', () => {
  it('devuelve el conteo del port', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PendingCountPort, useValue: { count$: of(3) } }],
    });
    let count: number | null | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBe(3);
  });

  it('devuelve null si no hay proveedor de PendingCountPort', () => {
    TestBed.configureTestingModule({ providers: [] });
    let count: number | null | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBeNull();
  });

  it('devuelve null si el observable del port falla', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PendingCountPort,
          useValue: { count$: throwError(() => new Error('Error al cargar pendientes')) },
        },
      ],
    });
    let count: number | null | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBeNull();
  });
});
