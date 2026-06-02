import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity, EvaluationVerdict } from '@domain/entities/evaluation.entity';
import { PendingPeerAssignmentProtocol, PeerAssignmentEntity, AssignEvaluatorsResponse } from '@domain/entities/peer-evaluation.entity';

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
      daysRemaining: 1,
      isUrgent: true,
      annexToUse: 'ANEXO_9',
      reviewType: 'EXPEDITA',
      status: 'PENDING',
      verdict: EvaluationVerdict.APROBADO,
      evaluationDate: new Date()
    },
    { 
      id: 'ev2', 
      protocolId: '2',
      evaluatorId: 'eval-123',
      protocolCode: '2026-CC-005', 
      protocolType: 'CC',
      protocolTitle: 'Estudio clínico sobre nueva terapia de hipertensión', 
      investigator: 'Dr. Juan Pérez',
      deadline: new Date(new Date().setDate(new Date().getDate() + 10)),
      daysRemaining: 10,
      isUrgent: false,
      annexToUse: 'ANEXO_10',
      reviewType: 'PLENO',
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
        { id: 'ev-1', nombre: 'Dr. Marco Antonio', perfil: 'SALUD', cargaActiva: 2, terminadosMes: 5 },
        { id: 'ev-2', nombre: 'Dra. Elena Ramos', perfil: 'JURIDICO', cargaActiva: 0, terminadosMes: 2 },
        { id: 'ev-3', nombre: 'Dr. Luis Méndez', perfil: 'METODOLOGÍA', cargaActiva: 1, terminadosMes: 3 }
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

  getPendingSuggestions(): Observable<any[]> {
    return of([
      { id: 'sug-1', protocolId: '1', protocolCode: '2026-IO-001', protocolTitle: 'Protocolo de Prueba', evaluatorId: 'ev-1', evaluatorName: 'Dr. Marco Antonio', reviewType: 'EXPEDITA' },
      { id: 'sug-2', protocolId: '1', protocolCode: '2026-IO-001', protocolTitle: 'Protocolo de Prueba', evaluatorId: 'ev-3', evaluatorName: 'Dr. Luis Méndez', reviewType: 'EXPEDITA' }
    ]).pipe(delay(500));
  }

  confirmAssignment(payload: { evaluationId: string; deadline: string }): Observable<void> {
    console.log('Mock: Confirmando asignación', payload);
    return of(undefined).pipe(delay(500));
  }

  rejectSuggestion(id: string): Observable<void> {
    console.log('Mock: Rechazando sugerencia', id);
    this.mockEvaluations = this.mockEvaluations.filter(e => e.id !== id);
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
      { id: 3, name: 'ÉTICO' },
      { id: 4, name: 'METODOLOGÍA' }
    ]).pipe(delay(500));
  }

  createProfile(profile: any): Observable<any> { return of({ id: 1, ...profile }); }
  updateProfile(id: number, profile: any): Observable<any> { return of({ id, ...profile }); }
  deleteProfile(id: number): Observable<void> { return of(undefined); }

  consolidateEvaluation(protocolId: string): Observable<any> {
    return of({
      protocolId,
      consolidatedDate: new Date(),
      status: 'CONSOLIDATED',
      verdict: 'APROBADO',
      observations: 'Consolidación mock generada automáticamente.'
    }).pipe(delay(500));
  }

  // --- MOCKS PARA ESTRATIFICACIÓN DE RIESGO POR PARES (PET 4.2.1) ---

  getPendingPeerAssignmentProtocols(): Observable<PendingPeerAssignmentProtocol[]> {
    return of([
      {
        id: 12,
        ceishCode: "CEISH-ESPOCH-EI-012-2026",
        title: "Evaluación del balance nutricional en escolares de Chimborazo",
        receptionStatus: "COMPLETO",
        isRiskLevelDesignated: false,
        createdAt: new Date().toISOString(),
        studyType: {
          id: 2,
          codigo: "IO",
          nombre: "Investigación Observacional"
        },
        principalInvestigatorRecord: {
          id: 45,
          fullName: "Dra. María Carmen Ortega",
          email: "maria.ortega@espoch.edu.ec"
        }
      }
    ]).pipe(delay(500));
  }

  assignPeerEvaluators(protocolId: string, evaluatorIds: number[]): Observable<AssignEvaluatorsResponse> {
    console.log('Mock: Asignando pares evaluadores', protocolId, evaluatorIds);
    const mockRes: AssignEvaluatorsResponse = {
      message: `${evaluatorIds.length} evaluadores asignados exitosamente al protocolo.`,
      totalEvaluators: evaluatorIds.length,
      riskEvaluators: evaluatorIds.slice(0, 2),
      allEvaluators: evaluatorIds,
      versionId: 1,
      evaluationAssignmentIds: evaluatorIds.map((id, index) => 101 + index),
      deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString()
    };
    return of(mockRes).pipe(delay(500));
  }

  getMyPendingPeerAssignments(): Observable<PeerAssignmentEntity[]> {
    return of([
      {
        id: 8,
        protocolId: 12,
        evaluatorId: 3,
        proposedRiskLevelId: null,
        observations: null,
        assignedAt: new Date().toISOString(),
        submittedAt: null,
        protocol: {
          id: 12,
          ceishCode: "CEISH-ESPOCH-EI-012-2026",
          title: "Evaluación del balance nutricional en escolares de Chimborazo",
          studyType: {
            nombre: "Investigación Observacional"
          },
          principalInvestigatorRecord: {
            fullName: "Dra. María Carmen Ortega"
          }
        }
      }
    ]).pipe(delay(500));
  }

  submitPeerRiskProposed(assignmentId: string, payload: { riskLevelId: number; observations: string }): Observable<void> {
    console.log('Mock: Enviando propuesta de riesgo', assignmentId, payload);
    return of(undefined).pipe(delay(500));
  }

  getActiveEvaluators(): Observable<any[]> {
    return of([
      { id: 32, fullName: 'Test Evaluador', email: 'evaluador@test.com' },
      { id: 3, fullName: 'Dr. Marco Antonio', email: 'marco.antonio@espoch.edu.ec' },
      { id: 14, fullName: 'Dra. Elena Ramos', email: 'elena.ramos@espoch.edu.ec' }
    ]).pipe(delay(500));
  }
}
