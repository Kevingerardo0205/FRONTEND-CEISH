import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SuggestEvaluatorsUseCase } from './suggest-evaluators.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ProtocolType } from '@domain/enums/protocol-type.enum';

describe('SuggestEvaluatorsUseCase', () => {
  let useCase: SuggestEvaluatorsUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['suggestEvaluators']);

    TestBed.configureTestingModule({
      providers: [
        SuggestEvaluatorsUseCase,
        { provide: IEvaluationRepositoryPort, useValue: spy }
      ]
    });

    useCase = TestBed.inject(SuggestEvaluatorsUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe permitir sugerir exactamente 2 evaluadores para protocolos EXPEDITA (IO)', (done) => {
    const evaluators = [
      { id: '1', profile: 'SALUD' },
      { id: '2', profile: 'JURIDICO' }
    ];
    repoSpy.suggestEvaluators.and.returnValue(of(undefined));

    useCase.execute('proto-123', evaluators, ProtocolType.IO).subscribe({
      next: () => {
        expect(repoSpy.suggestEvaluators).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });

  it('debe fallar si se envían menos de 2 evaluadores para protocolos EXPEDITA', (done) => {
    const evaluators = [{ id: '1', profile: 'SALUD' }];

    useCase.execute('proto-123', evaluators, ProtocolType.IO).subscribe({
      next: () => fail('Debería haber fallado'),
      error: (error) => {
        expect(error.message).toContain('requieren exactamente 2 evaluadores');
        done();
      }
    });
  });

  it('debe permitir sugerir exactamente 5 evaluadores con perfiles distintos para protocolos PLENO (EC)', (done) => {
    const evaluators = [
      { id: '1', profile: 'SALUD' },
      { id: '2', profile: 'JURIDICO' },
      { id: '3', profile: 'METODOLOGIA' },
      { id: '4', profile: 'BIOETICA' },
      { id: '5', profile: 'SOCIEDAD_CIVIL' }
    ];
    repoSpy.suggestEvaluators.and.returnValue(of(undefined));

    useCase.execute('proto-123', evaluators, ProtocolType.EC).subscribe({
      next: () => {
        expect(repoSpy.suggestEvaluators).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });

  it('debe fallar si hay perfiles duplicados en protocolos PLENO (PET 5.1)', (done) => {
    const evaluators = [
      { id: '1', profile: 'SALUD' },
      { id: '2', profile: 'SALUD' }, // Duplicado
      { id: '3', profile: 'METODOLOGIA' },
      { id: '4', profile: 'BIOETICA' },
      { id: '5', profile: 'SOCIEDAD_CIVIL' }
    ];

    useCase.execute('proto-123', evaluators, ProtocolType.EC).subscribe({
      next: () => fail('Debería haber fallado por perfiles duplicados'),
      error: (error) => {
        expect(error.message).toContain('5 perfiles distintos (Normativa PET 5.1)');
        done();
      }
    });
  });

  it('debe fallar si se envían más de 5 evaluadores para protocolos PLENO', (done) => {
    const evaluators = Array(6).fill({ id: 'x', profile: 'y' });

    useCase.execute('proto-123', evaluators, ProtocolType.EC).subscribe({
      next: () => fail('Debería haber fallado por cantidad'),
      error: (error) => {
        expect(error.message).toContain('requieren exactamente 5 evaluadores');
        done();
      }
    });
  });
});
