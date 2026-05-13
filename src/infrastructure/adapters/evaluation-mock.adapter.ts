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
      deadline: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'PENDING',
      verdict: EvaluationVerdict.APROBADO,
      evaluationDate: new Date()
    }
  ];

  getByProtocolId(protocolId: string): Observable<EvaluationEntity[]> {
    return of(this.mockEvaluations.filter(e => e.protocolId === protocolId)).pipe(delay(500));
  }

  getByEvaluatorId(evaluatorId: string): Observable<any[]> {
    const filtered = this.mockEvaluations.filter(e => e.evaluatorId === evaluatorId);
    return of(filtered).pipe(delay(500));
  }

  getEvaluatorsDashboard(profileId?: string): Observable<any> {
    return of({
      pendingProtocols: [
        { protocolId: '1', protocolCode: '2026-IO-001', protocolTitle: 'Protocolo de Prueba' }
      ],
      evaluators: [
        { id: 'ev-1', nombre: 'Dr. Marco Antonio', perfil: 'SALUD', cargaActiva: 2 },
        { id: 'ev-2', nombre: 'Dra. Elena Ramos', perfil: 'JURIDICO', cargaActiva: 0 }
      ],
      suggestedEvaluations: [
        { id: 'sug-1', protocolId: '1', protocolCode: '2026-IO-001', protocolTitle: 'Protocolo de Prueba', evaluatorId: 'ev-1', evaluatorName: 'Dr. Marco Antonio', evaluatorProfile: 'SALUD', deadline: null }
      ]
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
    console.log('Mock: Enviando evaluación (FormData)', data.get('evaluationData'));
    return of(undefined).pipe(delay(1000));
  }

  getProfiles(): Observable<any[]> {
    return of([
      { id: 1, name: 'SALUD' },
      { id: 2, name: 'JURÍDICO' },
      { id: 3, name: 'ÉTICO' }
    ]).pipe(delay(500));
  }

  createProfile(profile: any): Observable<any> { return of({ id: 1, ...profile }); }
  updateProfile(id: number, profile: any): Observable<any> { return of({ id, ...profile }); }
  deleteProfile(id: number): Observable<void> { return of(undefined); }
}
