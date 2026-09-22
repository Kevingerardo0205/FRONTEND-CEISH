import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadPendingPeerAssignmentsUseCase } from './load-pending-peer-assignments.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('LoadPendingPeerAssignmentsUseCase', () => {
  let useCase: LoadPendingPeerAssignmentsUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getMyPendingPeerAssignments']);

    TestBed.configureTestingModule({
      providers: [
        LoadPendingPeerAssignmentsUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy }
      ]
    });

    useCase = TestBed.inject(LoadPendingPeerAssignmentsUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe retornar asignaciones pendientes de pares', (done) => {
    const mockAssignments = [{ id: '1', protocolId: 10 }];
    repoSpy.getMyPendingPeerAssignments.and.returnValue(of(mockAssignments as any));

    useCase.execute().subscribe({
      next: (result) => {
        expect(result.length).toBe(1);
        expect(repoSpy.getMyPendingPeerAssignments).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });
});
