import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadReceptionProtocolsUseCase } from './load-reception-protocols.use-case';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

describe('LoadReceptionProtocolsUseCase', () => {
  let useCase: LoadReceptionProtocolsUseCase;
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
      status: 'COMPLETO' as any,
      documents: [],
      version: 1,
    },
    {
      id: '3',
      title: 'Proto 3',
      investigatorId: 'u3',
      type: 'OBSERVACIONAL' as any,
      status: 'ARCHIVADO_VENCIMIENTO' as any,
      documents: [],
      version: 1,
    },
    {
      id: '4',
      title: 'Proto 4',
      investigatorId: 'u4',
      type: 'EXPERIMENTAL' as any,
      status: 'EN_REVISION_SECRETARIA' as any,
      documents: [],
      version: 1,
    },
  ];

  beforeEach(() => {
    mockRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getReceptionProtocols']);
    mockRepo.getReceptionProtocols.and.returnValue(of(mockProtocols));

    TestBed.configureTestingModule({
      providers: [
        LoadReceptionProtocolsUseCase,
        { provide: IProtocolRepositoryPort, useValue: mockRepo },
      ],
    });

    useCase = TestBed.inject(LoadReceptionProtocolsUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should filter out COMPLETO and ARCHIVADO_VENCIMIENTO', (done) => {
    useCase.execute().subscribe((result) => {
      expect(result.length).toBe(2);
      expect(
        result.every(
          (p) => p.status !== ('COMPLETO' as any) && p.status !== ('ARCHIVADO_VENCIMIENTO' as any),
        ),
      ).toBeTrue();
      done();
    });
  });

  it('should only include RECEPCION category protocols', (done) => {
    useCase.execute().subscribe((result) => {
      expect(result.length).toBe(2);
      done();
    });
  });

  it('should handle empty response', (done) => {
    mockRepo.getReceptionProtocols.and.returnValue(of([]));
    useCase.execute().subscribe((result) => {
      expect(result.length).toBe(0);
      done();
    });
  });
});
