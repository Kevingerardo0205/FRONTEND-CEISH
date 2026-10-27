import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadProtocolByIdUseCase } from './load-protocol-by-id.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

describe('LoadProtocolByIdUseCase', () => {
  let useCase: LoadProtocolByIdUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  const mockProtocol: ProtocolEntity = {
    id: '42',
    title: 'Test Protocol',
    investigatorId: 'u1',
    type: 'OBSERVACIONAL' as any,
    status: 'EN_REVISION_SECRETARIA' as any,
    documents: [],
    version: 1,
  };

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getById']);
    mockRepo.getById.and.returnValue(of(mockProtocol));

    TestBed.configureTestingModule({
      providers: [
        LoadProtocolByIdUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo },
      ],
    });

    useCase = TestBed.inject(LoadProtocolByIdUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getById with the correct id', (done) => {
    useCase.execute('42').subscribe((result) => {
      expect(mockRepo.getById).toHaveBeenCalledWith('42');
      expect(result.id).toBe('42');
      expect(result.title).toBe('Test Protocol');
      done();
    });
  });
});
