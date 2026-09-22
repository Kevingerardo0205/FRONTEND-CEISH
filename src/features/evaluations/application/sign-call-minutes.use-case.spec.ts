import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SignCallMinutesUseCase } from './sign-call-minutes.use-case';
import { ICallRepositoryPort, MinutesSignedResult } from 'src/domain/evaluations/icall-repository.port';
import { CALL_REPOSITORY_TOKEN } from 'src/domain/evaluations/call-repository.token';

describe('SignCallMinutesUseCase', () => {
  let useCase: SignCallMinutesUseCase;
  let repositorySpy: jasmine.SpyObj<ICallRepositoryPort>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('ICallRepositoryPort', ['signMinutes']);

    TestBed.configureTestingModule({
      providers: [
        SignCallMinutesUseCase,
        { provide: CALL_REPOSITORY_TOKEN, useValue: repositorySpy },
      ],
    });

    useCase = TestBed.inject(SignCallMinutesUseCase);
  });

  it('debe crearse correctamente el caso de uso SignCallMinutesUseCase', () => {
    expect(useCase).toBeTruthy();
  });

  it('debe invocar signMinutes en el repositorio y retornar el resultado de la firma del acta', (done) => {
    const mockResult: MinutesSignedResult = {
      minutesId: 10,
      signedByPresident: true,
      signedBySecretary: true,
      isSessionFinalized: true,
    };

    repositorySpy.signMinutes.and.returnValue(of(mockResult));

    useCase.execute(10).subscribe({
      next: (result) => {
        expect(result.minutesId).toBe(10);
        expect(result.isSessionFinalized).toBeTrue();
        expect(repositorySpy.signMinutes).toHaveBeenCalledWith(10);
        done();
      },
    });
  });
});
