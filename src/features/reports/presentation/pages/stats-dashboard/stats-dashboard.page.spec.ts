import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { StatsDashboardPage } from './stats-dashboard.page';
import { ReportsUseCase } from '@features/reports/application/use-cases/reports.use-case';
import {
  SummaryStats,
  ProtocolStats,
  StatusStats,
  EvaluationTimeStats,
  WorkloadStats,
} from '@features/reports/domain/entities/report.entity';

describe('StatsDashboardPage', () => {
  let component: StatsDashboardPage;
  let fixture: ComponentFixture<StatsDashboardPage>;
  let mockReportsUseCase: jasmine.SpyObj<ReportsUseCase>;

  const mockSummary: SummaryStats = {
    totalProtocols: 145,
    approvalRate: 82,
    avgEvaluationDays: 18.5,
    pendingRenewals: 12,
    adverseEventsCount: 5,
  };

  const mockTypes: ProtocolStats[] = [
    { type: 'IO', count: 65 },
    { type: 'EI', count: 45 },
  ];

  const mockStatuses: StatusStats[] = [
    { status: 'Aprobado', count: 90 },
    { status: 'Pendiente', count: 30 },
  ];

  const mockEvaluationTimes: EvaluationTimeStats[] = [
    { month: 'Ene', avgDays: 15 },
    { month: 'Feb', avgDays: 18 },
  ];

  const mockWorkload: WorkloadStats[] = [
    { evaluator: 'Dr. Pérez', assignedCount: 12, completedCount: 10 },
  ];

  beforeEach(async () => {
    mockReportsUseCase = jasmine.createSpyObj<ReportsUseCase>('ReportsUseCase', [
      'getSummaryStats',
      'getProtocolsByType',
      'getProtocolsByStatus',
      'getEvaluationTimes',
      'getWorkloadByEvaluator',
    ]);

    mockReportsUseCase.getSummaryStats.and.returnValue(of(mockSummary));
    mockReportsUseCase.getProtocolsByType.and.returnValue(of(mockTypes));
    mockReportsUseCase.getProtocolsByStatus.and.returnValue(of(mockStatuses));
    mockReportsUseCase.getEvaluationTimes.and.returnValue(of(mockEvaluationTimes));
    mockReportsUseCase.getWorkloadByEvaluator.and.returnValue(of(mockWorkload));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, StatsDashboardPage],
      providers: [{ provide: ReportsUseCase, useValue: mockReportsUseCase }],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load dashboard statistics on init', () => {
    expect(component).toBeTruthy();
    expect(mockReportsUseCase.getSummaryStats).toHaveBeenCalled();
    expect(mockReportsUseCase.getProtocolsByType).toHaveBeenCalled();
    expect(mockReportsUseCase.getProtocolsByStatus).toHaveBeenCalled();
    expect(mockReportsUseCase.getEvaluationTimes).toHaveBeenCalled();
    expect(mockReportsUseCase.getWorkloadByEvaluator).toHaveBeenCalled();

    expect(component.summaryStats).toEqual(mockSummary);
    expect(component.doughnutChartData.labels).toEqual(['IO', 'EI']);
    expect(component.doughnutChartData.datasets[0].data).toEqual([65, 45]);
    expect(component.barChartData.labels).toEqual(['Aprobado', 'Pendiente']);
    expect(component.barChartData.datasets[0].data).toEqual([90, 30]);
    expect(component.lineChartData.labels).toEqual(['Ene', 'Feb']);
    expect(component.lineChartData.datasets[0].data).toEqual([15, 18]);
    expect(component.workloadChartData.labels).toEqual(['Dr. Pérez']);
  });

  it('should reload data when both startDate and endDate are selected', () => {
    mockReportsUseCase.getSummaryStats.calls.reset();
    component.startDate = new Date(2026, 0, 1);
    component.endDate = new Date(2026, 5, 30);

    component.onDateChange();

    expect(mockReportsUseCase.getSummaryStats).toHaveBeenCalledWith(
      component.startDate,
      component.endDate,
    );
  });

  it('should not reload data when only startDate is set', () => {
    mockReportsUseCase.getSummaryStats.calls.reset();
    component.startDate = new Date(2026, 0, 1);
    component.endDate = null;

    component.onDateChange();

    expect(mockReportsUseCase.getSummaryStats).not.toHaveBeenCalled();
  });
});
