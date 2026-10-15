import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoadPendingResolutionsUseCase } from './load-pending-resolutions.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

describe('LoadPendingResolutionsUseCase', () => {
  let useCase: LoadPendingResolutionsUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  const mockProtocols: ProtocolEntity[] = [
    { id: '1', title: 'Proto 1', investigatorId: 'u1', type: 'OBSERVACIONAL' as any, status: 'EVALUADO' as any, documents: [], version: 1 },
    { id: '2', title: 'Proto 2', investigatorId: 'u2', type: 'EXPERIMENTAL' as any, status: 'EVALUADO' as any, documents: [], version: 1 },
  ];

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getProtocolsByStatusId']);
    mockRepo.getProtocolsByStatusId.and.returnValue(of(mockProtocols));

    TestBed.configureTestingModule({
      providers: [
        LoadPendingResolutionsUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo }
      ]
    });

    useCase = TestBed.inject(LoadPendingResolutionsUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getProtocolsByStatusId with status 14', (done) => {
    useCase.execute().subscribe(result => {
      expect(mockRepo.getProtocolsByStatusId).toHaveBeenCalledWith(14);
      expect(result.length).toBe(2);
      done();
    });
  });

  it('should handle empty response', (done) => {
    mockRepo.getProtocolsByStatusId.and.returnValue(of([]));
    useCase.execute().subscribe(result => {
      expect(result.length).toBe(0);
      done();
    });
  });

  it('should propagate errors', (done) => {
    mockRepo.getProtocolsByStatusId.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute().subscribe({
      error: (err) => {
        expect(err.message).toBe('fail');
        done();
      }
    });
  });
});
