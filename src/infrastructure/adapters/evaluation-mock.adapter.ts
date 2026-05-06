import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';

@Injectable({
  providedIn: 'root'
})
export class EvaluationMockAdapter extends IEvaluationRepositoryPort {
  
  submit(evaluation: Partial<EvaluationEntity>): Observable<EvaluationEntity> {
    console.log('Mock: Guardando evaluación...', evaluation);
    const mockResponse: EvaluationEntity = {
      id: Math.random().toString(36).substring(7),
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
}
