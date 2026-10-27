import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadEvaluationConsolidationUseCase } from './load-evaluation-consolidation.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('LoadEvaluationConsolidationUseCase', () => {
  let useCase: LoadEvaluationConsolidationUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['consolidateEvaluation']);

    TestBed.configureTestingModule({
      providers: [
        LoadEvaluationConsolidationUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy },
      ],
    });

    useCase = TestBed.inject(LoadEvaluationConsolidationUseCase);
    repoSpy = TestBed.inject(
      IEvaluationRepositoryPort,
    ) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe normalizar evaluaciones desde el backend', (done) => {
    repoSpy.consolidateEvaluation.and.returnValue(
      of({
        data: {
          protocolId: 'proto-1',
          evaluations: [
            { id: '1', evaluatorId: '10', result: 'APROBADO' },
            { id: '2', evaluatorId: '20', verdict: 'RECHAZADO' },
          ],
          isUnanimous: false,
        },
      } as any),
    );

    useCase.execute('proto-1').subscribe({
      next: (result) => {
        expect(result.evaluations.length).toBe(2);
        expect(result.evaluations[0].verdict).toBe('APROBADO');
        expect(result.evaluations[0].evaluatorName).toBe('Evaluador #10');
        expect(result.isUnanimous).toBeFalse();
        done();
      },
      error: fail,
    });
  });

  it('debe manejar respuesta sin data wrapper', (done) => {
    repoSpy.consolidateEvaluation.and.returnValue(
      of({
        evaluations: [{ id: '1', evaluatorName: 'Dr. López' }],
        isUnanimous: true,
      } as any),
    );

    useCase.execute('proto-2').subscribe({
      next: (result) => {
        expect(result.evaluations.length).toBe(1);
        expect(result.evaluations[0].evaluatorName).toBe('Dr. López');
        expect(result.isUnanimous).toBeTrue();
        done();
      },
      error: fail,
    });
  });

  it('debe manejar lista vacía de evaluaciones', (done) => {
    repoSpy.consolidateEvaluation.and.returnValue(
      of({
        data: { protocolId: 'proto-3', evaluations: [], isUnanimous: true },
      }),
    );

    useCase.execute('proto-3').subscribe({
      next: (result) => {
        expect(result.evaluations.length).toBe(0);
        done();
      },
      error: fail,
    });
  });
});
