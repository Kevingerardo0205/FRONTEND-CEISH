import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadEvaluatorWorkloadUseCase } from './load-evaluator-workload.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('LoadEvaluatorWorkloadUseCase', () => {
  let useCase: LoadEvaluatorWorkloadUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getMyAssignments']);
    TestBed.configureTestingModule({
      providers: [
        LoadEvaluatorWorkloadUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy }
      ]
    });
    useCase = TestBed.inject(LoadEvaluatorWorkloadUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe calcular carga de trabajo correctamente', (done) => {
    repoSpy.getMyAssignments.and.returnValue(of([
      { assignmentId: 1, protocolId: 1, isUrgent: true },
      { assignmentId: 2, protocolId: 2, isUrgent: false },
      { assignmentId: 3, protocolId: 3, isUrgent: true }
    ]));
    useCase.execute().subscribe({
      next: (workload) => {
        expect(workload.activeCount).toBe(3);
        expect(workload.urgentCount).toBe(2);
        done();
      },
      error: fail
    });
  });

  it('debe manejar lista vacía', (done) => {
    repoSpy.getMyAssignments.and.returnValue(of([]));
    useCase.execute().subscribe({
      next: (workload) => {
        expect(workload.activeCount).toBe(0);
        expect(workload.urgentCount).toBe(0);
        done();
      },
      error: fail
    });
  });
});
