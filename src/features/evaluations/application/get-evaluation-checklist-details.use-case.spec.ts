import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GetEvaluationChecklistDetailsUseCase } from './get-evaluation-checklist-details.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('GetEvaluationChecklistDetailsUseCase', () => {
  let useCase: GetEvaluationChecklistDetailsUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getChecklistDetails']);

    TestBed.configureTestingModule({
      providers: [
        GetEvaluationChecklistDetailsUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy },
      ],
    });

    useCase = TestBed.inject(GetEvaluationChecklistDetailsUseCase);
    repoSpy = TestBed.inject(
      IEvaluationRepositoryPort,
    ) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe retornar detalles del checklist', (done) => {
    repoSpy.getChecklistDetails.and.returnValue(
      of([{ itemCodigo: 'ET_1', estado: 'C', observaciones: '' }]),
    );

    useCase.execute('eval-1').subscribe({
      next: (res) => {
        expect(res.length).toBe(1);
        expect(res[0].itemCodigo).toBe('ET_1');
        expect(repoSpy.getChecklistDetails).toHaveBeenCalledWith('eval-1');
        done();
      },
      error: fail,
    });
  });
});
