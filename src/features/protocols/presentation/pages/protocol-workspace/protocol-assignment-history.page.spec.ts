import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ActiveAssignmentsResult, AssignmentHistoryEntry } from '@domain/entities/peer-evaluation.entity';
import { LoadActiveAssignmentsUseCase } from '@features/evaluations/application/load-active-assignments.use-case';
import { LoadAssignmentHistoryUseCase } from '@features/evaluations/application/load-assignment-history.use-case';
import { ProtocolAssignmentHistoryPage } from './protocol-assignment-history.page';

const ACTIVE: ActiveAssignmentsResult = {
  protocolId: 42,
  ceishCode: 'CEISH-42',
  versionId: 7,
  versionNumber: 1,
  assignments: [
    {
      assignmentId: 11,
      evaluatorId: 9,
      evaluatorFullName: 'Evaluador real',
      evaluatorProfile: 'SALUD',
      status: 'ASSIGNED',
      isAssignedForAnnex10: true,
      assignedAt: '2026-11-22T10:00:00Z',
      deadlineDate: null,
      submittedAt: null,
    },
  ],
};

const HISTORY: AssignmentHistoryEntry[] = [
  {
    id: 20,
    assignmentId: 11,
    previousEvaluatorId: 8,
    previousEvaluatorName: 'Evaluador anterior',
    newEvaluatorId: 9,
    newEvaluatorName: 'Evaluador real',
    evaluatorProfile: 'SALUD',
    reassignmentReason: 'VENCIMIENTO',
    reasonDescription: 'Vencimiento',
    executedByUserId: 3,
    executedByUserName: 'Secretaría',
    executedAt: '2026-11-23T10:00:00Z',
  },
];

describe('ProtocolAssignmentHistoryPage', () => {
  let fixture: ComponentFixture<ProtocolAssignmentHistoryPage>;
  let activeUseCase: jasmine.SpyObj<LoadActiveAssignmentsUseCase>;
  let historyUseCase: jasmine.SpyObj<LoadAssignmentHistoryUseCase>;

  function setup(
    active = of(ACTIVE),
    history = of(HISTORY),
  ): void {
    activeUseCase = jasmine.createSpyObj('LoadActiveAssignmentsUseCase', ['execute']);
    historyUseCase = jasmine.createSpyObj('LoadAssignmentHistoryUseCase', ['execute']);
    activeUseCase.execute.and.returnValue(active);
    historyUseCase.execute.and.returnValue(history);

    TestBed.configureTestingModule({
      imports: [ProtocolAssignmentHistoryPage],
      providers: [
        { provide: LoadActiveAssignmentsUseCase, useValue: activeUseCase },
        { provide: LoadAssignmentHistoryUseCase, useValue: historyUseCase },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: new Map([['id', '42']]) } } } },
      ],
    });
    fixture = TestBed.createComponent(ProtocolAssignmentHistoryPage);
    fixture.detectChanges();
  }

  it('consulta solo fuentes de lectura con el protocolId de la ruta', () => {
    setup();

    expect(activeUseCase.execute).toHaveBeenCalledOnceWith(42);
    expect(historyUseCase.execute).toHaveBeenCalledOnceWith(42);
    expect(fixture.componentInstance.protocolId()).toBe(42);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador real');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Historial de reasignaciones');
  });

  it('distingue una respuesta correcta sin registros', () => {
    setup(of({ ...ACTIVE, assignments: [] }), of([]));

    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin registros');
  });

  it('no convierte un error de consulta en estado vacío', () => {
    setup(throwError(() => new Error('fallo de consulta')), of([]));

    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'error' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pudimos consultar');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sin registros');
  });
});
