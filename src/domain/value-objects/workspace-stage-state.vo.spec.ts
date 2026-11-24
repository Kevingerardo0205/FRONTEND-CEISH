import { Stage } from './stage.vo';
import { WorkspaceStageState, isStageNotApplicable, isStageNotReached } from './workspace-stage-state.vo';

describe('isStageNotReached (ep2c §3.8, F11-41 a F11-43)', () => {
  const stage = (code: string) => Stage.fromBackend(code);
  const pending: WorkspaceStageState = { kind: 'determined', status: 'PENDIENTE' };
  const unavailable: WorkspaceStageState = { kind: 'unavailable' };

  it('una etapa PENDIENTE posterior a la actual no se ha alcanzado', () => {
    expect(isStageNotReached(stage('ASIGNACION'), pending, stage('EVALUACION'))).toBeTrue();
  });

  it('SEGUIMIENTO y RENOVACION «no disponibles» posteriores a la actual tampoco', () => {
    expect(isStageNotReached(stage('EVALUACION'), unavailable, stage('SEGUIMIENTO'))).toBeTrue();
    expect(isStageNotReached(stage('EVALUACION'), unavailable, stage('RENOVACION'))).toBeTrue();
  });

  it('la etapa actual nunca se bloquea, aunque su estado dijera PENDIENTE', () => {
    expect(isStageNotReached(stage('EVALUACION'), pending, stage('EVALUACION'))).toBeFalse();
  });

  it('una anterior nunca se bloquea', () => {
    expect(isStageNotReached(stage('RESOLUCION'), pending, stage('ASIGNACION'))).toBeFalse();
  });

  it('completadas, cerradas y las que no aplican no se bloquean', () => {
    for (const status of ['COMPLETADA', 'CERRADA', 'NO_APLICA', 'EN_CURSO'] as const) {
      expect(
        isStageNotReached(stage('ASIGNACION'), { kind: 'determined', status }, stage('EVALUACION')),
      )
        .withContext(status)
        .toBeFalse();
    }
  });

  it('sin etapa del backend no se bloquea nada', () => {
    expect(isStageNotReached(null, pending, stage('EVALUACION'))).toBeFalse();
    expect(isStageNotReached(null, unavailable, stage('SEGUIMIENTO'))).toBeFalse();
  });

  it('sin estado determinado la etapa no se bloquea', () => {
    expect(isStageNotReached(stage('ASIGNACION'), undefined, stage('EVALUACION'))).toBeFalse();
    expect(isStageNotReached(stage('ASIGNACION'), { kind: 'undetermined' }, stage('EVALUACION'))).toBeFalse();
  });
});

describe('isStageNotApplicable (ep2c §3.8, F11-47, F11-48)', () => {
  it('solo la etapa NO_APLICA de un protocolo cerrado no se abre', () => {
    expect(isStageNotApplicable({ kind: 'determined', status: 'NO_APLICA' })).toBeTrue();
    for (const status of ['COMPLETADA', 'CERRADA', 'EN_CURSO', 'PENDIENTE'] as const) {
      expect(isStageNotApplicable({ kind: 'determined', status })).withContext(status).toBeFalse();
    }
    expect(isStageNotApplicable({ kind: 'unavailable' })).toBeFalse();
    expect(isStageNotApplicable({ kind: 'undetermined' })).toBeFalse();
    expect(isStageNotApplicable(undefined)).toBeFalse();
  });
});
