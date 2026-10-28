import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EvaluationApiAdapter } from './evaluation-api.adapter';
import {
  ActiveAssignmentsResult,
  AssignmentHistoryEntry,
  ReassignPeerEvaluatorPayload,
} from 'src/domain/entities/peer-evaluation.entity';
import { ACTIVE_ASSIGNMENTS_119_BODY } from '@features/evaluations/testing/reassignment.fixtures';

describe('EvaluationApiAdapter (Infrastructure)', () => {
  let adapter: EvaluationApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(EvaluationApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getActiveAssignments', () => {
    it('hace GET /api/evaluations/protocol/119/active-assignments y devuelve data del fixture real', () => {
      let result: ActiveAssignmentsResult | undefined;
      adapter.getActiveAssignments(119).subscribe((r) => (result = r));

      const req = httpMock.expectOne('/api/evaluations/protocol/119/active-assignments');
      expect(req.request.method).toBe('GET');
      req.flush(ACTIVE_ASSIGNMENTS_119_BODY);

      expect(result?.protocolId).toBe(119);
      expect(result?.ceishCode).toBe('CEISH-ESPOCH-EI-007-2026');
      expect(result?.versionNumber).toBe(1);
      expect(result?.assignments.length).toBe(5);
      expect(result?.assignments[0]).toEqual({
        assignmentId: 6,
        evaluatorId: 39,
        evaluatorFullName: 'Ana Karina Albuja Landi',
        evaluatorProfile: 'METODOLOGICO',
        status: 'ASSIGNED',
        isAssignedForAnnex10: false,
        assignedAt: '2026-06-03T05:19:06.698Z',
        deadlineDate: '2026-06-23',
        submittedAt: null,
      });
    });

    it('lanza un error claro si data no trae el arreglo assignments (no devuelve vacío)', () => {
      let error: Error | undefined;
      let next = false;
      adapter
        .getActiveAssignments(119)
        .subscribe({ next: () => (next = true), error: (e) => (error = e) });

      httpMock
        .expectOne('/api/evaluations/protocol/119/active-assignments')
        .flush({ data: { protocolId: 119 }, statusCode: 200, message: 'Success' });

      expect(next).toBeFalse();
      expect(error?.message).toContain('falta data.assignments');
    });
  });

  describe('reassignPeerEvaluator', () => {
    const payload: ReassignPeerEvaluatorPayload = {
      outgoingAssignmentId: 6,
      replacementEvaluatorId: 38,
      replacementEvaluatorProfile: 'METODOLOGICO',
      reason: 'VENCIMIENTO',
      reasonDescription: 'Plazo reglamentario vencido sin entrega de la evaluación.',
    };

    it('envía a POST /api/evaluations/reassign exactamente el cuerpo real del backend', () => {
      adapter.reassignPeerEvaluator(payload).subscribe();

      const req = httpMock.expectOne('/api/evaluations/reassign');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        currentAssignmentId: 6,
        replacementEvaluatorId: 38,
        replacementEvaluatorProfile: 'METODOLOGICO',
        reason: 'VENCIMIENTO',
        reasonDescription: 'Plazo reglamentario vencido sin entrega de la evaluación.',
      });
      expect(Object.keys(req.request.body)).not.toContain('protocolId');
      expect(Object.keys(req.request.body)).not.toContain('outgoingAssignmentId');
      req.flush({ data: {}, statusCode: 201, message: 'Success' });
    });

    it('devuelve data opaca {outgoingAssignment, newAssignment, auditHistory} sin interpretarla', () => {
      // Solo las llaves son conocidas; su contenido interno no está verificado.
      const data = {
        outgoingAssignment: { id: 6 },
        newAssignment: { id: 11 },
        auditHistory: { id: 1 },
      };
      let result: unknown;
      adapter.reassignPeerEvaluator(payload).subscribe((r) => (result = r));

      httpMock
        .expectOne('/api/evaluations/reassign')
        .flush({ data, statusCode: 201, message: 'Success' });

      expect(result).toEqual(data);
    });
  });

  describe('getAssignmentHistory', () => {
    it('consulta el historial con id numérico y devuelve las entradas', () => {
      const entry: AssignmentHistoryEntry = {
        id: 801,
        assignmentId: 6,
        previousEvaluatorId: 39,
        previousEvaluatorName: 'Ana Karina Albuja Landi',
        newEvaluatorId: 38,
        newEvaluatorName: 'Patricio David Ramos Padilla',
        evaluatorProfile: 'METODOLOGICO',
        reassignmentReason: 'VENCIMIENTO',
        reasonDescription: 'Plazo reglamentario vencido.',
        executedByUserId: 10,
        executedByUserName: 'Secretaria CEISH',
        executedAt: '2026-09-28T19:00:00.000Z',
      };
      let history: AssignmentHistoryEntry[] = [];
      adapter.getAssignmentHistory(119).subscribe((h) => (history = h));

      const req = httpMock.expectOne('/api/evaluations/protocol/119/reassignment-history');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [entry], statusCode: 200, message: 'Success' });

      expect(history).toEqual([entry]);
    });
  });
});
