import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadCallsUseCase } from './load-calls.use-case';
import { ICallRepositoryPort } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';
import { CallEntity, CallSessionType } from 'src/domain/evaluations/call.entity';

describe('LoadCallsUseCase', () => {
  let useCase: LoadCallsUseCase;
  let repositorySpy: jasmine.SpyObj<ICallRepositoryPort>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('ICallRepositoryPort', ['getCalls']);

    TestBed.configureTestingModule({
      providers: [
        LoadCallsUseCase,
        { provide: CALL_REPOSITORY_TOKEN, useValue: repositorySpy },
      ],
    });

    useCase = TestBed.inject(LoadCallsUseCase);
  });

  it('debe crearse correctamente el caso de uso LoadCallsUseCase', () => {
    expect(useCase).toBeTruthy();
  });

  it('debe invocar getCalls en el puerto de dominio y retornar la lista de convocatorias', (done) => {
    const mockCalls: CallEntity[] = [
      new CallEntity(
        1,
        '25-2026',
        new Date('2026-07-20'),
        '15:00',
        1,
        'Salón Dorado',
        CallSessionType.ORDINARIA,
        22
      ),
    ];

    repositorySpy.getCalls.and.returnValue(of(mockCalls));

    useCase.execute().subscribe({
      next: (result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('25-2026');
        expect(repositorySpy.getCalls).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });
});
