import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadApprovedProtocolsUseCase } from './load-approved-protocols.use-case';
import { LoadAmendmentsUseCase } from './load-amendments.use-case';
import { CreateAmendmentUseCase } from './create-amendment.use-case';
import { ReviewAmendmentUseCase } from './review-amendment.use-case';
import { IAmendmentRepositoryPort } from '../domain/ports/amendment-repository.port';
import { AmendmentStatus, AmendmentType, AmendmentSeverity, AmendmentItem } from '../domain/entities/amendment.entity';

describe('Amendment Use Cases', () => {
  let mockRepository: jasmine.SpyObj<IAmendmentRepositoryPort>;

  const sampleAmendment: AmendmentItem = {
    id: 'enm-test',
    protocolId: '1',
    protocolCode: 'CEISH-2026-001',
    protocolTitle: 'Estudio Clínico',
    investigatorName: 'Dr. Investigador',
    type: AmendmentType.METHODOLOGY,
    severity: AmendmentSeverity.SUBSTANTIAL,
    status: AmendmentStatus.SUBMITTED,
    justification: 'Cambio justificado',
    ethicalImpactDescription: 'Riesgo evaluado',
    documents: [],
    submittedAt: new Date().toISOString(),
    versionNumber: 2
  };

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj<IAmendmentRepositoryPort>('IAmendmentRepositoryPort', [
      'getApprovedProtocols',
      'getAmendments',
      'getAmendmentsByProtocolId',
      'getAmendmentById',
      'createAmendment',
      'reviewAmendment'
    ]);

    TestBed.configureTestingModule({
      providers: [
        LoadApprovedProtocolsUseCase,
        LoadAmendmentsUseCase,
        CreateAmendmentUseCase,
        ReviewAmendmentUseCase,
        { provide: IAmendmentRepositoryPort, useValue: mockRepository }
      ]
    });
  });

  it('LoadApprovedProtocolsUseCase should delegate to repository', (done) => {
    const useCase = TestBed.inject(LoadApprovedProtocolsUseCase);
    mockRepository.getApprovedProtocols.and.returnValue(of([{
      id: '1',
      code: 'CEISH-001',
      title: 'Test',
      investigatorName: 'Dr. X',
      currentVersion: 1
    }]));

    useCase.execute().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(mockRepository.getApprovedProtocols).toHaveBeenCalled();
      done();
    });
  });

  it('LoadAmendmentsUseCase should fetch all amendments or filtered by protocolId', (done) => {
    const useCase = TestBed.inject(LoadAmendmentsUseCase);
    mockRepository.getAmendments.and.returnValue(of([sampleAmendment]));
    mockRepository.getAmendmentsByProtocolId.and.returnValue(of([sampleAmendment]));

    useCase.execute().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(mockRepository.getAmendments).toHaveBeenCalled();

      useCase.execute('1').subscribe((res2) => {
        expect(res2.length).toBe(1);
        expect(mockRepository.getAmendmentsByProtocolId).toHaveBeenCalledWith('1');
        done();
      });
    });
  });

  it('CreateAmendmentUseCase should create amendment via repository', (done) => {
    const useCase = TestBed.inject(CreateAmendmentUseCase);
    mockRepository.createAmendment.and.returnValue(of(sampleAmendment));

    useCase.execute({
      protocolId: '1',
      protocolCode: 'CEISH-2026-001',
      protocolTitle: 'Estudio Clínico',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      justification: 'Justificación válida',
      ethicalImpactDescription: 'Impacto analizado',
      documents: []
    }).subscribe((res) => {
      expect(res.id).toBe('enm-test');
      expect(mockRepository.createAmendment).toHaveBeenCalled();
      done();
    });
  });

  it('ReviewAmendmentUseCase should review and update amendment', (done) => {
    const useCase = TestBed.inject(ReviewAmendmentUseCase);
    const reviewed = { ...sampleAmendment, status: AmendmentStatus.APPROVED, reviewNotes: 'Aprobado sin objeciones' };
    mockRepository.reviewAmendment.and.returnValue(of(reviewed));

    useCase.execute({
      amendmentId: 'enm-test',
      status: AmendmentStatus.APPROVED,
      reviewNotes: 'Aprobado sin objeciones'
    }).subscribe((res) => {
      expect(res.status).toBe(AmendmentStatus.APPROVED);
      expect(mockRepository.reviewAmendment).toHaveBeenCalled();
      done();
    });
  });
});
