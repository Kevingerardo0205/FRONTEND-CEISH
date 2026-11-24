import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
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

const ACTIVE_B: ActiveAssignmentsResult = {
  ...ACTIVE,
  protocolId: 43,
  ceishCode: 'CEISH-43',
  assignments: [
    {
      ...ACTIVE.assignments[0],
      assignmentId: 33,
      evaluatorId: 29,
      evaluatorFullName: 'Evaluador B',
    },
  ],
};

const HISTORY_B: AssignmentHistoryEntry[] = [
  {
    ...HISTORY[0],
    id: 44,
    assignmentId: 33,
    previousEvaluatorName: 'Evaluador previo B',
    newEvaluatorId: 29,
    newEvaluatorName: 'Evaluador B',
  },
];

describe('ProtocolAssignmentHistoryPage', () => {
  let fixture: ComponentFixture<ProtocolAssignmentHistoryPage>;
  let activeUseCase: jasmine.SpyObj<LoadActiveAssignmentsUseCase>;
  let historyUseCase: jasmine.SpyObj<LoadAssignmentHistoryUseCase>;

  function setup(
    active: Observable<ActiveAssignmentsResult> | Observable<ActiveAssignmentsResult>[] = of(ACTIVE),
    history: Observable<AssignmentHistoryEntry[]> | Observable<AssignmentHistoryEntry[]>[] = of(HISTORY),
    ids?: Subject<ParamMap>,
  ): void {
    activeUseCase = jasmine.createSpyObj('LoadActiveAssignmentsUseCase', ['execute']);
    historyUseCase = jasmine.createSpyObj('LoadAssignmentHistoryUseCase', ['execute']);
    const activeResponses = Array.isArray(active) ? active : [active];
    const historyResponses = Array.isArray(history) ? history : [history];
    if (activeResponses.length === 1) {
      activeUseCase.execute.and.returnValue(activeResponses[0]);
    } else {
      activeUseCase.execute.and.returnValues(...activeResponses);
    }
    if (historyResponses.length === 1) {
      historyUseCase.execute.and.returnValue(historyResponses[0]);
    } else {
      historyUseCase.execute.and.returnValues(...historyResponses);
    }

    TestBed.configureTestingModule({
      imports: [ProtocolAssignmentHistoryPage],
      providers: [
        { provide: LoadActiveAssignmentsUseCase, useValue: activeUseCase },
        { provide: LoadAssignmentHistoryUseCase, useValue: historyUseCase },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { paramMap: ids, snapshot: { paramMap: convertToParamMap({ id: '42' }) } },
          },
        },
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

  it('limpia A y conserva exclusivamente B cuando cambia el protocolo', () => {
    const ids = new Subject<ParamMap>();
    const activeB = new Subject<ActiveAssignmentsResult>();
    const historyB = new Subject<AssignmentHistoryEntry[]>();
    setup([of(ACTIVE), activeB], [of(HISTORY), historyB], ids);
    expect(fixture.componentInstance.activeAssignments()).toEqual(ACTIVE.assignments);
    expect(fixture.componentInstance.history()).toEqual(HISTORY);

    ids.next(convertToParamMap({ id: '43' }));
    expect(fixture.componentInstance.activeAssignments()).toEqual([]);
    expect(fixture.componentInstance.history()).toEqual([]);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'loading' });

    activeB.next(ACTIVE_B);
    activeB.complete();
    historyB.next(HISTORY_B);
    historyB.complete();
    expect(fixture.componentInstance.protocolId()).toBe(43);
    expect(fixture.componentInstance.activeAssignments()).toEqual(ACTIVE_B.assignments);
    expect(fixture.componentInstance.history()).toEqual(HISTORY_B);
    expect(fixture.componentInstance.hasRecords()).toBeTrue();
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador B');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador previo B');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador real');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador anterior');
  });

  it('si falla activeAssignments en A, ambas consultas de B siguen ejecutándose', () => {
    const ids = new Subject<ParamMap>();
    setup(
      [throwError(() => new Error('active A')), of(ACTIVE_B)],
      [of(HISTORY), of(HISTORY_B)],
      ids,
    );

    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'error' });
    ids.next(convertToParamMap({ id: '43' }));
    expect(activeUseCase.execute).toHaveBeenCalledWith(43);
    expect(historyUseCase.execute).toHaveBeenCalledWith(43);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
    expect(fixture.componentInstance.activeAssignments()).toEqual(ACTIVE_B.assignments);
    expect(fixture.componentInstance.hasRecords()).toBeTrue();
    expect(fixture.componentInstance.history()).toEqual(HISTORY_B);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador B');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador real');
  });

  it('si falla history en A, el cambio a B no queda bloqueado', () => {
    const ids = new Subject<ParamMap>();
    setup(
      [of(ACTIVE), of(ACTIVE_B)],
      [throwError(() => new Error('history A')), of(HISTORY_B)],
      ids,
    );

    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'error' });
    ids.next(convertToParamMap({ id: '43' }));
    expect(activeUseCase.execute).toHaveBeenCalledWith(43);
    expect(historyUseCase.execute).toHaveBeenCalledWith(43);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
    expect(fixture.componentInstance.activeAssignments()).toEqual(ACTIVE_B.assignments);
    expect(fixture.componentInstance.history()).toEqual(HISTORY_B);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador B');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador real');
  });

  it('si B falla, no conserva datos visibles de A ni muestra una carga parcial', () => {
    const ids = new Subject<ParamMap>();
    setup(of(ACTIVE), [of(HISTORY), throwError(() => new Error('history B'))], ids);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador real');

    ids.next(convertToParamMap({ id: '43' }));

    expect(fixture.componentInstance.activeAssignments()).toEqual([]);
    expect(fixture.componentInstance.history()).toEqual([]);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'error' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador real');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pudimos consultar');
  });

  it('una respuesta tardía de A no sobrescribe B', () => {
    const ids = new Subject<ParamMap>();
    const activeA = new Subject<ActiveAssignmentsResult>();
    const historyA = new Subject<AssignmentHistoryEntry[]>();
    setup([activeA, of(ACTIVE_B)], [historyA, of(HISTORY_B)], ids);

    ids.next(convertToParamMap({ id: '43' }));
    activeA.next(ACTIVE);
    historyA.next(HISTORY);
    fixture.detectChanges();

    expect(fixture.componentInstance.protocolId()).toBe(43);
    expect(fixture.componentInstance.activeAssignments()).toEqual(ACTIVE_B.assignments);
    expect(fixture.componentInstance.history()).toEqual(HISTORY_B);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Evaluador B');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Evaluador real');
  });

  it('un id inválido posterior a A limpia asignaciones e historial', () => {
    const ids = new Subject<ParamMap>();
    setup(of(ACTIVE), of(HISTORY), ids);
    ids.next(convertToParamMap({ id: 'abc' }));

    expect(activeUseCase.execute).toHaveBeenCalledOnceWith(42);
    expect(historyUseCase.execute).toHaveBeenCalledOnceWith(42);
    expect(fixture.componentInstance.protocolId()).toBeNull();
    expect(fixture.componentInstance.activeAssignments()).toEqual([]);
    expect(fixture.componentInstance.history()).toEqual([]);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'unavailable' });
  });

  it('una emisión duplicada del mismo id no duplica las consultas', () => {
    const ids = new Subject<ParamMap>();
    setup(of(ACTIVE), of(HISTORY), ids);

    ids.next(convertToParamMap({ id: '42' }));

    expect(activeUseCase.execute).toHaveBeenCalledOnceWith(42);
    expect(historyUseCase.execute).toHaveBeenCalledOnceWith(42);
  });

  it('destruir el componente cancela la ruta y ambas consultas pendientes', () => {
    const ids = new Subject<ParamMap>();
    const active = new Subject<ActiveAssignmentsResult>();
    const history = new Subject<AssignmentHistoryEntry[]>();
    setup(active, history, ids);

    fixture.destroy();
    active.next(ACTIVE);
    history.next(HISTORY);

    expect(ids.observers.length).toBe(0);
    expect(active.observers.length).toBe(0);
    expect(history.observers.length).toBe(0);
  });
});
