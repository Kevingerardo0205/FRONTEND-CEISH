import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IReportRepositoryPort } from '../../domain/ports/report-repository.port';
import { 
  SummaryStats, 
  ProtocolStats, 
  StatusStats, 
  EvaluationTimeStats, 
  WorkloadStats,
  MSPReportData 
} from '../../domain/entities/report.entity';

@Injectable({
  providedIn: 'root'
})
export class ReportsUseCase {
  private readonly reportRepo = inject(IReportRepositoryPort);

  getSummaryStats(startDate?: Date, endDate?: Date): Observable<SummaryStats> {
    return this.reportRepo.getSummaryStats(startDate, endDate);
  }

  getProtocolsByType(startDate?: Date, endDate?: Date): Observable<ProtocolStats[]> {
    return this.reportRepo.getProtocolsByType(startDate, endDate);
  }

  getProtocolsByStatus(startDate?: Date, endDate?: Date): Observable<StatusStats[]> {
    return this.reportRepo.getProtocolsByStatus(startDate, endDate);
  }

  getEvaluationTimes(startDate?: Date, endDate?: Date): Observable<EvaluationTimeStats[]> {
    return this.reportRepo.getEvaluationTimes(startDate, endDate);
  }

  getWorkloadByEvaluator(startDate?: Date, endDate?: Date): Observable<WorkloadStats[]> {
    return this.reportRepo.getWorkloadByEvaluator(startDate, endDate);
  }

  getMSPReport(period: 'monthly' | 'annual', year: number, month?: number): Observable<MSPReportData> {
    return this.reportRepo.getMSPReport(period, year, month);
  }
}
