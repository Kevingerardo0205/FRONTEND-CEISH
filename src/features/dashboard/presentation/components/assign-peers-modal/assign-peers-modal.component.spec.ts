import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { AssignPeersModalComponent } from './assign-peers-modal.component';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import {
  AssignEvaluatorsResponse,
  PEER_ASSIGNMENT_QUOTA,
  PendingPeerAssignmentProtocol,
} from '@domain/entities/peer-evaluation.entity';

/**
 * F10 S-1h (D15). Referencias independientes del código:
 * - la cuota que exige hoy el backend `dev` (`evaluator-assignment-adapter.service.ts:56-64` y
 *   `:109-114`; `random-risk-selector.service.ts`), escrita aquí a mano;
 * - los textos aprobados de D15, escritos aquí a mano;
 * - los evaluadores con la forma de `findEvaluatorsWithWorkload` del backend (`profiles: {id, name}[]`);
 * - el 400 de la cuota con el texto del backend.
 */
const BACKEND_PROFILES = ['JURIDICO', 'SOCIEDAD_CIVIL', 'METODOLOGICO', 'SALUD'];
const INSTRUCTION =
  'Seleccione exactamente 4 evaluadores, uno por cada perfil: Jurídico, Sociedad Civil, ' +
  'Metodológico y Salud. El sistema elegirá al azar a 2, sin contar Sociedad Civil, para la ' +
  'estratificación de riesgo.';
const SELECT_LABEL = 'Evaluadores (exactamente 4)';
const TOO_MANY = 'Seleccione solo 4 evaluadores.';
const NO_DEADLINE = 'La fecha límite del dictamen se fija cuando el protocolo entre en una convocatoria.';
const QUOTA_400 =
  'La cuota exige exactamente 1 evaluador por cada uno de los 4 perfiles obligatorios: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO y SALUD.';

const EVALUATORS = {
  evaluators: [
    { id: 11, fullName: 'Evaluador Uno Prueba', email: 'uno@example.test', profiles: [{ id: 1, name: 'Jurídico' }], currentLoad: 0, completedThisMonth: 0 },
    { id: 12, fullName: 'Evaluador Dos Prueba', email: 'dos@example.test', profiles: [{ id: 2, name: 'Sociedad Civil' }], currentLoad: 1, completedThisMonth: 0 },
    { id: 13, fullName: 'Evaluador Tres Prueba', email: 'tres@example.test', profiles: [{ id: 3, name: 'Metodológico' }], currentLoad: 1, completedThisMonth: 0 },
    { id: 14, fullName: 'Evaluador Cuatro Prueba', email: 'cuatro@example.test', profiles: [{ id: 4, name: 'Salud' }, { id: 3, name: 'Metodológico' }], currentLoad: 2, completedThisMonth: 1 },
    { id: 15, fullName: 'Evaluador Cinco Prueba', email: 'cinco@example.test', profiles: [], currentLoad: 3, completedThisMonth: 0 },
  ],
  pendingProtocols: [],
};

/** Datos que arma el espacio del protocolo con un `GET /protocols/:id` real: sin tipo ni investigadores. */
function workspaceProtocol(overrides: Partial<PendingPeerAssignmentProtocol> = {}): PendingPeerAssignmentProtocol {
  return {
    id: 5,
    ceishCode: '',
    title: 'Estudio de prueba del investigador',
    receptionStatus: 'COMPLETO',
    isRiskLevelDesignated: false,
    createdAt: '',
    studyType: { id: 0, codigo: '', nombre: '' },
    principalInvestigatorRecord: { id: 0, fullName: '', email: '' },
    ...overrides,
  };
}

