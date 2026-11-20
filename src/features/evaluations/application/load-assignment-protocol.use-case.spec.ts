import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { AssignmentProtocolSummary, LoadAssignmentProtocolUseCase } from './load-assignment-protocol.use-case';

describe('LoadAssignmentProtocolUseCase (F03 §3)', () => {
  function run(protocol: Record<string, unknown>): AssignmentProtocolSummary | undefined {
    const repo = { getById: jasmine.createSpy('getById').and.returnValue(of(protocol)) };
    TestBed.configureTestingModule({ providers: [{ provide: IProtocolRepositoryPort, useValue: repo }] });
    let result: AssignmentProtocolSummary | undefined;
    TestBed.inject(LoadAssignmentProtocolUseCase)
      .execute(9)
      .subscribe((r) => (result = r));
    expect(repo.getById).toHaveBeenCalledOnceWith('9');
    return result;
  }

  it('código, título y tiempos aceptados de GET /protocols/:id', () => {
    expect(run({ code: 'CEISH-1', title: 'Estudio', isTimelineTermsAccepted: true })).toEqual({
      id: 9,
      code: 'CEISH-1',
      title: 'Estudio',
      isTimelineTermsAccepted: true,
    });
  });

  it('sin código ni título → null; sin la marca de tiempos → no aceptados', () => {
    expect(run({ code: '', title: '  ' })).toEqual({
      id: 9,
      code: null,
      title: null,
      isTimelineTermsAccepted: false,
    });
  });
});
