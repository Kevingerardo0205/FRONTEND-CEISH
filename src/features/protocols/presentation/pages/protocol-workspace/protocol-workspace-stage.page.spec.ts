import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { ProtocolWorkspaceStagePage } from './protocol-workspace-stage.page';

describe('ProtocolWorkspaceStagePage - F-01 adversarial isolation', () => {
  let fixture: ComponentFixture<ProtocolWorkspaceStagePage>;
  let ids: Subject<ParamMap>;
  let evaluations: jasmine.SpyObj<IEvaluationRepositoryPort>;

  beforeEach(() => {
    ids = new Subject<ParamMap>();
    evaluations = jasmine.createSpyObj('IEvaluationRepositoryPort', ['getByProtocolId']);
    TestBed.configureTestingModule({
      imports: [ProtocolWorkspaceStagePage],
      providers: [
        { provide: IEvaluationRepositoryPort, useValue: evaluations },
        { provide: IResolutionRepositoryPort, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { stage: 'EVALUACION' } },
            parent: { paramMap: ids, snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
          },
        },
      ],
    });
  });

  function create(response: Observable<EvaluationEntity[]>): void {
    evaluations.getByProtocolId.and.returnValue(response);
    fixture = TestBed.createComponent(ProtocolWorkspaceStagePage);
    fixture.detectChanges();
  }

  it('solo permite que B determine el estado cuando A responde tarde', () => {
    const a = new Subject<EvaluationEntity[]>();
    const b = new Subject<EvaluationEntity[]>();
    evaluations.getByProtocolId.and.returnValues(a, b);
    fixture = TestBed.createComponent(ProtocolWorkspaceStagePage);
    fixture.detectChanges();

    ids.next(convertToParamMap({ id: '2' }));
    b.next([{} as EvaluationEntity]);
    b.complete();
    a.next([{} as EvaluationEntity]);
    a.complete();
    fixture.detectChanges();

    expect(evaluations.getByProtocolId).toHaveBeenCalledWith('2');
    expect(fixture.componentInstance.recordCount()).toBe(1);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
  });

  it('limpia A inmediatamente y distingue una respuesta vacía de un error', () => {
    const a = of([{} as EvaluationEntity]);
    const b = new Subject<EvaluationEntity[]>();
    evaluations.getByProtocolId.and.returnValues(a, b);
    fixture = TestBed.createComponent(ProtocolWorkspaceStagePage);
    fixture.detectChanges();
    expect(fixture.componentInstance.recordCount()).toBe(1);

    ids.next(convertToParamMap({ id: '2' }));
    expect(fixture.componentInstance.recordCount()).toBe(0);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'loading' });

    b.next([]);
    b.complete();
    expect(fixture.componentInstance.recordCount()).toBe(0);
    expect(fixture.componentInstance.hasData()).toBeFalse();
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'empty' });
  });

  it('no inicia consultas con un identificador inválido y no conserva A', () => {
    create(of([{} as EvaluationEntity]));
    ids.next(convertToParamMap({ id: 'abc' }));

    expect(evaluations.getByProtocolId).toHaveBeenCalledOnceWith('1');
    expect(fixture.componentInstance.recordCount()).toBe(0);
    expect(fixture.componentInstance.informationState()).toEqual({ kind: 'unavailable' });
  });

  it('finaliza la suscripción al destruirse', () => {
    const pending = new Subject<EvaluationEntity[]>();
    create(pending);
    fixture.destroy();
    pending.next([{} as EvaluationEntity]);

    expect(pending.observed).toBeFalse();
  });

  it('con la etapa ya alcanzada pero sin pantalla muestra «Esta sección todavía no está disponible en el sistema.», distinto de «aún no llega» (F11-44)', () => {
    create(of([]));

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(fixture.componentInstance.screenMissingMessage).toBe(
      'Esta sección todavía no está disponible en el sistema.',
    );
    expect(text).toContain('Esta sección todavía no está disponible en el sistema.');
    expect(text).not.toContain('aún no está en la etapa');
    expect(text).not.toContain('Consulta disponible dentro del workspace');
  });
});
