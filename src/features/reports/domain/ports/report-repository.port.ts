import { Observable } from 'rxjs';
import { 
  SummaryStats, 
  ProtocolStats, 
  StatusStats, 
  EvaluationTimeStats, 
  WorkloadStats,
  MSPReportData
} from '../entities/report.entity';

export abstract class IReportRepositoryPort {
  abstract getSummaryStats(startDate?: Date, endDate?: Date): Observable<SummaryStats>;
  abstract getProtocolsByType(startDate?: Date, endDate?: Date): Observable<ProtocolStats[]>;
  abstract getProtocolsByStatus(startDate?: Date, endDate?: Date): Observable<StatusStats[]>;
  abstract getEvaluationTimes(startDate?: Date, endDate?: Date): Observable<EvaluationTimeStats[]>;
  abstract getWorkloadByEvaluator(startDate?: Date, endDate?: Date): Observable<WorkloadStats[]>;
  abstract getMSPReport(period: 'monthly' | 'annual', year: number, month?: number): Observable<MSPReportData>;
}
