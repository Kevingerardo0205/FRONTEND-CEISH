import { Injectable, inject } from '@angular/core';
import { IReportRepositoryPort } from '../../domain/ports/report-repository.port';
import { ReportRepositoryAdapter } from '../../infrastructure/adapters/report-repository.adapter';

@Injectable({
  providedIn: 'root',
  useClass: ReportRepositoryAdapter // In a real scenario, this would be provided in app.config.ts or similar
})
export abstract class ReportService extends IReportRepositoryPort {}

// For simplicity in this implementation, I'll provide it directly
@Injectable({
  providedIn: 'root'
})
export class ReportsUseCase {
  private readonly reportRepo = inject(ReportRepositoryAdapter);

  getSummaryStats(startDate?: Date, endDate?: Date) {
    return this.reportRepo.getSummaryStats(startDate, endDate);
  }

  getProtocolsByType(startDate?: Date, endDate?: Date) {
    return this.reportRepo.getProtocolsByType(startDate, endDate);
  }

  getProtocolsByStatus(startDate?: Date, endDate?: Date) {
    return this.reportRepo.getProtocolsByStatus(startDate, endDate);
  }

  getEvaluationTimes(startDate?: Date, endDate?: Date) {
    return this.reportRepo.getEvaluationTimes(startDate, endDate);
  }

  getWorkloadByEvaluator(startDate?: Date, endDate?: Date) {
    return this.reportRepo.getWorkloadByEvaluator(startDate, endDate);
  }

  getMSPReport(period: 'monthly' | 'annual', year: number, month?: number) {
    return this.reportRepo.getMSPReport(period, year, month);
  }
}
