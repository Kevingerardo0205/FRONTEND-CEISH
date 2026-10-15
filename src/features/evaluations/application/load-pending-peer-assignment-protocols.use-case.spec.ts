import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadPendingPeerAssignmentProtocolsUseCase } from './load-pending-peer-assignment-protocols.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';

describe('LoadPendingPeerAssignmentProtocolsUseCase', () => {
  let useCase: LoadPendingPeerAssignmentProtocolsUseCase;
  let repoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    const rSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getPendingPeerAssignmentProtocols']);
    TestBed.configureTestingModule({
      providers: [
        LoadPendingPeerAssignmentProtocolsUseCase,
        { provide: IEvaluationRepositoryPort, useValue: rSpy }
      ]
    });
    useCase = TestBed.inject(LoadPendingPeerAssignmentProtocolsUseCase);
    repoSpy = TestBed.inject(IEvaluationRepositoryPort) as jasmine.SpyObj<IEvaluationRepositoryPort>;
  });

  it('debe retornar protocolos pendientes de asignación de pares', (done) => {
    repoSpy.getPendingPeerAssignmentProtocols.and.returnValue(of([{ id: 1, title: 'Proto' } as any]));
    useCase.execute().subscribe({
      next: (result) => {
        expect(result.length).toBe(1);
        expect(repoSpy.getPendingPeerAssignmentProtocols).toHaveBeenCalled();
        done();
      },
      error: fail
    });
  });
});
