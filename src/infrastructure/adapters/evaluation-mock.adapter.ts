import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity, EvaluationVerdict } from '@domain/entities/evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class EvaluationMockAdapter extends IEvaluationRepositoryPort {
  
  private mockEvaluations: any[] = [
    { 
      id: 'ev1', 
      protocolId: '1',
      evaluatorId: 'eval-123',
      protocolCode: '2026-IO-001', 
      protocolType: 'IO',
      protocolTitle: 'Prevalencia de parasitosis intestinal mediante técnicas coproparasitológicas en niños...', 
      investigator: 'Dra. Ana María Lucía',
      deadline: new Date(new Date().setDate(new Date().getDate() + 1)), // Crítico: 1 día restante
      status: 'PENDING' 
    },
    { 
      id: 'ev2', 
      protocolId: '2',
      evaluatorId: 'eval-123',
      protocolCode: '2026-EC-002', 
      protocolType: 'EC',
      protocolTitle: 'Estudio comparativo de la eficacia de dos protocolos de rehabilitación post-infarto', 
      investigator: 'Dr. Roberto Carlos Espinoza',
      deadline: new Date(new Date().setDate(new Date().getDate() + 10)), 
      status: 'IN_PROGRESS' 
    }
  ];

  submit(evaluation: Partial<EvaluationEntity>): Observable<EvaluationEntity> {
    console.log('Mock: Guardando evaluación...', evaluation);
    const mockResponse: EvaluationEntity = {
      id: evaluation.id || Math.random().toString(36).substring(7),
      protocolId: evaluation.protocolId || 'unknown',
      evaluatorId: evaluation.evaluatorId || 'user-123',
      technicalCriteria: evaluation.technicalCriteria || [],
      technicalObservations: evaluation.technicalObservations || '',
      ethicalCriteria: evaluation.ethicalCriteria || [],
      ethicalObservations: evaluation.ethicalObservations || '',
      verdict: evaluation.verdict || (null as any),
      actaUrl: 'mock-url-acta.pdf',
      evaluationDate: new Date()
    };
    return of(mockResponse).pipe(delay(1500));
  }

  getByProtocolId(protocolId: string): Observable<EvaluationEntity[]> {
    return of([]);
  }

  getByEvaluatorId(evaluatorId: string): Observable<any[]> {
    // Filtramos por evaluador
    const filtered = this.mockEvaluations.filter(e => e.evaluatorId === evaluatorId);
    return of(filtered).pipe(delay(500));
  }
}
