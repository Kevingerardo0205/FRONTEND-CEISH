import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreateCallUseCase } from './create-call.use-case';
import { ICallRepositoryPort } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';
import { CallEntity, CallSessionType } from 'src/domain/evaluations/call.entity';

describe('CreateCallUseCase', () => {
  let useCase: CreateCallUseCase;
  let repositorySpy: jasmine.SpyObj<ICallRepositoryPort>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('ICallRepositoryPort', ['createCall']);

    TestBed.configureTestingModule({
      providers: [
        CreateCallUseCase,
        { provide: CALL_REPOSITORY_TOKEN, useValue: repositorySpy },
      ],
    });

    useCase = TestBed.inject(CreateCallUseCase);
  });

  it('debe crearse correctamente el caso de uso', () => {
    expect(useCase).toBeTruthy();
  });

  it('debe invocar createCall en el repositorio de dominio y retornar la entidad mapeada', (done) => {
    const mockCall = new CallEntity(
      1,
      '25-2026',
      new Date('2026-07-20'),
      '15:00',
      1,
      'Salón Dorado',
      CallSessionType.ORDINARIA,
      22
    );

    repositorySpy.createCall.and.returnValue(of(mockCall));

    useCase
      .execute({
        date: '2026-07-20',
        time: '15:00',
        placeId: 1,
        sessionType: 'ORDINARIA',
        protocolIds: [162],
      })
      .subscribe({
        next: (result) => {
          expect(result.code).toBe('25-2026');
          expect(result.placeName).toBe('Salón Dorado');
          expect(repositorySpy.createCall).toHaveBeenCalledTimes(1);
          done();
        },
      });
  });
});
