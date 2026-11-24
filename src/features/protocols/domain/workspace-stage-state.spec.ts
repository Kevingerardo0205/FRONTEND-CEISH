import { Stage } from '@domain/value-objects/stage.vo';
import {
  currentStageFromBackend,
  deriveStageStates,
  determinedStageState,
  informationEmpty,
  informationError,
  informationLoading,
  informationUnavailable,
  operationAvailable,
  operationRestricted,
  selectedStageFromRoute,
  unavailableStageState,
  undeterminedStageState,
} from './workspace-stage-state';

describe('workspace-stage-state', () => {
  it('mantiene independientes la etapa actual y la seleccionada', () => {
    const current = currentStageFromBackend(Stage.fromBackend('RECEPCION'));
    const selected = selectedStageFromRoute('EVALUACION');

    expect(current).toEqual({ stage: Stage.fromBackend('RECEPCION'), source: 'backend' });
    expect(selected).toEqual({ stage: 'EVALUACION', source: 'route' });
    expect(current.stage?.code === selected.stage).toBeFalse();
  });

  it('seleccionar una etapa no modifica la etapa actual', () => {
    const current = currentStageFromBackend(Stage.fromBackend('RECEPCION'));
    const context = {
      current,
      selected: selectedStageFromRoute('RESOLUCION'),
    };

    expect(context.current).toBe(current);
    expect(context.current.stage?.code).toBe('RECEPCION');
    expect(context.selected.stage).toBe('RESOLUCION');
  });

  it('representa un estado individual determinado solo mediante un estado explícito', () => {
    expect(determinedStageState('COMPLETADA')).toEqual({
      kind: 'determined',
      status: 'COMPLETADA',
    });
  });

  it('representa información insuficiente sin inferir PENDIENTE o COMPLETADA', () => {
    const current = currentStageFromBackend(Stage.fromBackend('EVALUACION'));

    expect(undeterminedStageState()).toEqual({ kind: 'undetermined' });
    expect(current.stage?.code).toBe('EVALUACION');
    expect(undeterminedStageState()).not.toEqual({ kind: 'determined', status: 'PENDIENTE' });
    expect(undeterminedStageState()).not.toEqual({ kind: 'determined', status: 'COMPLETADA' });
  });

  it('distingue carga, sin registros, fuente no disponible y error', () => {
    expect(informationLoading()).toEqual({ kind: 'loading' });
    expect(informationEmpty()).toEqual({ kind: 'empty' });
    expect(informationUnavailable()).toEqual({ kind: 'unavailable' });
    expect(informationError()).toEqual({ kind: 'error' });
    expect(informationError('No se pudo consultar la fuente.')).toEqual({
      kind: 'error',
      message: 'No se pudo consultar la fuente.',
    });
  });

  it('no confunde sin registros, fuente no disponible y error de consulta', () => {
    expect(informationEmpty()).not.toEqual(informationUnavailable());
    expect(informationEmpty()).not.toEqual(informationError());
    expect(informationUnavailable()).not.toEqual(informationError());
  });

  it('mantiene la disponibilidad de operaciones independiente de la navegación', () => {
    const selected = selectedStageFromRoute('ASIGNACION');
    const available = operationAvailable();
    const restricted = operationRestricted('Requiere una condición de negocio.');

    expect(selected.stage).toBe('ASIGNACION');
    expect(available).toEqual({ state: 'available' });
    expect(restricted).toEqual({
      state: 'restricted',
      reason: 'Requiere una condición de negocio.',
    });
    expect('roles' in available).toBeFalse();
    expect('permissions' in available).toBeFalse();
    expect('roles' in restricted).toBeFalse();
    expect('permissions' in restricted).toBeFalse();
  });
});

