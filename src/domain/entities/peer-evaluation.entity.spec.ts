import {
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse,
  AssignmentHistoryEntry,
  PendingPeerAssignmentProtocol,
  PeerAssignmentEntity,
  PEER_EVALUATOR_PROFILES,
  PEER_EVALUATOR_PROFILE_LABELS,
  normalizeProfile,
  profileCodesFromNames,
  dashboardMemberProfiles,
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

  it('lista los 5 perfiles estrictos del backend, con Bioético (F03 D9)', () => {
    expect([...PEER_EVALUATOR_PROFILES]).toEqual([
      'JURIDICO',
      'SOCIEDAD_CIVIL',
      'METODOLOGICO',
      'SALUD',
      'BIOETICO',
    ]);
  });

  it('una sola lista de etiquetas: cada perfil tiene la suya y Bioético se lee «Bioético»', () => {
    expect(Object.keys(PEER_EVALUATOR_PROFILE_LABELS).sort()).toEqual(
      [...PEER_EVALUATOR_PROFILES].sort(),
    );
    expect(PEER_EVALUATOR_PROFILE_LABELS.BIOETICO).toBe('Bioético');
  });

  it('normalizeProfile reconoce «Bioético» del catálogo (TSK-002-N50) y no «Ético»', () => {
    expect(normalizeProfile('Bioético')).toBe('BIOETICO');
    expect(normalizeProfile('BIOETICO')).toBe('BIOETICO');
    expect(normalizeProfile('Ético')).toBeNull();
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

  it('PendingPeerAssignmentProtocol admite null en lo que el backend no envía (F03 D2)', () => {
    const protocol: PendingPeerAssignmentProtocol = {
      id: 42,
      ceishCode: null,
      title: 'Estudio de prueba',
      studyType: null,
      principalInvestigator: null,
      receptionDate: null,
      isTimelineTermsAccepted: true,
    };

    expect(protocol.id).toBe(42);
    expect(protocol.ceishCode).toBeNull();
    expect(protocol.principalInvestigator).toBeNull();
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

  describe('perfiles del dashboard (F03 D8)', () => {
    it('profileCodesFromNames: nombres → códigos, sin repetidos ni desconocidos', () => {
      expect(
        profileCodesFromNames([
          { id: 7, name: 'Bioético' },
          { id: 10, name: 'Sociedad Civil' },
          { id: 7, name: 'Bioético' },
          { id: 99, name: 'Perfil desconocido' },
          null,
        ]),
      ).toEqual(['BIOETICO', 'SOCIEDAD_CIVIL']);
      expect(profileCodesFromNames(undefined)).toEqual([]);
    });

    it('dashboardMemberProfiles: id y perfiles; descarta entradas sin id numérico', () => {
      expect(
        dashboardMemberProfiles([
          { id: 1, fullName: 'Andrés Prueba', profiles: [{ id: 9, name: 'Salud' }] },
          { id: 2, fullName: 'Beatriz Prueba' },
          { id: '3', profiles: [{ id: 9, name: 'Salud' }] },
        ]),
      ).toEqual([
        { id: 1, profiles: ['SALUD'] },
        { id: 2, profiles: [] },
      ]);
      expect(dashboardMemberProfiles(null)).toEqual([]);
    });
  });
});
