import {
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse,
  AssignmentHistoryEntry,
  PendingPeerAssignmentProtocol,
  PeerAssignmentEntity,
  PEER_EVALUATOR_PROFILES,
} from './peer-evaluation.entity';

describe('PeerEvaluation Canonical Entities', () => {
  it('should instantiate ReassignPeerEvaluatorPayload with numeric IDs and replacement profile for RF-12.3', () => {
    const payload: ReassignPeerEvaluatorPayload = {
      outgoingAssignmentId: 501,
      replacementEvaluatorId: 302,
      replacementEvaluatorProfile: 'METODOLOGICO',
      reason: 'CONFLICTO_INTERES',
      reasonDescription: 'El evaluador manifiesta conflicto de interés institucional.',
    };

    expect(payload.outgoingAssignmentId).toBe(501);
    expect(payload.replacementEvaluatorId).toBe(302);
    expect(payload.replacementEvaluatorProfile).toBe('METODOLOGICO');
    expect(payload.reason).toBe('CONFLICTO_INTERES');
  });

  it('should model ReassignPeerEvaluatorResponse as opaque known keys', () => {
    const response: ReassignPeerEvaluatorResponse = {
      outgoingAssignment: {},
      newAssignment: {},
      auditHistory: {},
    };

    expect(Object.keys(response)).toEqual(['outgoingAssignment', 'newAssignment', 'auditHistory']);
  });

  it('should list exactly the 4 strict backend profiles', () => {
    expect([...PEER_EVALUATOR_PROFILES]).toEqual([
      'JURIDICO',
      'SOCIEDAD_CIVIL',
      'METODOLOGICO',
      'SALUD',
    ]);
  });

  it('should instantiate AssignmentHistoryEntry with complete audit trail and numeric IDs', () => {
    const historyEntry: AssignmentHistoryEntry = {
      id: 801,
      assignmentId: 501,
      previousEvaluatorId: 201,
      previousEvaluatorName: 'Dr. Roberto Gómez',
      newEvaluatorId: 302,
      newEvaluatorName: 'Dra. María Morales',
      evaluatorProfile: 'METODOLOGICO',
      reassignmentReason: 'CONFLICTO_INTERES',
      reasonDescription: 'El evaluador manifiesta conflicto de interés institucional.',
      executedByUserId: 10,
      executedByUserName: 'Secretaria CEISH',
      executedAt: '2026-09-28T19:00:00.000Z',
    };

    expect(historyEntry.id).toBe(801);
    expect(historyEntry.assignmentId).toBe(501);
    expect(historyEntry.previousEvaluatorId).toBe(201);
    expect(historyEntry.newEvaluatorId).toBe(302);
    expect(historyEntry.evaluatorProfile).toBe('METODOLOGICO');
    expect(historyEntry.reassignmentReason).toBe('CONFLICTO_INTERES');
    expect(historyEntry.executedByUserId).toBe(10);
  });

  it('should instantiate PendingPeerAssignmentProtocol supporting RF-12.1 and RF-12.2', () => {
    const protocol: PendingPeerAssignmentProtocol = {
      id: 42,
      ceishCode: 'CEISH-ESPOCH-EI-001-2026',
      title: 'Estudio de Bioequivalencia y Bioética',
      receptionStatus: 'PENDING_ASSIGNMENT',
      isRiskLevelDesignated: false,
      createdAt: '2026-09-01T10:00:00.000Z',
      studyType: {
        id: 1,
        codigo: 'OBS',
        nombre: 'Observacional',
      },
      principalInvestigatorRecord: {
        id: 10,
        fullName: 'Dr. Investigador Principal',
        email: 'investigador@espoch.edu.ec',
      },
    };

    expect(protocol.id).toBe(42);
    expect(protocol.ceishCode).toBe('CEISH-ESPOCH-EI-001-2026');
    expect(protocol.studyType.codigo).toBe('OBS');
    expect(protocol.principalInvestigatorRecord.email).toBe('investigador@espoch.edu.ec');
  });

  it('should instantiate PeerAssignmentEntity supporting evaluator-protocol linkage for RF-12.4', () => {
    const assignment: PeerAssignmentEntity = {
      id: 501,
      protocolId: 42,
      evaluatorId: 201,
      proposedRiskLevelId: 5,
      observations: 'Revisión sin observaciones críticas.',
      assignedAt: '2026-09-02T12:00:00.000Z',
      submittedAt: '2026-09-05T18:00:00.000Z',
      protocol: {
        id: 42,
        ceishCode: 'CEISH-ESPOCH-EI-001-2026',
        title: 'Estudio de Bioequivalencia y Bioética',
        studyType: {
          nombre: 'Observacional',
        },
        principalInvestigatorRecord: {
          fullName: 'Dr. Investigador Principal',
        },
      },
    };

    expect(assignment.id).toBe(501);
    expect(assignment.protocolId).toBe(42);
    expect(assignment.evaluatorId).toBe(201);
    expect(assignment.proposedRiskLevelId).toBe(5);
    expect(assignment.protocol.ceishCode).toBe('CEISH-ESPOCH-EI-001-2026');
  });
});
