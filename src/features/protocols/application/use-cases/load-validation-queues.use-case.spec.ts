import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadValidationQueuesUseCase } from './load-validation-queues.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

describe('LoadValidationQueuesUseCase', () => {
  let useCase: LoadValidationQueuesUseCase;
  let mockRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  const mockProtocols: ProtocolEntity[] = [
    {
      id: '1',
      title: 'Proto 1',
      investigatorId: 'u1',
      type: 'OBSERVACIONAL' as any,
      status: 'INICIADO' as any,
      documents: [],
      version: 1,
    },
    {
      id: '2',
      title: 'Proto 2',
      investigatorId: 'u2',
      type: 'EXPERIMENTAL' as any,
      status: 'EN_REVISION_SECRETARIA' as any,
      documents: [],
      version: 1,
    },
    {
      id: '3',
      title: 'Proto 3',
      investigatorId: 'u3',
      type: 'OBSERVACIONAL' as any,
      status: 'INCOMPLETO' as any,
      documents: [],
      version: 1,
    },
    {
      id: '4',
      title: 'Proto 4',
      investigatorId: 'u4',
      type: 'EXPERIMENTAL' as any,
      status: 'EN_CONTROL_DOCUMENTAL' as any,
      documents: [],
      version: 1,
    },
    {
      id: '5',
      title: 'Proto 5',
      investigatorId: 'u5',
      type: 'OBSERVACIONAL' as any,
      status: 'REQUIERE_SUBSANACION_DOC' as any,
      documents: [],
      version: 1,
    },
    {
      id: '6',
      title: 'Proto 6',
      investigatorId: 'u6',
      type: 'EXPERIMENTAL' as any,
      status: 'APROBADO' as any,
      documents: [],
      version: 1,
    },
  ];

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getReceptionProtocols']);
    mockRepo.getReceptionProtocols.and.returnValue(of(mockProtocols));

    TestBed.configureTestingModule({
      providers: [
        LoadValidationQueuesUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo },
      ],
    });

    useCase = TestBed.inject(LoadValidationQueuesUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should split protocols into pending and observed queues', (done) => {
    useCase.execute().subscribe((queues) => {
      expect(queues.pending.length).toBe(3); // INICIADO, EN_REVISION_SECRETARIA, EN_CONTROL_DOCUMENTAL
      expect(queues.observed.length).toBe(2); // INCOMPLETO, REQUIERE_SUBSANACION_DOC
      done();
    });
  });

  it('should not include APROBADO in either queue', (done) => {
    useCase.execute().subscribe((queues) => {
      const allIds = [...queues.pending, ...queues.observed].map((p) => p.id);
      expect(allIds).not.toContain('6');
      done();
    });
  });

  it('should handle empty response', (done) => {
    mockRepo.getReceptionProtocols.and.returnValue(of([]));
    useCase.execute().subscribe((queues) => {
      expect(queues.pending.length).toBe(0);
      expect(queues.observed.length).toBe(0);
      done();
    });
  });

  it('should call repo.getReceptionProtocols', () => {
    useCase.execute().subscribe();
    expect(mockRepo.getReceptionProtocols).toHaveBeenCalled();
  });
});
