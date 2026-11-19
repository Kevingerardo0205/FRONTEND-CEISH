import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { AssignPeerEvaluatorsUseCase } from './assign-peer-evaluators.use-case';

describe('AssignPeerEvaluatorsUseCase (F03 D6)', () => {
  it('pasa el protocolo y el cuerpo de N52 al puerto', () => {
    const repo = {
      assignPeerEvaluators: jasmine
        .createSpy('assignPeerEvaluators')
        .and.returnValue(of({ assignments: [] })),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: IEvaluationRepositoryPort, useValue: repo }],
    });
    const payload = {
      reviewType: 'PLENO' as const,
      evaluators: [
        { evaluatorId: 1, profile: 'SALUD' as const },
        { evaluatorId: 2, profile: 'SOCIEDAD_CIVIL' as const },
      ],
    };

    TestBed.inject(AssignPeerEvaluatorsUseCase).execute(15, payload).subscribe();

    expect(repo.assignPeerEvaluators).toHaveBeenCalledOnceWith('15', payload);
  });
});
