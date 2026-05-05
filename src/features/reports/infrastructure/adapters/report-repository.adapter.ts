import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IReportRepositoryPort } from '../../domain/ports/report-repository.port';
import { 
  SummaryStats, 
  ProtocolStats, 
  StatusStats, 
  EvaluationTimeStats, 
  WorkloadStats,
  MSPReportData
} from '../../domain/entities/report.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class ReportRepositoryAdapter implements IReportRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  getSummaryStats(startDate?: Date, endDate?: Date): Observable<SummaryStats> {
    // Mock data for now, would use this.apiClient.get with params
    return of({
      totalProtocols: 145,
      approvalRate: 82,
      avgEvaluationDays: 18.5,
      pendingRenewals: 12,
      adverseEventsCount: 5
    });
  }

  getProtocolsByType(startDate?: Date, endDate?: Date): Observable<ProtocolStats[]> {
    return of([
      { type: 'Observacional (IO)', count: 65 },
      { type: 'Intervención (EI)', count: 45 },
      { type: 'Ensayo Clínico (EC)', count: 35 }
    ]);
  }

  getProtocolsByStatus(startDate?: Date, endDate?: Date): Observable<StatusStats[]> {
    return of([
      { status: 'Aprobado', count: 90 },
      { status: 'Pendiente', count: 30 },
      { status: 'Rechazado', count: 15 },
      { status: 'Vencido', count: 10 }
    ]);
  }

  getEvaluationTimes(startDate?: Date, endDate?: Date): Observable<EvaluationTimeStats[]> {
    return of([
      { month: 'Ene', avgDays: 15 },
      { month: 'Feb', avgDays: 18 },
      { month: 'Mar', avgDays: 22 },
      { month: 'Abr', avgDays: 16 },
      { month: 'May', avgDays: 19 },
      { month: 'Jun', avgDays: 21 }
    ]);
  }

  getWorkloadByEvaluator(startDate?: Date, endDate?: Date): Observable<WorkloadStats[]> {
    return of([
      { evaluator: 'Dr. Pérez', assignedCount: 12, completedCount: 10 },
      { evaluator: 'Dra. Gómez', assignedCount: 15, completedCount: 14 },
      { evaluator: 'Dr. Ruiz', assignedCount: 8, completedCount: 8 },
      { evaluator: 'Dra. Mora', assignedCount: 20, completedCount: 15 }
    ]);
  }

  getMSPReport(period: 'monthly' | 'annual', year: number, month?: number): Observable<MSPReportData> {
    return of({
      sessions: { ordinary: 4, extraordinary: 1 },
      attendance: [
        { member: 'Presidente', percentage: 100 },
        { member: 'Secretario', percentage: 100 },
        { member: 'Vocal 1', percentage: 80 }
      ],
      modalities: { exempt: 5, expedited: 12, full: 8 },
      resolutions: { approved: 15, conditioned: 7, notApproved: 3 },
      biologicalSamples: { yes: 10, no: 15 },
      vulnerablePopulations: [
        { type: 'Niños', count: 5 },
        { type: 'Mujeres Embarazadas', count: 2 }
      ]
    });
  }
}
