import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReassignPeerEvaluatorUseCase } from './reassign-peer-evaluator.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  ReassignPeerEvaluatorPayload,
  ReassignPeerEvaluatorResponse
} from '@domain/entities/peer-evaluation.entity';

describe('ReassignPeerEvaluatorUseCase (RF-12.3)', () => {
  let useCase: ReassignPeerEvaluatorUseCase;
  let evalRepoSpy: jasmine.SpyObj<IEvaluationRepositoryPort>;

  const mockResponse: ReassignPeerEvaluatorResponse = {
    outgoingAssignment: {},
    newAssignment: {},
    auditHistory: {}
  };

  const basePayload: ReassignPeerEvaluatorPayload = {
    outgoingAssignmentId: 6,
    replacementEvaluatorId: 38,
    replacementEvaluatorProfile: 'METODOLOGICO',
    reason: 'CONFLICTO_INTERES',
    reasonDescription: 'Conflicto de interés declarado y validado.'
  };

  beforeEach(() => {
    evalRepoSpy = jasmine.createSpyObj('IEvaluationRepositoryPort', ['reassignPeerEvaluator']);

    TestBed.configureTestingModule({
      providers: [
        ReassignPeerEvaluatorUseCase,
        { provide: IEvaluationRepositoryPort, useValue: evalRepoSpy }
      ]
    });

    useCase = TestBed.inject(ReassignPeerEvaluatorUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call reassignPeerEvaluator on repository for valid reason CONFLICTO_INTERES', (done) => {
    evalRepoSpy.reassignPeerEvaluator.and.returnValue(of(mockResponse));

    useCase.execute(basePayload).subscribe({
      next: (result) => {
        expect(evalRepoSpy.reassignPeerEvaluator).toHaveBeenCalledWith(basePayload);
        expect(result).toEqual(mockResponse);
        done();
      },
      error: done.fail
    });
  });

  it('should call reassignPeerEvaluator on repository for valid reason VENCIMIENTO', (done) => {
    const payload: ReassignPeerEvaluatorPayload = {
      ...basePayload,
      reason: 'VENCIMIENTO',
      reasonDescription: 'Plazo reglamentario de 10 días hábiles vencido.'
    };

    evalRepoSpy.reassignPeerEvaluator.and.returnValue(of(mockResponse));

    useCase.execute(payload).subscribe({
      next: (result) => {
        expect(evalRepoSpy.reassignPeerEvaluator).toHaveBeenCalledWith(payload);
        expect(result).toEqual(mockResponse);
        done();
      },
      error: done.fail
    });
  });

  it('should throw an error if reason is invalid or empty', (done) => {
    const payload = { ...basePayload, reason: 'OTRO_MOTIVO' as any };

    useCase.execute(payload).subscribe({
      next: () => done.fail('Expected error to be thrown'),
      error: (err) => {
        expect(err.message).toContain('Motivo de reasignación inválido');
        expect(evalRepoSpy.reassignPeerEvaluator).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should throw an error if reasonDescription is shorter than 10 characters', (done) => {
    const payload: ReassignPeerEvaluatorPayload = { ...basePayload, reasonDescription: 'Corta' };

    useCase.execute(payload).subscribe({
      next: () => done.fail('Expected error to be thrown'),
      error: (err) => {
        expect(err.message).toContain('mínimo 10 caracteres');
        expect(evalRepoSpy.reassignPeerEvaluator).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