describe('AssignPeersModalComponent (F10 D15, S-1h)', () => {
  let repo: { getEvaluatorsDashboard: jasmine.Spy; assignPeerEvaluators: jasmine.Spy };
  let snackOpen: jasmine.Spy;

  function render(protocol = workspaceProtocol()) {
    TestBed.configureTestingModule({
      imports: [AssignPeersModalComponent],
      providers: [
        provideNoopAnimations(),
        { provide: IEvaluationRepositoryPort, useValue: repo },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { protocol } },
      ],
    });
    TestBed.overrideComponent(AssignPeersModalComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: { open: snackOpen } }] },
    });
    const fixture = TestBed.createComponent(AssignPeersModalComponent);
    fixture.detectChanges();
    return fixture;
  }

  function text(fixture: { nativeElement: HTMLElement }): string {
    return (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
  }

  function submitButton(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Finalizar Asignación'),
    ) as HTMLButtonElement;
  }

  beforeEach(() => {
    repo = {
      getEvaluatorsDashboard: jasmine.createSpy('getEvaluatorsDashboard').and.returnValue(of(EVALUATORS)),
      assignPeerEvaluators: jasmine.createSpy('assignPeerEvaluators'),
    };
    snackOpen = jasmine.createSpy('open');
  });

  it('la cuota copia la del backend y la instrucción y la etiqueta salen de ella', () => {
    expect<string[]>([...PEER_ASSIGNMENT_QUOTA.profiles]).toEqual(BACKEND_PROFILES);
    expect(PEER_ASSIGNMENT_QUOTA.total).toBe(4);

    const fixture = render();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.quota-instruction')?.textContent?.trim()).toBe(INSTRUCTION);
    expect(root.querySelector('mat-label')?.textContent?.trim()).toBe(SELECT_LABEL);
    expect(text(fixture)).not.toContain('mínimo');
    expect(text(fixture)).not.toContain('Mínimo');
  });

  it('sin tipo ni investigador ni código no muestra rellenos ("General", "Investigador Principal")', () => {
    const fixture = render();
    const root = fixture.nativeElement as HTMLElement;

    expect(text(fixture)).not.toContain('General');
    expect(text(fixture)).not.toContain('Investigador Principal');
    expect(root.querySelector('.protocol-card .code')).toBeNull();
    expect(root.querySelector('.meta-type')).toBeNull();
    expect(root.querySelector('.meta-investigator')).toBeNull();
    expect(root.querySelector('.protocol-card .title')?.textContent?.trim()).toBe(
      'Estudio de prueba del investigador',
    );
  });

  it('con tipo, investigador y código, los muestra', () => {
    const fixture = render(
      workspaceProtocol({
        ceishCode: 'CEISH-PRUEBA-001',
        studyType: { id: 0, codigo: 'EI', nombre: 'Investigación de prueba' },
        principalInvestigatorRecord: { id: 0, fullName: 'Investigador Prueba', email: '' },
      }),
    );
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.protocol-card .code')?.textContent?.trim()).toBe('CEISH-PRUEBA-001');
    expect(root.querySelector('.meta-type')?.textContent).toContain('Investigación de prueba');
    expect(root.querySelector('.meta-investigator')?.textContent).toContain('Investigador Prueba');
  });

  it('la lista muestra todos los perfiles de cada evaluador y "Sin perfil" si no tiene', () => {
    const fixture = render();
    const byId = new Map(fixture.componentInstance.evaluators().map((e) => [e.id, e.perfil]));

    expect(byId.get('14')).toBe('Salud, Metodológico');
    expect(byId.get('15')).toBe('Sin perfil');
  });

  it('solo se puede asignar con la cantidad exacta de la cuota; con más, avisa', () => {
    const fixture = render();
    const select = (ids: string[]) => {
      fixture.componentInstance.evaluatorsControl.setValue(ids);
      fixture.detectChanges();
    };

    select(['11', '12', '13']);
    expect(submitButton(fixture).disabled).toBeTrue();

    select(['11', '12', '13', '14', '15']);
    expect(submitButton(fixture).disabled).toBeTrue();
    expect(text(fixture)).toContain(TOO_MANY);

    select(['11', '12', '13', '14']);
    expect(submitButton(fixture).disabled).toBeFalse();
    expect(text(fixture)).not.toContain(TOO_MANY);
  });

  it('si la asignación falla muestra el mensaje del backend', () => {
    repo.assignPeerEvaluators.and.returnValue(
      throwError(() => Object.assign(new Error(QUOTA_400), { status: 400 })),
    );
    spyOn(console, 'error');
    const fixture = render();
    fixture.componentInstance.evaluatorsControl.setValue(['11', '12', '13', '14']);

    fixture.componentInstance.onSubmit();

    expect(repo.assignPeerEvaluators).toHaveBeenCalledOnceWith('5', [11, 12, 13, 14]);
    expect(snackOpen).toHaveBeenCalledOnceWith(QUOTA_400, 'Cerrar', jasmine.any(Object));
  });

  it('si la asignación falla sin mensaje muestra "No se pudieron asignar los evaluadores."', () => {
    repo.assignPeerEvaluators.and.returnValue(throwError(() => new Error('')));
    spyOn(console, 'error');
    const fixture = render();
    fixture.componentInstance.evaluatorsControl.setValue(['11', '12', '13', '14']);

    fixture.componentInstance.onSubmit();

    expect(snackOpen).toHaveBeenCalledOnceWith(
      'No se pudieron asignar los evaluadores.',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('el éxito muestra cuántas asignaciones devolvió el backend, sus perfiles, los pares de riesgo y el texto sin fecha', () => {
    const response: AssignEvaluatorsResponse = {
      assignments: [
        { assignmentId: 301, evaluatorId: 11, profile: 'JURIDICO', isRiskPeer: true, deadlineDate: null },
        { assignmentId: 302, evaluatorId: 12, profile: 'SOCIEDAD_CIVIL', isRiskPeer: false, deadlineDate: null },
        { assignmentId: 303, evaluatorId: 13, profile: 'METODOLOGICO', isRiskPeer: true, deadlineDate: null },
      ],
    };
    repo.assignPeerEvaluators.and.returnValue(of(response));
    const fixture = render();
    fixture.componentInstance.evaluatorsControl.setValue(['11', '12', '13', '14']);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.success-count')?.textContent?.trim()).toBe('Se asignaron 3 evaluadores.');
    expect(root.querySelectorAll('.risk-badge').length).toBe(2);
    const profiles = Array.from(root.querySelectorAll('.assignment-profile'), (e) => e.textContent?.trim());
    expect(profiles).toEqual(['Jurídico', 'Sociedad Civil', 'Metodológico']);
    expect(root.querySelector('.deadline-text')?.textContent?.trim()).toBe(NO_DEADLINE);
  });

  it('con fecha límite del backend la muestra', () => {
    repo.assignPeerEvaluators.and.returnValue(
      of({
        assignments: [
          { assignmentId: 301, evaluatorId: 11, profile: 'JURIDICO', isRiskPeer: false, deadlineDate: '2026-12-03' },
        ],
      }),
    );
    const fixture = render();
    fixture.componentInstance.evaluatorsControl.setValue(['11', '12', '13', '14']);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.deadline-text')?.textContent?.trim()).toBe(
      'Fecha límite del dictamen: 03/12/2026',
    );
  });

  it('si falla la lista de evaluadores muestra el error con Reintentar', () => {
    repo.getEvaluatorsDashboard.and.returnValues(throwError(() => new Error('fallo')), of(EVALUATORS));
    const fixture = render();

    expect(text(fixture)).toContain('No pudimos cargar la lista de evaluadores.');
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Reintentar')
      ?.click();
    fixture.detectChanges();

    expect(repo.getEvaluatorsDashboard).toHaveBeenCalledTimes(2);
    expect(text(fixture)).not.toContain('No pudimos cargar la lista de evaluadores.');
    expect(fixture.componentInstance.evaluators().length).toBe(5);
  });
});
