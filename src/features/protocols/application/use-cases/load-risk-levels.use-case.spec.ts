import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadRiskLevelsUseCase } from './load-risk-levels.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';

describe('LoadRiskLevelsUseCase', () => {
  let useCase: LoadRiskLevelsUseCase;
  let repoSpy: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IProtocolRepositoryPort', ['getRiskLevels']);

    TestBed.configureTestingModule({
      providers: [
        LoadRiskLevelsUseCase,
        { provide: IProtocolRepositoryPort, useValue: rSpy }
      ]
    });

    useCase = TestBed.inject(LoadRiskLevelsUseCase);
    repoSpy = TestBed.inject(IProtocolRepositoryPort) as jasmine.SpyObj<IProtocolRepositoryPort>;
  });

  it('debe retornar catálogo de niveles de riesgo', (done) => {
    const mockLevels = [{ id: 1, name: 'Mínimo' }, { id: 2, name: 'Bajo' }];
    repoSpy.getRiskLevels.and.returnValue(of(mockLevels));

    useCase.execute().subscribe({
      next: (result) => {
        expect(result.length).toBe(2);
        expect(repoSpy.getRiskLevels).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });
});
