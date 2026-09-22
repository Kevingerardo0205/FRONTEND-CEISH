import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditUseCase } from './audit.use-case';
import { IAuditRepositoryPort } from '../../domain/ports/audit-repository.port';
import { AuditLog, ProtocolTrailEvent } from '../../domain/entities/audit.entity';

describe('AuditUseCase', () => {
  let useCase: AuditUseCase;
  let mockAuditRepository: jasmine.SpyObj<IAuditRepositoryPort>;

  const mockLogs: AuditLog[] = [
    {
      id: 'aud-1',
      timestamp: new Date(),
      userId: '1',
      userName: 'Admin',
      userRole: 'ADMIN_TI',
      action: 'UPDATE',
      entity: 'User',
      recordId: 'USR-001',
      ipAddress: '127.0.0.1'
    }
  ];

  const mockTrail: ProtocolTrailEvent[] = [
    {
      id: 'tr-1',
      date: new Date(),
      responsible: 'Investigador (INVESTIGADOR)',
      action: 'Creación de Protocolo',
      status: 'COMPLETED',
      integrityHash: 'sha256-mock-hash'
    }
  ];

  beforeEach(() => {
    mockAuditRepository = jasmine.createSpyObj<IAuditRepositoryPort>('IAuditRepositoryPort', [
      'getLogs',
      'getProtocolTrail'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuditUseCase,
        { provide: IAuditRepositoryPort, useValue: mockAuditRepository }
      ]
    });

    useCase = TestBed.inject(AuditUseCase);
  });

  it('should call getLogs on repository with filters', (done) => {
    mockAuditRepository.getLogs.and.returnValue(of(mockLogs));

    useCase.getLogs({ search: 'Admin' }).subscribe((logs) => {
      expect(logs.length).toBe(1);
      expect(mockAuditRepository.getLogs).toHaveBeenCalledWith({ search: 'Admin' });
      done();
    });
  });

  it('should call getProtocolTrail on repository with protocolId', (done) => {
    mockAuditRepository.getProtocolTrail.and.returnValue(of(mockTrail));

    useCase.getProtocolTrail('PRT-001').subscribe((trail) => {
      expect(trail.length).toBe(1);
      expect(mockAuditRepository.getProtocolTrail).toHaveBeenCalledWith('PRT-001');
      done();
    });
  });
});
