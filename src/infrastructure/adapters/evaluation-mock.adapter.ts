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

  getEvaluatorsDashboard(profileId?: string): Observable<any> {
    return of({
      pendingProtocols: [
        { protocolId: '1', protocolCode: '2026-IO-001', protocolTitle: 'Protocolo de Prueba' }
      ],
      evaluators: [
        { id: 'ev-1', nombre: 'Evaluador Mock 1', perfil: 'SALUD', cargaActiva: 2 }
      ],
      suggestedEvaluations: []
    }).pipe(delay(500));
  }

  suggestEvaluators(payload: { protocolId: string; evaluatorIds: string[] }): Observable<void> {
    console.log('Mock: Sugiriendo evaluadores', payload);
    return of(undefined).pipe(delay(500));
  }

  confirmAssignment(payload: { evaluationId: string; deadline: string }): Observable<void> {
    console.log('Mock: Confirmando asignación', payload);
    return of(undefined).pipe(delay(500));
  }

  getMyAssignments(): Observable<any[]> {
    return of(this.mockEvaluations).pipe(delay(500));
  }

  submitEvaluation(data: FormData): Observable<void> {
    console.log('Mock: Enviando evaluación (FormData)');
    return of(undefined).pipe(delay(1000));
  }

  getProfiles(): Observable<any[]> {
    return of([
      { id: 1, name: 'SALUD' },
      { id: 2, name: 'JURÍDICO' },
      { id: 3, name: 'ÉTICO' }
    ]).pipe(delay(500));
  }

  createProfile(profile: any): Observable<any> {
    console.log('Mock: Creando perfil', profile);
    return of({ id: Math.floor(Math.random() * 1000), ...profile }).pipe(delay(500));
  }

  updateProfile(id: number, profile: any): Observable<any> {
    console.log('Mock: Actualizando perfil', id, profile);
    return of({ id, ...profile }).pipe(delay(500));
  }

  deleteProfile(id: number): Observable<void> {
    console.log('Mock: Eliminando perfil', id);
    return of(undefined).pipe(delay(500));
  }
}
