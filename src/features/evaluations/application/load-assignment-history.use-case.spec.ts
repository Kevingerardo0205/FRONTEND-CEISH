import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadAssignmentHistoryUseCase } from './load-assignment-history.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { AssignmentHistoryEntry } from '@domain/entities/peer-evaluation.entity';

describe('LoadAssignmentHistoryUseCase (RF-12.3)', () => {
  let useCase: LoadAssignmentHistoryUseCase;
  let evalRepoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  const mockHistory: AssignmentHistoryEntry[] = [
    {
      id: 501,
      assignmentId: 101,
      previousEvaluatorId: 10,
      previousEvaluatorName: 'Dr. Evaluador Anterior',
      newEvaluatorId: 12,
      newEvaluatorName: 'Dra. Nueva Evaluadora',
      evaluatorProfile: 'SALUD',
      reassignmentReason: 'CONFLICTO_INTERES',
      reasonDescription: 'Conflicto de interés declarado por relación académica.',
      executedByUserId: 1,
      executedByUserName: 'Administrador CEISH',
      executedAt: '2026-09-28T10:00:00.000Z'
    }
  ];

  beforeEach(() => {
    evalRepoSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getAssignmentHistory']);

    TestBed.configureTestingModule({
      providers: [
        LoadAssignmentHistoryUseCase,
        { provide: IEvaluationRepositoryPort, useValue: evalRepoSpy }
      ]
    });

    useCase = TestBed.inject(LoadAssignmentHistoryUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getAssignmentHistory with numeric protocolId and return history', (done) => {
    evalRepoSpy.getAssignmentHistory.and.returnValue(of(mockHistory));

    useCase.execute(164).subscribe({
      next: (result) => {
        expect(evalRepoSpy.getAssignmentHistory).toHaveBeenCalledWith(164);
        expect(result).toEqual(mockHistory);
        expect(result.length).toBe(1);
        done();
      },
      error: done.fail
    });
  });

  it('should throw error when protocolId is not a positive integer', (done) => {
    useCase.execute(0).subscribe({
      next: () => done.fail('Expected error to be thrown'),
      error: (err) => {
        expect(err.message).toContain('El ID del protocolo es requerido');
        expect(evalRepoSpy.getAssignmentHistory).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should throw error when protocolId is null or undefined', (done) => {
    useCase.execute(null as any).subscribe({
      next: () => done.fail('Expected error to be thrown'),
      error: (err) => {
        expect(err.message).toContain('El ID del protocolo es requerido');
        expect(evalRepoSpy.getAssignmentHistory).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
