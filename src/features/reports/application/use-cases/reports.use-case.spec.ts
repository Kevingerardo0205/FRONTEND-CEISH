import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportsUseCase } from './reports.use-case';
import { IReportRepositoryPort } from '../../domain/ports/report-repository.port';
import {
  SummaryStats,
  ProtocolStats,
  StatusStats,
  EvaluationTimeStats,
  WorkloadStats,
  MSPReportData,
} from '../../domain/entities/report.entity';

describe('ReportsUseCase', () => {
  let useCase: ReportsUseCase;
  let mockReportRepo: jasmine.SpyObj<IReportRepositoryPort>;

  const mockSummary: SummaryStats = {
    totalProtocols: 100,
    approvalRate: 85,
    avgEvaluationDays: 15,
    pendingRenewals: 5,
    adverseEventsCount: 2,
  };

  const mockProtocolsByType: ProtocolStats[] = [
    { type: 'IO', count: 50 },
    { type: 'EC', count: 25 },
  ];

  const mockProtocolsByStatus: StatusStats[] = [
    { status: 'Aprobado', count: 70 },
    { status: 'Pendiente', count: 30 },
  ];

  const mockEvaluationTimes: EvaluationTimeStats[] = [
    { month: 'Ene', avgDays: 14 },
    { month: 'Feb', avgDays: 16 },
  ];

  const mockWorkload: WorkloadStats[] = [
    { evaluator: 'Dr. A', assignedCount: 10, completedCount: 8 },
  ];

  const mockMSPData: MSPReportData = {
    sessions: { ordinary: 4, extraordinary: 1 },
    attendance: [{ member: 'Presidente', percentage: 100 }],
    modalities: { exempt: 2, expedited: 5, full: 3 },
    resolutions: { approved: 8, conditioned: 2, notApproved: 0 },
    biologicalSamples: { yes: 4, no: 6 },
    vulnerablePopulations: [{ type: 'Niños', count: 3 }],
  };

  beforeEach(() => {
    mockReportRepo = jasmine.createSpyObj<IReportRepositoryPort>('IReportRepositoryPort', [
      'getSummaryStats',
      'getProtocolsByType',
      'getProtocolsByStatus',
      'getEvaluationTimes',
      'getWorkloadByEvaluator',
      'getMSPReport',
    ]);

    mockReportRepo.getSummaryStats.and.returnValue(of(mockSummary));
    mockReportRepo.getProtocolsByType.and.returnValue(of(mockProtocolsByType));
    mockReportRepo.getProtocolsByStatus.and.returnValue(of(mockProtocolsByStatus));
    mockReportRepo.getEvaluationTimes.and.returnValue(of(mockEvaluationTimes));
    mockReportRepo.getWorkloadByEvaluator.and.returnValue(of(mockWorkload));
    mockReportRepo.getMSPReport.and.returnValue(of(mockMSPData));

    TestBed.configureTestingModule({
      providers: [ReportsUseCase, { provide: IReportRepositoryPort, useValue: mockReportRepo }],
    });

    useCase = TestBed.inject(ReportsUseCase);
  });

  it('should create the use case', () => {
    expect(useCase).toBeTruthy();
  });

  it('should retrieve summary stats', (done) => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 5, 30);

    useCase.getSummaryStats(start, end).subscribe((stats) => {
      expect(stats).toEqual(mockSummary);
      expect(mockReportRepo.getSummaryStats).toHaveBeenCalledWith(start, end);
      done();
    });
  });

  it('should retrieve protocols by type', (done) => {
    useCase.getProtocolsByType().subscribe((data) => {
      expect(data).toEqual(mockProtocolsByType);
      expect(mockReportRepo.getProtocolsByType).toHaveBeenCalledWith(undefined, undefined);
      done();
    });
  });

  it('should retrieve protocols by status', (done) => {
    useCase.getProtocolsByStatus().subscribe((data) => {
      expect(data).toEqual(mockProtocolsByStatus);
      expect(mockReportRepo.getProtocolsByStatus).toHaveBeenCalled();
      done();
    });
  });

  it('should retrieve evaluation times', (done) => {
    useCase.getEvaluationTimes().subscribe((data) => {
      expect(data).toEqual(mockEvaluationTimes);
      expect(mockReportRepo.getEvaluationTimes).toHaveBeenCalled();
      done();
    });
  });

  it('should retrieve workload by evaluator', (done) => {
    useCase.getWorkloadByEvaluator().subscribe((data) => {
      expect(data).toEqual(mockWorkload);
      expect(mockReportRepo.getWorkloadByEvaluator).toHaveBeenCalled();
      done();
    });
  });

  it('should retrieve MSP report data for monthly and annual periods', (done) => {
    useCase.getMSPReport('monthly', 2026, 9).subscribe((data) => {
      expect(data).toEqual(mockMSPData);
      expect(mockReportRepo.getMSPReport).toHaveBeenCalledWith('monthly', 2026, 9);
      done();
    });
  });
});