describe('deriveStageStates (ep2c §3.4, estados derivados de la etapa actual)', () => {
  const stage = (code: string) => Stage.fromBackend(code);
  const done = determinedStageState('COMPLETADA');
  const running = determinedStageState('EN_CURSO');
  const pending = determinedStageState('PENDIENTE');
  const closed = determinedStageState('CERRADA');
  const notApplicable = determinedStageState('NO_APLICA');
  const unavailable = unavailableStageState();

  it('sin etapa del backend no deriva nada, ni siquiera con el protocolo cerrado', () => {
    expect(deriveStageStates(null, 'COMPLETO')).toEqual({});
    expect(deriveStageStates(null, 'RECHAZADO')).toEqual({});
  });

  it('protocolo en curso en ASIGNACION: anterior completada, actual en curso, posteriores pendientes', () => {
    expect(deriveStageStates(stage('ASIGNACION'), 'COMPLETO')).toEqual({
      RECEPCION: done,
      ASIGNACION: running,
      EVALUACION: pending,
      RESOLUCION: pending,
      SEGUIMIENTO: unavailable,
      RENOVACION: unavailable,
    });
  });

  it('protocolo en curso en RECEPCION: ninguna completada', () => {
    expect(deriveStageStates(stage('RECEPCION'), 'ENVIADO')).toEqual({
      RECEPCION: running,
      ASIGNACION: pending,
      EVALUACION: pending,
      RESOLUCION: pending,
      SEGUIMIENTO: unavailable,
      RENOVACION: unavailable,
    });
  });

  it('SEGUIMIENTO y RENOVACION son no disponibles aunque sean la etapa actual', () => {
    expect(deriveStageStates(stage('SEGUIMIENTO'), 'APROBADO')).toEqual({
      RECEPCION: done,
      ASIGNACION: done,
      EVALUACION: done,
      RESOLUCION: done,
      SEGUIMIENTO: unavailable,
      RENOVACION: unavailable,
    });
    expect(deriveStageStates(stage('RENOVACION'), 'APROBADO')['RENOVACION']).toEqual(unavailable);
  });

  it('un estado desconocido o nulo no cierra el protocolo', () => {
    expect(deriveStageStates(stage('EVALUACION'), null)['EVALUACION']).toEqual(running);
    expect(deriveStageStates(stage('EVALUACION'), 'ESTADO_NUEVO')['EVALUACION']).toEqual(running);
  });

  it('RECHAZADO en EVALUACION: anteriores completadas, EVALUACION cerrada, posteriores no aplica', () => {
    expect(deriveStageStates(stage('EVALUACION'), 'RECHAZADO')).toEqual({
      RECEPCION: done,
      ASIGNACION: done,
      EVALUACION: closed,
      RESOLUCION: notApplicable,
      SEGUIMIENTO: notApplicable,
      RENOVACION: notApplicable,
    });
  });

  it('ARCHIVADO_VENCIMIENTO en RECEPCION: la recepción cerrada y todas las demás no aplica', () => {
    expect(deriveStageStates(stage('RECEPCION'), 'ARCHIVADO_VENCIMIENTO')).toEqual({
      RECEPCION: closed,
      ASIGNACION: notApplicable,
      EVALUACION: notApplicable,
      RESOLUCION: notApplicable,
      SEGUIMIENTO: notApplicable,
      RENOVACION: notApplicable,
    });
  });

  it('protocolo cerrado gana a no disponible: RECHAZADO en SEGUIMIENTO cierra SEGUIMIENTO', () => {
    const states = deriveStageStates(stage('SEGUIMIENTO'), 'RECHAZADO');

    expect(states['SEGUIMIENTO']).toEqual(closed);
    expect(states['RENOVACION']).toEqual(notApplicable);
    expect(states['RESOLUCION']).toEqual(done);
  });

  it('cada etapa recibe exactamente un estado y nunca una etapa cerrada sin ser la actual', () => {
    for (const current of Stage.all()) {
      const states = deriveStageStates(current, 'RECHAZADO');
      const closedStages = Object.entries(states).filter(
        ([, state]) => state?.kind === 'determined' && state.status === 'CERRADA',
      );

      expect(Object.keys(states).length).toBe(6);
      expect(closedStages.map(([code]) => code)).toEqual([current.code]);
    }
  });
});
